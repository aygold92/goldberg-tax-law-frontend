# Bank Statement Analysis Frontend

A React TypeScript application for analyzing and managing bank statement data extracted from PDF documents.

## Features

- **Document Upload**: Drag & drop PDF bank statements with Azure Blob Storage integration
- **Real-time Analysis**: Monitor document analysis progress with live status updates
- **Statement Editing**: Excel-like editing experience with inline editing capabilities
- **Client Management**: Create and select clients for document processing
- **Authentication**: Microsoft Entra (Azure AD) integration

## Quick Start

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment:**
Create `.env` file:
```env
REACT_APP_AZURE_CLIENT_ID=your-azure-client-id
REACT_APP_AZURE_TENANT_ID=your-azure-tenant-id
REACT_APP_API_BASE_URL=http://localhost:3001
REACT_APP_AZURE_STORAGE_ACCOUNT=your-storage-account
```

3. **Start development server:**
```bash
npm start
```

## Azure AD Setup

1. Register app in Azure Portal > Azure Active Directory > App registrations
2. Set redirect URI to `http://localhost:3000`
3. Configure API permissions
4. Update environment variables with client/tenant IDs

## Available Scripts

- `npm start` - Development server
- `npm build` - Production build
- `npm test` - Run tests

All requests include Azure AD authorization headers.
