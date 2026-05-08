import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Alert } from '@mui/material';
import { useAppSelector } from '../redux/hooks';
import { selectSelectedClientId } from '../redux/features/client/clientSelectors';
import { usePageTitle } from '../hooks/usePageTitle';
import PdfDisplay from '../components/PdfDisplay';
import { DocumentClassificationPanel } from '../components/DocumentClassificationPanel';
import ClassifyDocumentButton from '../components/ClassifyDocumentButton';

const ViewFileDataPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const clientId = useAppSelector(selectSelectedClientId);
  const { setPageTitle } = usePageTitle();
  const [refreshKey, setRefreshKey] = useState(0);

  const fileId = searchParams.get('fileId');

  useEffect(() => {
    if (fileId) {
      setPageTitle(`View File: ${fileId}`);
    }
  }, [fileId, setPageTitle]);

  if (!clientId || !fileId) {
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
      {/* Left column — PDF viewer, sticky so it stays visible while scrolling right column */}
      <Box sx={{ flex: 1.2, minWidth: 0, position: 'sticky', top: 0, maxHeight: '100vh', overflow: 'auto' }}>
        <PdfDisplay fileId={fileId} />
      </Box>

      {/* Right column — editors */}
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <ClassifyDocumentButton
          fileId={fileId}
          onClassified={() => setRefreshKey(k => k + 1)}
        />
        <DocumentClassificationPanel
          key={`panel-${refreshKey}`}
          fileId={fileId}
          clientId={clientId}
        />
      </Box>
    </Box>
  );
};

export default ViewFileDataPage;
