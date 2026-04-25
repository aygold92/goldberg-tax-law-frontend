# API migration Differences
Aside from the obvious differences shown in the API (including, most importantly, that all entities now have an ID), the behavioral differences are described below:
## ListInputDocuments API
On the UploadPage, instead of fetching files from azure, we use the `ListInputDocuments` API
## Document Metadata
The information was previously known as InputFileMetadata is now included in the `ListInputDocuments` and `GetInputFileSummary` APIs.  This information is now calculated by the backend and not something that can be directly updated.
## File Upload
Instead of requesting a SAS token which gives access to upload any file you want, the file upload page requests a write token for each file the user uploads (in the batch API `RequestWriteSASToken`). The flow is as follows:
1. User submits files `test1.pdf` and `test2.pdf` (the file must end in ".pdf", case sensitive). 
1. UI calls `RequestWriteSASToken` passing those 2 filenames. If a file already exists (according to the API response), we can just ignore it and display a message to the user
1. Using the storage locations + tokens given in the API response, the UI uploads the files to azure.
1. UI calls PutFileInfo
## View File
Viewing a file with name `filename.pdf` which is already requires requesting a SAS token for the specific file.  The UI will call `FetchReadSASToken` and then use the storage location + token to load the file in the PDFDisplay component
