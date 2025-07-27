# UpdateStatementModel API Specification

## Endpoint

`POST /api/UpdateStatementModels`

## Description

Updates a statement model with manual overrides and reprocesses the statement to generate updated bank statement data.

## Request Body: `UpdateStatementModelRequest` (JSON)

| Field           | Type                    | Description                                                                                  |
|-----------------|-------------------------|----------------------------------------------------------------------------------------------|
| `clientName`    | `string`                | The name of the client.                                                                      |
| `stmtFilename`  | `string`                | Statement filename in format: `${accountNumber}:${classification}:${date.replace("/", "_")}.json` |
| `modelDetails`  | [OverrideModelDetails](#overridemodeldetails) | Details for overriding the statement model.                                                  |

---

## Nested Types

### OverrideModelDetails

| Field         | Type                                                    | Description                                                                                  |
|---------------|---------------------------------------------------------|----------------------------------------------------------------------------------------------|
| `transactions`| Array of [TransactionDetails](#transactiondetails)      | Set of transaction details to override.                                                      |
| `pages`       | Array of [TransactionHistoryPageMetadata](#transactionhistorypagemetadata) | Set of page metadata for the statement.                                                      |
| `details`     | [StatementDetails](#statementdetails)                   | Statement-level details to override.                                                          |

### TransactionDetails

| Field             | Type           | Description                                                                                  |
|-------------------|----------------|----------------------------------------------------------------------------------------------|
| `id`              | `string`       | Unique transaction identifier.                                                               |
| `date`            | `string`       | Transaction date.                                                                            |
| `description`     | `string`       | Description of the transaction.                                                              |
| `amount`          | `number`       | Transaction amount.                                                                          |
| `checkNumber`     | `int` (nullable)| Check number, if applicable.                                                                |
| `checkPdfMetadata`| [ClassifiedPdfMetadata](#classifiedpdfmetadata) (nullable) | PDF metadata for associated check, if any.                  |
| `filePageNumber`  | `int`          | Page number in the PDF where this transaction appears.                                       |

### StatementDetails

| Field             | Type           | Description                                                                                  |
|-------------------|----------------|----------------------------------------------------------------------------------------------|
| `filename`        | `string`       | Name of the PDF file.                                                                        |
| `classification`  | `string`       | Document classification (e.g., bank type).                                                   |
| `statementDate`   | `string`       | Statement date.                                                                              |
| `accountNumber`   | `string`       | Account number for this statement.                                                           |
| `beginningBalance`| `number`       | Beginning balance for the statement period.                                                  |
| `endingBalance`   | `number`       | Ending balance for the statement period.                                                     |
| `interestCharged` | `number` (nullable)| Interest charged during the statement period.                                               |
| `feesCharged`     | `number` (nullable)| Fees charged during the statement period.                                                   |

### TransactionHistoryPageMetadata

| Field           | Type           | Description                                                                                  |
|-----------------|----------------|----------------------------------------------------------------------------------------------|
| `filePageNumber` | `int`          | Page number in the PDF.                                                                      |
| `batesStamp`    | `string` (nullable)| Bates stamp identifier for tracking purposes.                                               |

### ClassifiedPdfMetadata

| Field           | Type           | Description                                                                                  |
|-----------------|----------------|----------------------------------------------------------------------------------------------|
| `filename`      | `string`       | Name of the PDF file.                                                                        |
| `pages`         | Array of `int` | Set of page numbers included.                                                                |
| `classification`| `string`       | Document classification (e.g., bank type).                                                   |
| ...             | ...            | (Other fields as defined in your model)                                                      |

---

## Response Body: `AnalyzeDocumentResult` (JSON)

| Field           | Type                    | Description                                                                                  |
|-----------------|-------------------------|----------------------------------------------------------------------------------------------|
| `status`        | `string`                | Status of the operation: `"Success"` or `"Failed"`.                                         |
| `result`        | `object` (map of string to array of string) (nullable) | Result data when successful.                                                              |
| `errorMessage`  | `string` (nullable)     | Error message when operation fails.                                                          |

---

## Notes

- The `stmtFilename` parameter follows the format: `${accountNumber}:${classification}:${date.replace("/", "_")}.json`
- All monetary amounts are represented as `BigDecimal` numbers.
- The API will reprocess the statement after applying the overrides and generate updated bank statement data.
- Check-related fields are optional and may be `null` if not applicable.

---

## Example Request

```json
{
  "clientName": "client123",
  "stmtFilename": "12345678:WF_BANK:04_30_2024.json",
  "modelDetails": {
    "transactions": [
      {
        "id": "txn1",
        "date": "04/01/2024",
        "description": "Deposit",
        "amount": 500.00,
        "checkNumber": null,
        "checkPdfMetadata": null,
        "filePageNumber": 1
      },
      {
        "id": "txn2",
        "date": "04/15/2024",
        "description": "Withdrawal",
        "amount": -200.00,
        "checkNumber": 1001,
        "checkPdfMetadata": {
          "filename": "check_1001.pdf",
          "pages": [1],
          "classification": "CHECK"
        },
        "filePageNumber": 2
      }
    ],
    "pages": [
      {
        "filePageNumber": 1,
        "batesStamp": "BATES001"
      },
      {
        "filePageNumber": 2,
        "batesStamp": "BATES002"
      }
    ],
    "details": {
      "filename": "WF_Bank_Standard.pdf",
      "classification": "WF_BANK",
      "statementDate": "04/30/2024",
      "accountNumber": "12345678",
      "beginningBalance": 1000.00,
      "endingBalance": 1300.00,
      "interestCharged": 0.00,
      "feesCharged": 10.00
    }
  }
}
```

## Example Response

### Success Response

```json
{
  "status": "Success",
  "result": {
    "processedStatements": ["12345678:WF_BANK:04_30_2024.json"],
    "processedChecks": ["check_1001.pdf"]
  },
  "errorMessage": null
}
```

### Error Response

```json
{
  "status": "Failed",
  "result": null,
  "errorMessage": "File client123/WF_Bank_Standard.pdf does not exist"
}
```

---

## Error Codes

- `400 Bad Request`: Invalid request format or missing required fields
- `404 Not Found`: The specified file does not exist
- `500 Internal Server Error`: Server error during processing 