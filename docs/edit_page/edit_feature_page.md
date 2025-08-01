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

### Classification as BANK or CREDIT_CARD
If the `classification` field for the `BankStatement` ends in "CC" then it is a `CREDIT_CARD`; otherwise, it's `BANK`.

### Components
Note: tables should include all column headers, unless explicitly stated below (leave that column header blank). Column headers should be bolded, colorized, resizable, and sortable (described below) unless explicitly stated.  Column headers should not be editable.  

The sortable columns will work as follows.  There will be be a sorting icon in each sortable header: clicking once will sort the rows in ascending order, clicking again will sort in descending order, and then clicking a 3rd time will remove the sort.  The user can sort on multiple columns.  The header should also display an icon to indicate if it's sorted or not (an up arrow for ascending and a down arrow for descending).  Use ReactGrid Custom Cell Renderer to make the sorting button.  You can use a [custom cell template]( https://reactgrid.com/docs/3.1/5-create-your-own-cell-template/) to implement this.

##### Heading
the main heading of the page should be the "Edit Statement <Client> <Classification>-<AccountNumber>: <Date>"

Below it display the source `filename` from the `ClassifiedPdfMetadata` object

##### Suspicious Reasons
On the right side, if not empty, the suspicious reasons returned from the API call should be displayed in a bulleted list inside a red warning icon.

On the left side, the calculated suspcious reasons should be displayed in a bulleted list inside a red warning icon.  We will calculate this later; for now return empty list.


##### Statement Details
Some of the `BankStatement` fields should be displayed in another `ReactGrid` table above the transactions with the keys on the left and values on the right. Please treat the keys as a column header based on the guidelines above, but these are not sortable as they only have 1 value. Display the following: 
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

If the statment is a `CREDIT_CARD` rather than a `BANK`, then the calculation is reverse: `ExpectedValue = beginningBalance - endingBalance`.  The display above should change accordingly to show this.

The beginningBalance and endingBalance values should be editable as a number and formatted as currency.


