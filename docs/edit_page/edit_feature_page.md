# Statement Editor Page
The purpose of this page is to view and edit the information related to a single bank statement.  The transactions for the bank statement will be able to be manipulated in an excel like format, and we will also be able to save high level statement data such as the beginning and ending balance, the pages of the file, etc.  Updates will be able to be saved to the backend.

### Additonal Guidelines
* The doc should follow other rules and guidelines as specified in the `implementation.md`, `project_structure.md`, and `UI_UX_doc.md` file, and `.cursor/rules`
* Where possible, please use icons instead of words
* The redux store cannot contain values that are not serializable. For example, `date` will always be stored as a string (in format mm/dd/yyyy), even if the user interacts with it as a date in the application.

# Checkpoint #1: View Statement Data 
Goal: Properly load the page from the backend, store the data in the redux store, and display it on the webpage.

### Page Load and API parameters
The page will take in as url query parameters:
* `clientName`
* `accountNumber`
* `classification` (like Wells Fargo Bank, Bank of America Credit Card, etc.)
* `date` (in mm/dd/yyyy format) 

The page will then call the `LoadBankStatement` API passing those 4 parameters. The output of the API is a `BankStatement` object whose structure is defined in `BankStatement_API_Response_Spec.md`

The loaded object will be stored in the redux store
### Components
Note: tables should include all column headers, unless explicitly stated below (leave that column header blank). Column headers should be bolded, colorized, and resizable, unless explicitly stated.  Column headers should not be editable.

##### Heading
the main heading of the page should be the "Edit Statement <Client> <Classification>-<AccountNumber>: <Date>"

Below it display the source `filename` from the `ClassifiedPdfMetadata` object

##### Suspicious Reasons
On the right side, if not empty, the suspicious reasons returned from the API call should be displayed in a bulleted list inside a red warning icon.

On the left side, the calculated suspcious reasons should be displayed in a bulleted list inside a red warning icon.  We will calculate this later; for now return empty list


##### Statement Details
Some of the `BankStatement` fields should be displayed in another `ReactGrid` table above the transactions with the keys on the left and values on the right. Please treat the keys as a column header based on the guidelines above.  Display the following: 
* Statement Date
* Account Number
* Classification (from ClassifiedPdfMetadata)
* Interest Charged: <>
* Fees Charged: <>


##### Pages Table
Additionally, there should be another `ReactGrid` table which displays the pages that are being used with the columns below.
* `filePageNumber`
* `batesStamp`

The table will include all the pages inside the `ClassifiedPdfMetadata`, and will be associated with their corresponding batesStamp in the `batesStamps` map

##### Net Income calculation
The following should be displayed in nice UI like a vertical Math problem. The numbers for ending balance, beginning balance, and expected value should all be lined up like below:
Ending Balance:       <EndingBalance>
                    -
Beginning Balance:    <BeginningBalance>
                    ----------------------
Expected Value:       <ExpectedValue>  (Actual: <ActualValue>)

ExpectedValue = endingBalance - beginningBalance
Actual = the sum of all amounts from the transactions table

If ExpectedValue == ActualValue, then ActualValue should be displayed in a green success badge; otherwise it should be displayed in a red alert mui badge
If endingBalance or beginningBalance is null, ExpectedValue should display an error icon with a tooltip that says "Must specify beginning and ending balance"


##### Transactions Table
The Transactions (from `TransactionHistoryRecord`) should be shown in a (ReactGrid)[https://reactgrid.com/] table with the columns below.  
* `suspiciousReasons` -- displays if that individual transaction record is suspicious.  We will calculate a list of suspicious reasons and if the list is not empty, it will show a red alert icon with a tooltip that lists all the suspicious reasons.  If the list is empty it will display nothing. We will implement the calculation of the suspicious reasons later, for now it will always be empty list.  Do not include the column header for this column, make it as small as possible, it should not be resizable and should not have a menu.
* `date`
* `description`
* `amount` (formatted as US currency)
* `filePageNumber`
* `actions`: there are 3 actions: `resetValue`, `duplicate`, `delete`.  We will implement these actions later, but for now add them as icons (without text).  Do not include the column header for this column, make it as small as possible, it should not be resizable and should not have a menu.

If the `BankStatement` has type `BANK` rather than `CREDIT_CARD`, then add 3 additional columns in between `filePageNumber` and `actions`.  We will add that calculation later, for now default to it being `BANK`
* `checkNumber`
* `checkFilename`
* `checkFilePage`

##### PDF display
The pdf file should be loaded into an iframe from azure on page load and be automatically set to the first page of the statement.  The display should be draggable to anywhere on the page and be resizable, but will initially show up under the Transactions table and be the full width of the screen. 
You can load the PDF by calling the `RequestSasToken` API and then constructing the URL to the file as `https://${storageAccountName}.blob.core.windows.net/${clientName}-input/${sourceFilename}.json?${sasToken}`, where sourceFilename is `filename` from the `ClassifiedPdfMetadata` object

### Component Layout

Heading
----------------------------
Suspicious Reasons
----------------------------
|Statement Details | Pages |
|Net Income Calculation|
----------------------------
Transactions Table
----------------------------
PDF Display (Moveable and Resizable)


### Other Notes

At this stage, if ReactGrid supports editing by default that's fine, but changes will not be saved to the redux store.


## Checkpoint 2: Editable Statement Data and Transactions
Goal: make statement editable and save changes to the backend

All changes should be saved to the redux store whenever a cell changes, and a Save Changes button (please include text along with the icon) will be added which will call the `UpdateStatementModel` API whose structure is detailed in `UpdateStatementModel_API_Spec.md`

#### Actions
Additionally, we can implement some actions:
* `duplicate`: create an identical record but with a different Id
* `delete`: delete the record
* `newRecord`: there should be an add new record action.  If this is supported by ReactGrid by default then no action is needed
* `invert`: there should be a button on each record to invert the amount, i.e. to change from negative to positive or vice versa

#### Input Validation
* Each editable cell should only allow valid input.  For example, if the field is a number it shouldn't allow any other characters
* UI for editing should be modern
  * for transaction `date`, use a date picker (although we store it as a string in `mm/dd/yyyy` format)
  * for `classification`, use a dropdown with all the options prefilled.  The options are specified below
  * for all fields that are currency, they should be edited as a number and then formatted as currency after
* all fields should allow copy and pasting. The user should be able to select a cell and copy the contents, then select another cell and paste the contents
* the user should be able to select multiple cells and copy the contents of all the cells, then paste those contents into corresponding multiple other cells, like they would in excel.

`classification` options:
* "AMEX CC"
* "C1 CC"
* "CITI CC"
* "WF CC"
* "BofA CC"
* "NFCU CC"
* "Eagle Bank"
* "WF Bank"
* "WF Bank Joint"
* "BofA"
* "NFCU Bank"


### Checkpoint 3: Undo/Redo and ResetValue features