import React, { useState, useRef, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib'; // If you see a type error, run: npm install pdf-lib
import { Box, Button, Typography, TextField, Alert, List, ListItem, ListItemText, Paper, Chip, Stack, IconButton, Popover, CircularProgress, LinearProgress } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { usePageTitle } from '../hooks/usePageTitle';

// Helper to get file name without extension
function getFileNameWithoutExtension(filename: string) {
  const lastDot = filename.lastIndexOf('.');
  return lastDot === -1 ? filename : filename.slice(0, lastDot);
}

// Helper to get file extension
function getFileExtension(filename: string) {
  const lastDot = filename.lastIndexOf('.');
  return lastDot === -1 ? '' : filename.slice(lastDot);
}

interface GroupEntry {
  pages: number[];
  label: string;
}

function formatPagesAsRanges(pages: number[]): string {
  if (pages.length === 0) return '';
  const sorted = [...pages].sort((a, b) => a - b);
  const ranges: string[] = [];
  let start = sorted[0];
  let end = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === end + 1) {
      end = sorted[i];
    } else {
      ranges.push(start === end ? `${start}` : `${start}-${end}`);
      start = sorted[i];
      end = sorted[i];
    }
  }
  ranges.push(start === end ? `${start}` : `${start}-${end}`);
  return ranges.join(',');
}

function readFileWithProgress(file: File, onProgress: (pct: number) => void): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

// Helper to map a page number in the aggregate to its original file and page
function getFilePageMap(filePageCounts: number[]) {
  // Returns an array mapping aggregate page index (0-based) to {fileIdx, pageInFile}
  const map: { fileIdx: number; pageInFile: number }[] = [];
  let page = 0;
  for (let i = 0; i < filePageCounts.length; ++i) {
    for (let j = 0; j < filePageCounts[i]; ++j) {
      map[page] = { fileIdx: i, pageInFile: j + 1 };
      page++;
    }
  }
  return map;
}