##### Transactions Table
The Transactions (from `TransactionHistoryRecord`) should be shown in a (ReactGrid)[https://reactgrid.com/] table with the columns below.  
* `suspiciousReasons` -- displays if that individual transaction record is suspicious.  We will calculate a list of suspicious reasons and if the list is not empty, it will show a red alert icon with a tooltip that lists all the suspicious reasons.  If the list is empty it will display nothing. We will implement the calculation of the suspicious reasons later, for now it will always be empty list.  Do not include the column header for this column, make it as small as possible, it should not be resizable/sortable and should not have a menu.
* `date`
* `description`
* `amount` (formatted as US currency)
* `filePageNumber`
* `actions`: there are 3 actions: `resetValue`, `duplicate`, `delete`.  We will implement these actions later, but for now add them as icons (without text).  Do not include the column header for this column, make it as small as possible, it should not be resizable/sortable. and should not have a menu.

If it has type `BANK` rather than `CREDIT_CARD`, then add 3 additional columns in between `filePageNumber` and `actions`. 
* `checkNumber`
* `checkFilename`
* `checkFilePage`

##### PDF display
The pdf file should be loaded into an iframe from azure on page load and be automatically set to the first page of the statement.  
There should be a toggle button which allows the user to choose whether the display shows up next to the Transactions Table (side by side mode), or under the table (stacked mode).  Default is side by side.
You can load the PDF by calling the `RequestSasToken` API and then constructing the URL to the file as `https://${storageAccountName}.blob.core.windows.net/${clientName}-input/${sourceFilename}.json?${sasToken}`, where sourceFilename is `filename` from the `ClassifiedPdfMetadata` object

### Component Layout

Heading
----------------------------
Suspicious Reasons
----------------------------
|Statement Details | Net Income Calculation | Pages |
----------------------------
Transactions Table  | PDF Display (if side by side mode)
----------------------------
PDF Display (if stacked mode)


### Other Notes

At this stage, if ReactGrid supports editing by default that's fine, but changes will not be saved to the redux store.


## Checkpoint 2: Editable Statement Data and Transactions
Goal: make statement editable and save changes to the backend

All changes should be saved to the redux store whenever a cell changes, and a Save Changes button (please include text along with the icon) will be added which will call the `UpdateStatementModel` API whose structure is detailed in `UpdateStatementModel_API_Spec.md`

#### Actions
Additionally, we can implement some actions:
* `duplicate`: create an identical record but with a different Id
* `delete`: delete the record
* `newRecord`: add a new blank record (with generated ID)
* `invert`: there should be a button on each record to invert the amount, i.e. to change from negative to positive or vice versa

#### Input Validation
* Each editable cell should only allow valid input.  For example, if the field is a number it shouldn't allow any other characters
* UI for editing should be modern
  * for transaction `date`, use a date picker (although we store it as a string in `mm/dd/yyyy` format)
  * for `classification`, use a dropdown with all the options prefilled.  The options are specified in `BankStatement_API_Response_Spec`.  Do not include "Checks"
  * for all fields that are currency, they should be edited as a number and then formatted as currency after
* all fields should allow copy and pasting. The user should be able to select a cell and copy the contents, then select another cell and paste the contents
* the user should be able to select multiple cells and copy the contents of all the cells, then paste those contents into corresponding multiple other cells, like they would in excel.

#### Data Validation
Before saving, we need to ensure that the data is valid.  This involves the following calculations:
* The following fields are required to have values: [`filename`, `classification`, `statementDate`, `accountNumber`, `beginningBalance`, `endingBalance`]
* endingBalance - beginningBalance = sum(amount of all transactions)
* all transactions are valid (see below)

A transaction is valid IFF:
* these fields are required: [`date`, `description`, `amount`, `page`]
* the `date` of the transaction is on or before `date` of the statement, but no more than 45 days before the `date` of the statement
* `page` must be a value from the `pages` table

The calculation above should be used to calculate the `suspciousReasons` table column value as well.

## Checkpoint 3: Undo/Redo and ResetValue features
Goal: an undo/redo feature will be implemented that applies to all changes to the statement, whether it's the statement details, pages, or transactions.

### Undo/Redo
Use a redux middleware rather than implementing specific actions.

### ResetValue
For ResetValue, we want to allow the user to reset the value of a statement details field, a full page record, or a full transaction record to the original state, or to the last state that was saved to the backend. For this, we need the following:
* In the transactions table, add a button in the actions cell of each transaction
* In the statement details table, add an actions cell with a reset value button
* In the pages table, add an actions cell with a reset value button

The reset value button should only appear if it is different.  To know whether it's different, we will need to have stored a copy of the original state in the redux store.  We can easily compare by hashing the original transaction record or page record, and then on render hashing the current record and comparing to the original. To facilitate this, in the copy of the original statement, we should also store a map of transactionId -> hash(transaction).  

We also want to highlight any statement details field, transaction row, or page row that is not in its original state in a faded light yellow background color. 
The reset value will not apply to any transactions or pages that are new, i.e. that weren't in the original state.  For new transactions or pages, they should have a faded light green background color.

## Checkpoint 4: Advanced Filtering
Goal: Apply table filtering based on different criteria

### Filter Criteria 1: Basic Search Filter
A text box will show right above the Transactions Table which will provide a quick filter capability on each row. Any spaces will indicate separate filters which will apply using AND logic.  For example, if "bank 2016" is entered it will filter for all rows that contain both "bank" and "2016".  The search will be case insensitive.

The search will update every time the text is changed, no need for pressing enter or anything

### Filter Criteria 2: Advanced filtering
The user will be able to select filters by choosing a column, a comparison, and a value (if applicable).  The user can choose multiple columns which will be joined together by AND logic

the comparisons are as follows: equals, not equals, greater than, less than, and null/undefined/invalid (doesn't require a value)

#### Advanced Filter UI 
Each column header will have a filter icon button.  When the user presses the button, a tooltip display will appear above which displays a dropdown for the choosing the comparison, the input box if relevant, and an OK button.  If the user presses the OK button, or presses enter inside the input box, the filtering will apply.  If the user presses escape, the filtering will exit without any changes. 

When a filter is applied, an X button will appear which will clear the filter.  The user can also click the original filter icon button to update the filter.

### Filter Criteria 3: Custom filter buttons
There shoulld be buttons to toggle filtering by the following:
* suspicious transactions
* new transactions

These and all other filters will be joined together by AND logic.