# Bank Statement Analysis Frontend

A React TypeScript frontend application for analyzing and managing bank statement data extracted from PDF documents.

## Features

### 1. Document Upload & Analysis
- **Client Management**: Create and select clients for document processing
- **Drag & Drop Upload**: Upload PDF bank statements with drag-and-drop interface
- **Azure Integration**: Upload documents to Azure Blob Storage using SAS tokens
- **Real-time Status Tracking**: Monitor document analysis progress with live updates
- **Progress Visualization**: View detailed progress for each document and page

### 2. Statement Viewing (Coming Soon)
- View all extracted bank statement data
- Aggregate financial summaries
- Filtering and search capabilities
- Export functionality

### 3. Statement Editing (Coming Soon)
- Excel-like editing experience
- Inline editing capabilities
- Bulk operations (copy, paste, delete)
- Data validation and formatting
- Save changes to backend

## Technology Stack

- **React 19** with TypeScript
- **Material-UI (MUI) v6** for UI components
- **React Router** for navigation
- **Redux Toolkit** for state management
- **React Redux** for Redux integration
- **Axios** for API communication
- **React Dropzone** for file uploads
- **MUI Data Grid** for spreadsheet-like editing (planned)
- **Microsoft Authentication Library (MSAL)** for Azure AD authentication

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend API server running

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd bank-statement-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
Create a `.env` file in the root directory:
```env
# Azure AD Configuration
REACT_APP_AZURE_CLIENT_ID=your-azure-client-id
REACT_APP_AZURE_TENANT_ID=your-azure-tenant-id

# API Configuration
REACT_APP_API_BASE_URL=http://localhost:3001

# Azure Storage Configuration
REACT_APP_AZURE_STORAGE_ACCOUNT=goldbergtaxlawanalyzed
```

### Azure AD Setup

To enable Microsoft Entra authentication:

1. **Register your application in Azure AD:**
   - Go to Azure Portal > Azure Active Directory > App registrations
   - Create a new registration
   - Set the redirect URI to `http://localhost:3000` (for development)
   - Note the Application (client) ID and Directory (tenant) ID

2. **Configure API permissions:**
   - Add the required API permissions for your backend API
   - Update the scopes in `src/services/auth.ts` to match your API

3. **Update environment variables:**
   - Set `REACT_APP_AZURE_CLIENT_ID` to your application's client ID
   - Set `REACT_APP_AZURE_TENANT_ID` to your tenant ID

4. Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:3000`.

## Authentication

The application uses Microsoft Entra (Azure AD) authentication. All API requests include an authorization header with the user's access token.

### Authentication Flow

1. **Login**: Users are redirected to Microsoft's login page
2. **Token Management**: Access tokens are automatically refreshed
3. **API Authorization**: All API requests include the Bearer token
4. **Logout**: Users can sign out through the user menu in the navigation

## API Integration

The frontend integrates with the following backend APIs (all requests include authorization headers):

### Client Management
- `GET /api/ListClients` - List all clients
- `POST /api/NewClient` - Create a new client

### Document Upload
- `GET /api/RequestSASToken` - Get SAS token for Azure upload
- `POST /api/InitAnalyzeDocuments` - Start document analysis

### Status Tracking
- `GET [statusQueryURL]` - Poll for analysis status

### Document Processing
- `POST /api/GetDocumentDataModel` - Get document data model
- `POST /api/PutDocumentDataModel` - Update document data model
- `POST /api/GetDocumentClassification` - Get document classification
- `POST /api/PutDocumentClassification` - Update document classification
- `POST /api/AnalyzePage` - Analyze specific pages
- `POST /api/UpdateStatementModels` - Update statement models
- `POST /api/LoadTransactionsFromModel` - Load transactions from model

### CSV Operations
- `POST /api/WriteCsvSummary` - Generate CSV summary

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout.tsx      # Main layout with navigation
│   ├── ClientSelector.tsx  # Client selection component
│   ├── DocumentUpload.tsx  # File upload component
│   └── AnalysisStatus.tsx  # Status tracking component
├── pages/              # Page components
│   ├── UploadPage.tsx  # Main upload page
│   ├── StatementsPage.tsx  # View statements page
│   └── EditPage.tsx    # Edit statements page
├── redux/              # Redux state management
│   ├── store/          # Store configuration
│   ├── features/       # Feature-based slices
│   │   ├── auth/       # Authentication state
│   │   ├── files/      # File management state
│   │   └── analysis/   # Analysis state
│   └── hooks/          # Typed Redux hooks
├── services/           # API services
│   └── api.ts         # API service layer
├── types/              # TypeScript type definitions
│   └── api.ts         # API type definitions
└── App.tsx            # Main application component
```

## State Management

The application uses Redux Toolkit for centralized state management:

### Redux Store Structure
- **Auth State**: User authentication, login/logout status
- **Files State**: Uploaded files, upload progress, file metadata
- **Analysis State**: Analysis status, results, progress tracking

### Key Features
- **Type-safe**: Full TypeScript support with typed hooks
- **Async Operations**: Redux Toolkit async thunks for API calls
- **Error Handling**: Centralized error state management
- **Performance**: Optimized re-renders with selective state access

## Development

### Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

### Code Style

The project uses:
- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting
- Material-UI design system

## Deployment

### Build for Production

```bash
npm run build
```

This creates a `build` folder with optimized production files.

### Environment Configuration

Set the following environment variables for production:

```env
REACT_APP_API_BASE_URL=https://your-api-server.com
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

[Add your license information here]

## Support

For support and questions, please contact [your contact information].