const PdfSplitterPage: React.FC = () => {
  const { setPageTitle } = usePageTitle();

  // Set page title
  useEffect(() => {
    setPageTitle('PDF Splitter');
  }, [setPageTitle]);

  // Multi-file support
  const [pdfFiles, setPdfFiles] = useState<File[]>([]); // All selected files
  const [aggregatePdfDoc, setAggregatePdfDoc] = useState<PDFDocument | null>(null); // For preview
  const [aggregatePdfUrl, setAggregatePdfUrl] = useState<string | null>(null); // For iframe preview
  const [filePageCounts, setFilePageCounts] = useState<number[]>([]); // Number of pages in each file
  const [fileNames, setFileNames] = useState<string[]>([]); // Names of each file

  // Page/group selection
  const [individualInput, setIndividualInput] = useState<string>('');
  const [individualPages, setIndividualPages] = useState<number[]>([]); // Each is a page number (1-based in aggregate)
  const [groupInput, setGroupInput] = useState<string>('');
  const [groups, setGroups] = useState<GroupEntry[]>([]); // Each group is an array of aggregate page numbers (1-based)
  const [groupValidationError, setGroupValidationError] = useState<string | null>(null);
  const [popoverAnchorEl, setPopoverAnchorEl] = useState<HTMLElement | null>(null);
  const [editingGroupIdx, setEditingGroupIdx] = useState<number | null>(null);
  const [popoverInput, setPopoverInput] = useState<string>('');
  const [loadingState, setLoadingState] = useState<{
    fileIdx: number;
    totalFiles: number;
    filePct: number;
    phase: 'reading' | 'parsing' | 'aggregating';
  } | null>(null);
  const [splitState, setSplitState] = useState<{
    done: number;
    total: number;
    pagesDone: number;
    pagesTotal: number;
    label: string;
  } | null>(null);

  // Output and splitting
  const [outputDirHandle, setOutputDirHandle] = useState<any>(null); // For File System Access API
  const [outputDir, setOutputDir] = useState<string>(''); // For fallback
  const [splitFiles, setSplitFiles] = useState<{ name: string; blob: Blob }[]>([]);
  const [successFiles, setSuccessFiles] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dirInputRef = useRef<HTMLInputElement>(null);

  // Load outputDir from localStorage on mount (for fallback)
  useEffect(() => {
    const savedDir = localStorage.getItem('pdfsplitter_output_dir');
    if (savedDir) setOutputDir(savedDir);
  }, []);

  // Save outputDir to localStorage when it changes (for fallback)
  useEffect(() => {
    if (outputDir) localStorage.setItem('pdfsplitter_output_dir', outputDir);
  }, [outputDir]);

  // Clean up object URL for PDF preview
  useEffect(() => {
    return () => {
      if (aggregatePdfUrl) URL.revokeObjectURL(aggregatePdfUrl);
    };
  }, [aggregatePdfUrl]);

  // Parse a single page or range string (e.g. '3', '5-8') into an array of numbers
  function parsePageOrRange(str: string): number[] {
    const rangeMatch = str.match(/^\s*(\d+)\s*-\s*(\d+)\s*$/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      if (start > 0 && end >= start) {
        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
      }
      return [];
    }
    const single = parseInt(str.trim(), 10);
    return !isNaN(single) && single > 0 ? [single] : [];
  }

  // Add an individual page or range from input
  const handleAddIndividual = () => {
    const parts = individualInput.split(',').map(s => s.trim()).filter(Boolean);
    let newPages: number[] = [];
    for (const part of parts) {
      newPages = newPages.concat(parsePageOrRange(part));
    }
    // Remove duplicates and sort
    newPages = Array.from(new Set([...individualPages, ...newPages])).sort((a, b) => a - b);
    setIndividualPages(newPages);
    setIndividualInput('');
  };

  // Remove an individual page
  const handleRemoveIndividual = (page: number) => {
    setIndividualPages(prev => prev.filter(p => p !== page));
  };

  // Add a group from input string (e.g. '1,3,7' or '1,3,5-8')
  const handleAddGroup = () => {
    setGroupValidationError(null);
    const parts = groupInput.split(',').map(s => s.trim()).filter(Boolean);
    let group: number[] = [];
    for (const part of parts) {
      group = group.concat(parsePageOrRange(part));
    }
    // Remove duplicates and sort
    group = Array.from(new Set(group)).sort((a, b) => a - b);
    if (group.length > 0) {
      // Validate group: must all be from the same file
      if (!validateGroupSingleFile(group)) {
        setGroupValidationError('A group cannot contain pages from multiple files.');
        return;
      }
      setGroups(prev => [...prev, { pages: group, label: '' }]);
      setGroupInput('');
    }
  };

  // Remove a group by index
  const handleRemoveGroup = (idx: number) => {
    setGroups(prev => prev.filter((_, i) => i !== idx));
  };

  // Validate that all pages in a group are from the same file
  function validateGroupSingleFile(pages: number[]): boolean {
    if (!filePageCounts.length) return true;
    const map = getFilePageMap(filePageCounts);
    const fileIdxs = pages.map(page => map[page - 1]?.fileIdx).filter(idx => idx !== undefined);
    return new Set(fileIdxs).size <= 1;
  }

  const handleUpdateGroupLabel = (idx: number, label: string) => {
    setGroups(prev => prev.map((g, i) => i === idx ? { ...g, label } : g));
  };

  // Handle PDF file selection (multi-file)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setPdfFiles(files);
      setSuccessFiles([]);
      setError(null);
      setIndividualPages([]);
      setGroups([]);
      setIndividualInput('');
      setGroupInput('');
      setFileNames(files.map(f => getFileNameWithoutExtension(f.name)));
      // Load and aggregate PDFs
      try {
        const pdfDocs: PDFDocument[] = [];
        for (let i = 0; i < files.length; i++) {
          setLoadingState({ fileIdx: i, totalFiles: files.length, filePct: 0, phase: 'reading' });
          const buf = await readFileWithProgress(files[i], pct =>
            setLoadingState({ fileIdx: i, totalFiles: files.length, filePct: pct, phase: 'reading' })
          );
          setLoadingState({ fileIdx: i, totalFiles: files.length, filePct: 100, phase: 'parsing' });
          pdfDocs.push(await PDFDocument.load(buf));
        }
        setFilePageCounts(pdfDocs.map(doc => doc.getPageCount()));
        setLoadingState({ fileIdx: files.length - 1, totalFiles: files.length, filePct: 100, phase: 'aggregating' });
        // Aggregate into one PDF for preview
        const aggPdf = await PDFDocument.create();
        for (const doc of pdfDocs) {
          const pages = await aggPdf.copyPages(doc, Array.from({ length: doc.getPageCount() }, (_, i) => i));
          pages.forEach(page => aggPdf.addPage(page));
        }
        setAggregatePdfDoc(aggPdf);
        const pdfBytes = await aggPdf.save();
        const url = URL.createObjectURL(new Blob([pdfBytes], { type: 'application/pdf' }));
        setAggregatePdfUrl(url);
        setLoadingState(null);
      } catch (err: any) {
        setLoadingState(null);
        setError('Failed to load and aggregate PDFs: ' + (err.message || err.toString()));
      }
    }
  };

  // Handle directory selection (fallback)
  const handleDirChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const firstFile = e.target.files[0];
      // @ts-ignore
      const webkitRelativePath = firstFile.webkitRelativePath as string;
      if (webkitRelativePath) {
        const dir = webkitRelativePath.split('/')[0];
        setOutputDir(dir);
      }
    }
  };

  // Handle directory selection using File System Access API
  const handleChooseDir = async () => {
    if ('showDirectoryPicker' in window) {
      try {
        // @ts-ignore
        const dirHandle = await (window as any).showDirectoryPicker();
        setOutputDirHandle(dirHandle);
        setOutputDir(''); // Clear fallback dir
      } catch (err: any) {
        setError('Directory selection cancelled or failed.');
      }
    } else {
      setError('File System Access API not supported in this browser. Use Chrome/Edge for best experience.');
    }
  };

  // Main split logic
  const handleSplit = async () => {
    try {
      console.log('handleSplit called');
      console.log('pdfFiles.length:', pdfFiles.length);
      console.log('groups.length:', groups.length);
      console.log('individualPages.length:', individualPages.length);
      console.log('outputDirHandle:', outputDirHandle);
      console.log('outputDir:', outputDir);
      
      setError(null);
      setSuccessFiles([]);
      setSplitFiles([]);
    if (!pdfFiles.length) {
      setError('Please select PDF files.');
      return;
    }
    let dirHandle = outputDirHandle;
    if ('showDirectoryPicker' in window && !dirHandle) {
      try {
        // @ts-ignore
        dirHandle = await (window as any).showDirectoryPicker();
        setOutputDirHandle(dirHandle);
      } catch (err: any) {
        setError('Directory selection cancelled or failed.');
        return;
      }
    }
    if (!dirHandle && !outputDir) {
      setError('Please select an output directory.');
      return;
    }
    
    // Request write permission immediately while user activation is still valid
    if (dirHandle) {
      try {
        const permission = await dirHandle.requestPermission({ mode: 'readwrite' });
        if (permission !== 'granted') {
          setError('Write permission not granted for the selected directory.');
          return;
        }
      } catch (err: any) {
        console.error('Permission request error:', err);
        setError('Failed to obtain write permission: ' + (err.message || err.toString()));
        return;
      }
    }
    // Prepare filePageMap
    const map = getFilePageMap(filePageCounts);
    // Prepare split instructions: for each file, collect the pages to extract
    const fileSplits: { [fileIdx: number]: number[] } = {};
    const groupPages: Set<number> = new Set(); // Track pages that are part of groups
    
    // First, collect all pages that are part of groups
    for (const groupEntry of groups) {
      if (!validateGroupSingleFile(groupEntry.pages)) {
        setGroupValidationError('A group cannot contain pages from multiple files.');
        return;
      }
      for (const page of groupEntry.pages) {
        groupPages.add(page);
      }
    }

    // Individual pages
    for (const page of individualPages) {
      const m = map[page - 1];
      if (!m) continue;
      if (!fileSplits[m.fileIdx]) fileSplits[m.fileIdx] = [];
      fileSplits[m.fileIdx].push(m.pageInFile);
    }
    
    // Remove duplicates and sort
    for (const idx in fileSplits) {
      fileSplits[idx] = Array.from(new Set(fileSplits[idx])).sort((a, b) => a - b);
    }
    // Compute total create-phase work items
    const individualTotal = Object.values(fileSplits).reduce((sum, pages) => sum + pages.length, 0);
    const createTotal = individualTotal + groups.length;
    const pagesTotal = individualTotal + groups.reduce((sum, g) => sum + g.pages.length, 0);
    setSplitState({ done: 0, total: createTotal, pagesDone: 0, pagesTotal, label: 'Creating PDFs' });

    // Cache loaded PDFDocuments per source file to avoid re-reading on each group
    const pdfDocCache: { [fileIdx: number]: PDFDocument } = {};
    const loadPdfDoc = async (fileIdx: number): Promise<PDFDocument> => {
      if (!pdfDocCache[fileIdx]) {
        const arrayBuffer = await pdfFiles[fileIdx].arrayBuffer();
        pdfDocCache[fileIdx] = await PDFDocument.load(arrayBuffer);
      }
      return pdfDocCache[fileIdx];
    };

    // Split each file accordingly
    const createdFiles: { name: string; blob: Blob }[] = [];

    // Process individual pages
    for (const [fileIdxStr, pages] of Object.entries(fileSplits)) {
      const fileIdx = parseInt(fileIdxStr, 10);
      const file = pdfFiles[fileIdx];
      const fileName = getFileNameWithoutExtension(file.name);
      const ext = getFileExtension(file.name);
      const pdfDoc = await loadPdfDoc(fileIdx);
      for (const pageNum of pages) {
        if (pageNum < 1 || pageNum > pdfDoc.getPageCount()) continue;
        const newPdf = await PDFDocument.create();
        const [copiedPage] = await newPdf.copyPages(pdfDoc, [pageNum - 1]);
        newPdf.addPage(copiedPage);
        const pdfBytes = await newPdf.save();
        const outName = `${fileName}/${fileName}[${pageNum}]${ext}`;
        createdFiles.push({ name: outName, blob: new Blob([pdfBytes], { type: 'application/pdf' }) });
        setSplitState(prev => prev ? { ...prev, done: prev.done + 1, pagesDone: prev.pagesDone + 1 } : null);
      }
    }

    // Process groups (independent of individual pages)
    for (const groupEntry of groups) {
      const { pages: group, label: customLabel } = groupEntry;
      if (!validateGroupSingleFile(group)) continue;
      const m = map[group[0] - 1];
      if (!m) continue;
      const fileIdx = m.fileIdx;
      const file = pdfFiles[fileIdx];
      const fileName = getFileNameWithoutExtension(file.name);
      const ext = getFileExtension(file.name);
      const pdfDoc = await loadPdfDoc(fileIdx);
      const indices = group.map(p => map[p - 1].pageInFile - 1).filter(idx => idx >= 0 && idx < pdfDoc.getPageCount());
      const newPdf = await PDFDocument.create();
      const copiedPages = await newPdf.copyPages(pdfDoc, indices);
      copiedPages.forEach(page => newPdf.addPage(page));
      const min = Math.min(...group.map(p => map[p - 1].pageInFile));
      const max = Math.max(...group.map(p => map[p - 1].pageInFile));
      const autoLabel = min === max ? `${min}` : `${min}-${max}`;
      const label = customLabel.trim() || autoLabel;
      const outName = `${fileName}/${fileName}[${label}]${ext}`;
      const pdfBytes = await newPdf.save();
      createdFiles.push({ name: outName, blob: new Blob([pdfBytes], { type: 'application/pdf' }) });
      setSplitState(prev => prev ? { ...prev, done: prev.done + 1, pagesDone: prev.pagesDone + group.length } : null);
    }

    setSplitFiles(createdFiles);

    // Phase 2: write files
    setSplitState({ done: 0, total: createdFiles.length, pagesDone: pagesTotal, pagesTotal, label: 'Writing files' });

    if (dirHandle) {
      for (const file of createdFiles) {
        // Parse the path to create nested directories
        const pathParts = file.name.split('/');
        const fileName = pathParts.pop()!;
        let currentDir = dirHandle;
        // Create nested directories
        for (const dirName of pathParts) {
          currentDir = await currentDir.getDirectoryHandle(dirName, { create: true });
        }
        const fileHandle = await currentDir.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(file.blob);
        await writable.close();
        setSplitState(prev => prev ? { ...prev, done: prev.done + 1 } : null);
      }
      setSuccessFiles(createdFiles.map(f => f.name));
    } else {
      // Fallback: trigger downloads
      for (const file of createdFiles) {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(file.blob);
        a.download = file.name;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setSplitState(prev => prev ? { ...prev, done: prev.done + 1 } : null);
      }
      setSuccessFiles(createdFiles.map(f => f.name));
    }
    setSplitState(null);
    } catch (error: any) {
      console.error('Error in handleSplit:', error);
      setSplitState(null);
      setError('An error occurred while splitting PDFs: ' + (error.message || error.toString()));
    }
  };

  return (
    <Box sx={{ width: '100vw', height: '100vh', display: 'flex' }}>
      {/* Left: Input Panel */}
      <Box sx={{ width: '25%', height: '100%', p: 3, boxSizing: 'border-box', borderRight: '1px solid #eee', overflowY: 'auto', bgcolor: '#fafbfc' }}>
        <Typography variant="h4" gutterBottom>PDF Splitter Tool</Typography>
        <Paper sx={{ p: 2, mb: 2, boxShadow: 0 }}>
          <Button variant="contained" component="label" sx={{ mb: 2, width: '100%' }}>
            Select PDF File(s)
            <input type="file" accept="application/pdf" multiple hidden onChange={handleFileChange} ref={fileInputRef} />
          </Button>
          {pdfFiles.length > 0 && (
            <Typography variant="body2" sx={{ mb: 2 }}>
              Selected files: {pdfFiles.map(f => f.name).join(', ')}
            </Typography>
          )}
          <TextField
            label="Add Individual Page or Range (e.g. 3 or 5-8)"
            value={individualInput}
            onChange={e => {
              // Only allow numbers, comma, hyphen
              const val = e.target.value.replace(/[^0-9,\-]/g, '');
              setIndividualInput(val);
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddIndividual();
              }
            }}
            fullWidth
            sx={{ mb: 1 }}
            helperText="Type a page or range, or comma-separated, then press Enter"
          />
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mb: 2 }}>
            {individualPages.map((page, idx) => (
              <Chip
                key={page}
                label={page}
                onDelete={() => handleRemoveIndividual(page)}
                deleteIcon={<DeleteIcon />}
                sx={{ mb: 1 }}
              />
            ))}
          </Stack>
          <TextField
            label="Add Group (e.g. 1,3,7 or 1,3,5-8)"
            value={groupInput}
            onChange={e => {
              // Only allow numbers, comma, hyphen
              const val = e.target.value.replace(/[^0-9,\-]/g, '');
              setGroupInput(val);
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddGroup();
              }
            }}
            fullWidth
            sx={{ mb: 1 }}
            helperText="Type pages and/or ranges separated by commas, then press Enter to add group"
          />
          <Stack direction="column" spacing={1} sx={{ mb: 2 }}>
            {groups.map((groupEntry, idx) => (
              <Stack key={idx} direction="row" alignItems="center" spacing={0.5}>
                <IconButton
                  size="small"
                  onClick={e => {
                    setPopoverAnchorEl(e.currentTarget);
                    setEditingGroupIdx(idx);
                    setPopoverInput(groupEntry.label);
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <Box
                  sx={{
                    display: 'inline-flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    border: '1px solid rgba(0,0,0,0.23)',
                    borderRadius: '16px',
                    px: 1.5,
                    py: 0.5,
                    bgcolor: 'rgba(0,0,0,0.08)',
                    minWidth: 0,
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.3, whiteSpace: 'nowrap' }}>
                    [{formatPagesAsRanges(groupEntry.pages)}]
                  </Typography>
                  {groupEntry.label && (
                    <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.2 }}>
                      {groupEntry.label}
                    </Typography>
                  )}
                </Box>
                <IconButton size="small" onClick={() => handleRemoveGroup(idx)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>
            ))}
          </Stack>
          <Popover
            open={Boolean(popoverAnchorEl)}
            anchorEl={popoverAnchorEl}
            onClose={() => { setPopoverAnchorEl(null); setEditingGroupIdx(null); }}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          >
            <Box sx={{ p: 2 }}>
              <TextField
                size="small"
                autoFocus
                label="Custom label"
                placeholder="e.g. 2.2024"
                value={popoverInput}
                onChange={e => setPopoverInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    if (editingGroupIdx !== null) handleUpdateGroupLabel(editingGroupIdx, popoverInput);
                    setPopoverAnchorEl(null);
                    setEditingGroupIdx(null);
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    setPopoverAnchorEl(null);
                    setEditingGroupIdx(null);
                  }
                }}
                sx={{ width: 200 }}
              />
            </Box>
          </Popover>
          {groupValidationError && (
            <Alert severity="error" sx={{ mb: 2 }}>{groupValidationError}</Alert>
          )}
          {('showDirectoryPicker' in window) ? (
            <Typography variant="body2" sx={{ mb: 2, color: '#888' }}>
              Output directory will be selected when you click Split PDF (Chrome/Edge only)
            </Typography>
          ) : (
            <Button
              variant="outlined"
              component="label"
              sx={{ mb: 2, width: '100%' }}
            >
              Select Output Directory (simulated)
              {/* @ts-ignore: webkitdirectory is non-standard but supported in Chromium browsers */}
              <input
                type="file"
                // @ts-ignore
                webkitdirectory="true"
                // @ts-ignore
                directory="true"
                hidden
                onChange={e => setOutputDir(e.target.files && e.target.files.length > 0 ? e.target.files[0].webkitRelativePath.split('/')[0] : '')}
                ref={dirInputRef}
              />
            </Button>
          )}
          {(outputDirHandle || outputDir) && (
            <Typography variant="body2" sx={{ mb: 2 }}>
              Output directory: {outputDirHandle ? outputDirHandle.name : outputDir}
            </Typography>
          )}
          <Button
            variant="contained"
            color="primary"
            onClick={handleSplit}
            disabled={!pdfFiles.length || (groups.length === 0 && individualPages.length === 0) || splitState !== null}
            sx={{ width: '100%' }}
          >
            Split PDF
          </Button>
          {splitState && (
            <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {splitState.label} — files: {splitState.done} / {splitState.total}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={splitState.total > 0 ? Math.round((splitState.done / splitState.total) * 100) : 0}
                  sx={{ mt: 0.25 }}
                />
              </Box>
              {splitState.label === 'Creating PDFs' && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Pages processed: {splitState.pagesDone} / {splitState.pagesTotal}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={splitState.pagesTotal > 0 ? Math.round((splitState.pagesDone / splitState.pagesTotal) * 100) : 0}
                    sx={{ mt: 0.25 }}
                    color="secondary"
                  />
                </Box>
              )}
            </Box>
          )}
        </Paper>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {successFiles.length > 0 && (
          <Alert severity="success" sx={{ mb: 2 }}>
            <Typography>PDF split successfully! Files created:</Typography>
            <List>
              {successFiles.map(f => (
                <ListItem key={f}><ListItemText primary={f} /></ListItem>
              ))}
            </List>
          </Alert>
        )}
      </Box>
      {/* Right: PDF Preview */}
      <Box sx={{ width: '75%', height: '100%', p: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f6fa' }}>
        {loadingState !== null ? (() => {
          const isIndeterminate = loadingState.phase !== 'reading';
          const pct = Math.round((loadingState.fileIdx / loadingState.totalFiles) * 100 + (loadingState.filePct / loadingState.totalFiles));
          const phaseLabel =
            loadingState.phase === 'reading'
              ? `Reading file ${loadingState.fileIdx + 1} of ${loadingState.totalFiles}…`
              : loadingState.phase === 'parsing'
              ? `Parsing file ${loadingState.fileIdx + 1} of ${loadingState.totalFiles}…`
              : 'Building preview…';
          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                <CircularProgress variant={isIndeterminate ? 'indeterminate' : 'determinate'} value={isIndeterminate ? undefined : pct} size={80} />
                {!isIndeterminate && (
                  <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="body2" color="text.secondary">{pct}%</Typography>
                  </Box>
                )}
              </Box>
              <Typography variant="body2" color="text.secondary">{phaseLabel}</Typography>
              {loadingState.phase === 'parsing' && (
                <Typography variant="caption" color="text.secondary">
                  (pdf-lib parsing — no sub-progress available)
                </Typography>
              )}
            </Box>
          );
        })() : aggregatePdfUrl ? (
          <iframe src={aggregatePdfUrl} width="95%" height="95%" title="PDF Preview" style={{ border: '1px solid #ccc', borderRadius: 8, background: 'white' }} />
        ) : (
          <Typography variant="h6" color="textSecondary">No PDF selected</Typography>
        )}
      </Box>
    </Box>
  );
};

export default PdfSplitterPage; 
