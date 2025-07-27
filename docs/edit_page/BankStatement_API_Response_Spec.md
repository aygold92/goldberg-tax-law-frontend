# BankStatement API Response Specification

## Endpoint

`POST /api/LoadBankStatement`

## Response Body: `BankStatement` (JSON)

| Field                | Type                                         | Description                                                                                  |
|----------------------|----------------------------------------------|----------------------------------------------------------------------------------------------|
| `pageMetadata`       | [ClassifiedPdfMetadata](#classifiedpdfmetadata) | Metadata about the PDF pages for this statement.                                             |
| `date`               | `string` (nullable)                          | Statement date, typically in `MM/DD/YYYY` or similar format.                                 |
| `accountNumber`      | `string` (nullable)                          | The account number associated with this statement.                                           |
| `beginningBalance`   | `number` (nullable)                          | The balance at the start of the statement period.                                            |
| `endingBalance`      | `number` (nullable)                          | The balance at the end of the statement period.                                              |
| `interestCharged`    | `number` (nullable)                          | Interest charged during the statement period, if applicable.                                 |
| `feesCharged`        | `number` (nullable)                          | Fees charged during the statement period, if applicable.                                     |
| `transactions`       | Array of [TransactionHistoryRecord](#transactionhistoryrecord) | List of all transactions in this statement.                                                  |
| `batesStamps`        | `object` (map of int to string)              | Mapping of page numbers to Bates stamp identifiers.                                          |
| `checks`             | `object` (map of int to [ClassifiedPdfMetadata](#classifiedpdfmetadata)) | Mapping of check numbers to their associated PDF metadata.                                   |
| `netTransactions`    | `number`                                     | (Computed) Net of all transactions: total income minus total spending.                       |
| `totalSpending`      | `number`                                     | (Computed) Total spending (sum of all negative transactions).                                |
| `totalIncomeCredits` | `number`                                     | (Computed) Total income/credits (sum of all positive transactions).                          |
| `suspiciousReasons`  | Array of `string`                            | (Computed) List of reasons why this statement may be flagged as suspicious.                  |

---

## Nested Types

### ClassifiedPdfMetadata

| Field           | Type           | Description                                  |
|-----------------|----------------|----------------------------------------------|
| `filename`      | `string`       | Name of the PDF file.                        |
| `pages`         | Array of `int` | Set of page numbers included.                |
| `classification`| `string`       | Document classification (e.g., bank type).   |
| ...             | ...            | (Other fields as defined in your model)      |

### TransactionHistoryRecord

| Field             | Type           | Description                                  |
|-------------------|----------------|----------------------------------------------|
| `id`              | `string`       | Unique transaction identifier.               |
| `date`            | `string`       | Transaction date.                            |
| `checkNumber`     | `int` (nullable)| Check number, if applicable.                |
| `description`     | `string`       | Description of the transaction.              |
| `amount`          | `number`       | Transaction amount (negative = spending).    |
| `filePageNumber`  | `int`          | Page number in the PDF.                      |
| `checkDataModel`  | [CheckDataModel](#checkdatamodel) (nullable) | Associated check data, if any.              |
| ...               | ...            | (Other fields as defined in your model)      |

### CheckDataModel

| Field           | Type           | Description                                  |
|-----------------|----------------|----------------------------------------------|
| `accountNumber` | `string`       | Account number for the check.                |
| `checkNumber`   | `int`          | Check number.                                |
| `payee`         | `string`       | Payee name.                                  |
| `description`   | `string`       | Description.                                 |
| `date`          | `string`       | Date of the check.                           |
| `amount`        | `number`       | Amount of the check.                         |
| ...             | ...            | (Other fields as defined in your model)      |

---

## Notes

- All fields marked as **(Computed)** are calculated by the backend and included in the response.
- Fields marked as **nullable** may be `null` if not available.
- The actual structure of nested objects (like `ClassifiedPdfMetadata`, `TransactionHistoryRecord`, and `CheckDataModel`) may include additional fields as defined in your codebase.

---

## Example Response

```json
{
  "pageMetadata": {
    "filename": "WF_Bank_Standard.pdf",
    "pages": [1,2,3],
    "classification": "WF_BANK"
  },
  "date": "04/30/2024",
  "accountNumber": "12345678",
  "beginningBalance": 1000.00,
  "endingBalance": 1200.00,
  "interestCharged": 0.00,
  "feesCharged": 10.00,
  "transactions": [
    {
      "id": "txn1",
      "date": "04/01/2024",
      "description": "Deposit",
      "amount": 500.00,
      "filePageNumber": 1,
      "checkNumber": null,
      "checkDataModel": null
    }
    // ... more transactions ...
  ],
  "batesStamps": {
    "1": "BATES001",
    "2": "BATES002"
  },
  "checks": {},
  "netTransactions": 200.00,
  "totalSpending": 300.00,
  "totalIncomeCredits": 500.00,
  "suspiciousReasons": []
}
``` 