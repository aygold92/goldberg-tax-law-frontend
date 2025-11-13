Create Request:
```
{
        resource: {
          properties: {
            title: sheetTitle
          },
          sheets: [
            {
              properties: {
                title: "Records",
                gridProperties: {
                  frozenRowCount: 1,
                  frozenColumnCount: 1
                }
              }
            },
            {
              properties: {
                title: "Account Summary",
                gridProperties: {
                  frozenRowCount: 1,
                  frozenColumnCount: 1
                }
              }
            },
            {
              properties: {
                title: "Statement Summary",
                gridProperties: {
                  frozenRowCount: 1,
                  frozenColumnCount: 1
                }
              }
            },
            {
              properties: {
                title: "Check Summary",
                gridProperties: {
                  frozenRowCount: 1,
                  frozenColumnCount: 1
                }
              }
            }
          ]
        }
      }
```


BatchUpdate request
Note: a few properties are variables, such as sheetTitle, the spreadsheetId, and the responseObj from the create API.  Also, records, accountSummary, statementSummary, and checkSummary should have been loaded already.
```
{
        spreadsheetId: spreadsheetId,
        resource: {
          requests: [
            {
              // paste record data
              pasteData: {
                coordinate: {
                  sheetId: recordsSheetId,
                  rowIndex: 0,
                  columnIndex: 0
                },
                data: records,
                delimiter: ","
              }
            },
            {
              // paste account summary data
              pasteData: {
                coordinate: {
                  sheetId: responseObj.sheets[1].properties.sheetId,
                  rowIndex: 0,
                  columnIndex: 0
                },
                data: accountSummary,
                delimiter: ","
              }
            },
            {
              // paste statement summary data
              pasteData: {
                coordinate: {
                  sheetId: responseObj.sheets[2].properties.sheetId,
                  rowIndex: 0,
                  columnIndex: 0
                },
                data: statementSummary,
                delimiter: ","
              }
            },
            {
              // paste check summary data
              pasteData: {
                coordinate: {
                  sheetId: responseObj.sheets[3].properties.sheetId,
                  rowIndex: 0,
                  columnIndex: 0
                },
                data: checkSummary,
                delimiter: ","

              }
            },
            {
              // (Records) Bold the entire first row
              repeatCell: {
                range: {
                  sheetId: recordsSheetId,
                  startRowIndex: 0,
                  endRowIndex: 1
                },
                cell: { userEnteredFormat: { textFormat: { bold: true } } },
                fields: "userEnteredFormat.textFormat.bold"
              }
            },
            {
              // (Records) Bold the entire first column
              repeatCell: {
                range: {
                  sheetId: recordsSheetId,
                  startColumnIndex: 0,
                  endColumnIndex: 1
                },
                cell: { userEnteredFormat: { textFormat: { bold: true } } },
                fields: "userEnteredFormat.textFormat.bold"
              }
            },
            {
              // (Records) Format the first column as a date
              repeatCell: {
                range: {
                  sheetId: recordsSheetId,
                  startColumnIndex: 0,
                  endColumnIndex: 1
                },
                cell: { userEnteredFormat: { numberFormat: { type: "DATE" } } },
                fields: "userEnteredFormat.numberFormat"
              }
            },
            {
              // (Records) Format the 3rd column as currency
              repeatCell: {
                range: {
                  sheetId: recordsSheetId,
                  startColumnIndex: 2,
                  endColumnIndex: 3
                },
                cell: { userEnteredFormat: { numberFormat: { type: "CURRENCY" } } },
                fields: "userEnteredFormat.numberFormat"
              }
            },
            {
              // (Records) Format the 7th column as a date
              repeatCell: {
                range: {
                  sheetId: recordsSheetId,
                  startColumnIndex: 6,
                  endColumnIndex: 7
                },
                cell: { userEnteredFormat: { numberFormat: { type: "DATE" } } },
                fields: "userEnteredFormat.numberFormat"
              }
            }
          ]
        }
      }
```