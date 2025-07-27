# JSON Schemas for Bank Statement Data Models

This directory contains JSON Schema definitions for the three main data models used in the bank statement processing system.

## Overview

These schemas represent the data structures used in the Kotlin backend and provide validation and documentation for the API responses and data transformations.

## Files

### 1. BankStatement.json
**Purpose**: Represents a processed bank statement with transaction data and metadata.

**Key Features**:
- Complete transaction history with computed totals
- Bates stamp mapping for document tracking
- Check associations and metadata
- Suspicious transaction detection
- Computed fields (netTransactions, totalSpending, totalIncomeCredits)

**Main Properties**:
- `pageMetadata`: PDF document metadata
- `transactions`: Array of transaction records
- `batesStamps`: Page-to-stamp mapping
- `checks`: Check number to PDF metadata mapping
- `date`, `accountNumber`, `beginningBalance`, `endingBalance`
- `interestCharged`, `feesCharged`

### 2. StatementDataModel.json
**Purpose**: Raw data model extracted from document analysis, before processing into BankStatement.

**Key Features**:
- Multiple transaction table formats (deposit/withdrawal, credits/charges, etc.)
- Support for different bank statement formats
- Manual record entry capabilities
- Bates stamp table structure
- Summary of accounts for multi-account statements

**Main Properties**:
- `pageMetadata`: PDF document metadata
- Various transaction tables (depositWithdrawal, amount, creditsCharges, etc.)
- `summaryOfAccountsTable`: For multi-account statements
- `batesStamps`: Bates stamp table
- `manualRecordsTable`: Manually entered records

### 3. CheckDataModel.json
**Purpose**: Data model for check documents extracted from document analysis.

**Key Features**:
- Individual check data (payee, amount, date, etc.)
- Support for composite checks with multiple entries
- Bates stamp tracking
- PDF metadata association

**Main Properties**:
- `pageMetadata`: PDF document metadata
- `checkEntries`: For composite checks with multiple entries
- `accountNumber`, `checkNumber`, `to`, `description`, `date`, `amount`
- `batesStamp`: Bates stamp identifier

## Common Patterns

### ClassifiedPdfMetadata
All models include a `ClassifiedPdfMetadata` structure with:
- `filename`: PDF file name
- `pages`: Array of page numbers
- `classification`: Document type classification

### Nullable Fields
Most fields are nullable (`["string", "null"]` or `["number", "null"]`) to handle incomplete or missing data from document analysis.

### Transaction Records
Transaction records include:
- `id`: Unique identifier
- `date`: Transaction date
- `description`: Transaction description
- `amount`: Transaction amount
- `filePageNumber`: PDF page number
- Optional check-related fields

## Usage

These schemas can be used for:
1. **API Documentation**: Providing clear structure for API responses
2. **Validation**: Validating incoming/outgoing data
3. **Type Safety**: Ensuring data consistency across the application
4. **Development**: Understanding data structures during development

## Relationship to Kotlin Models

These JSON schemas directly correspond to the Kotlin data classes:
- `BankStatement.kt` → `BankStatement.json`
- `StatementDataModel.kt` → `StatementDataModel.json`
- `CheckDataModel.kt` → `CheckDataModel.json`

The schemas maintain the same structure and field names as the Kotlin models, with appropriate JSON Schema types and validation rules. 