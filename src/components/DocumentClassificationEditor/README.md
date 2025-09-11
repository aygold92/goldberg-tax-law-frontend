# DocumentClassificationEditor Component

A comprehensive React component for editing document classifications with page ranges and classification types.

## Features

- **Auto-load**: Automatically fetches existing classifications from the API
- **Page Range Editing**: Intuitive interface for selecting page ranges
- **Classification Types**: Dropdown selection using existing `ClassificationType` enum
- **Validation**: Real-time validation for page overlaps and invalid ranges
- **Save/Reload**: Save changes to API or reload fresh data from server
- **Unsaved Changes Warning**: Alerts user about unsaved changes before reloading
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Preview**: Shows how the document will be split based on current classifications

## Usage

```tsx
import { DocumentClassificationEditor } from './components/DocumentClassificationEditor';

function MyComponent() {
  return (
    <DocumentClassificationEditor
      clientName="my-client"
      filename="document.pdf"
      readOnly={false} // optional, defaults to false
    />
  );
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `clientName` | `string` | Yes | The client name for API calls |
| `filename` | `string` | Yes | The filename to edit classifications for |
| `readOnly` | `boolean` | No | If true, disables editing (default: false) |

## API Integration

The component integrates with the following API endpoints:

- `GET /api/GetDocumentClassification` - Fetches existing classifications
- `POST /api/PutDocumentClassification` - Saves classification changes

## Component Structure

```
DocumentClassificationEditor/
├── DocumentClassificationEditor.tsx    # Main component
├── ClassificationItemEditor.tsx        # Individual classification editor
├── PageRangeSelector.tsx               # Page range selection
├── ClassificationDropdown.tsx          # Classification type selector
├── DocumentClassificationEditor.module.css # Styles
├── index.ts                            # Export barrel
└── README.md                           # This file
```

## Validation Rules

- Page numbers must be greater than 0
- No overlapping page ranges between classifications
- Valid classification types from `ClassificationType` enum
- At least one page must be selected per classification

## State Management

The component uses local state management (following project preferences) and includes:

- Loading states for API calls
- Error handling and display
- Success feedback
- Unsaved changes tracking
- Real-time validation
