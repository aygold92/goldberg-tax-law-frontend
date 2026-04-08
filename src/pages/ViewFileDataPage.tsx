import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Alert } from '@mui/material';
import { useAppSelector } from '../redux/hooks';
import { selectSelectedClient } from '../redux/features/client/clientSelectors';
import { usePageTitle } from '../hooks/usePageTitle';
import PdfDisplay from '../components/PdfDisplay';
import { DocumentClassificationEditor } from '../components/DocumentClassificationEditor';
import { AnalyzePagesSelector } from '../components/AnalyzePagesSelector';
import { FileMetadataEditor } from '../components/FileMetadataEditor';
import ClassifyDocumentButton from '../components/ClassifyDocumentButton';

const ViewFileDataPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const clientName = useAppSelector(selectSelectedClient);
  const { setPageTitle } = usePageTitle();
  const [refreshKey, setRefreshKey] = useState(0);

  const rawFilename = searchParams.get('filename');
  const decodedFilename = rawFilename ? decodeURIComponent(rawFilename) : null;

  useEffect(() => {
    if (decodedFilename) {
      setPageTitle(`View File: ${decodedFilename}`);
    }
  }, [decodedFilename, setPageTitle]);

  if (!clientName || !decodedFilename) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          Please select a client and navigate to this page via the upload page.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 3, alignItems: 'flex-start', p: 3 }}>
      {/* Left column — PDF viewer */}
      <Box sx={{ flex: 1.2, minWidth: 0 }}>
        <PdfDisplay clientName={clientName} filename={decodedFilename} />
      </Box>

      {/* Right column — editors */}
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <ClassifyDocumentButton
          clientName={clientName}
          filename={decodedFilename}
          onClassified={() => setRefreshKey(k => k + 1)}
        />
        <DocumentClassificationEditor
          key={`classification-${refreshKey}`}
          clientName={clientName}
          filename={decodedFilename}
        />
        <AnalyzePagesSelector
          key={`analyze-${refreshKey}`}
          clientName={clientName}
          filename={decodedFilename}
        />
        <FileMetadataEditor
          key={`metadata-${refreshKey}`}
          clientName={clientName}
          filename={decodedFilename}
        />
      </Box>
    </Box>
  );
};

export default ViewFileDataPage;
