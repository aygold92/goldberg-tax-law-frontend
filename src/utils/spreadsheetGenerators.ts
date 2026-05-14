import { StatementSummary, TransactionWithCheck } from '../types/api';

// --- CSV helpers ---

function escapeCSV(value: any): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

export function rowsToCSV(rows: any[][]): string {
  return rows.map(row => row.map(escapeCSV).join(',')).join('\n');
}

// --- Date helpers ---

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}

function lastDayOfMonth(year: number, month: number): Date {
  return new Date(year, month + 1, 0);
}

// --- Missing months algorithm (mirrors useAccountSummaryData.ts createYearlyTimeline) ---

interface MissingMonth { year: number; month: number; }

function getMissingMonths(statements: StatementSummary[]): MissingMonth[] {
  if (statements.length === 0) return [];

  const validDates = statements
    .map(s => s.statementDetails.date)
    .filter((d): d is string => !!d && d !== 'null' && d.trim() !== '')
    .map(d => new Date(d))
    .filter(d => !isNaN(d.getTime()) && d.getFullYear() > 1900)
    .sort((a, b) => a.getTime() - b.getTime());

  if (validDates.length < 2) return [];

  const missing: MissingMonth[] = [];
  for (let i = 0; i < validDates.length - 1; i++) {
    const current = validDates[i];
    const next = validDates[i + 1];
    let check = new Date(current.getFullYear(), current.getMonth() + 1, 1);

    while (
      check.getFullYear() < next.getFullYear() ||
      (check.getFullYear() === next.getFullYear() && check.getMonth() < next.getMonth())
    ) {
      const alreadyCounted = missing.some(
        m => m.year === check.getFullYear() && m.month === check.getMonth()
      );
      if (!alreadyCounted) {
        missing.push({ year: check.getFullYear(), month: check.getMonth() });
      }
      check.setMonth(check.getMonth() + 1);
    }
  }
  return missing;
}

function formatMissingMonths(missing: MissingMonth[]): string {
  if (missing.length === 0) return '[]';
  const dates = missing.map(({ year, month }) => {
    const last = lastDayOfMonth(year, month);
    return `${last.getMonth() + 1}/${last.getDate()}/${last.getFullYear()}`;
  });
  return '[' + dates.join(', ') + ']';
}

function formatBracketList(items: string[]): string {
  if (items.length === 0) return '[]';
  return '[' + items.join(', ') + ']';
}

// --- Account grouping (mirrors useAccountSummaryData.ts) ---

interface AccountGroup {
  accountNumber: string;
  classification: string;
  statements: StatementSummary[];
}

function groupStatementsByAccount(statements: StatementSummary[]): AccountGroup[] {
  const groups = new Map<string, AccountGroup>();

  for (const s of statements) {
    const accountNumber = s.statementDetails.accountNumber ?? '';
    const classification = s.classification.info.classificationType;
    const key = `${accountNumber}-${classification}`;

    if (!groups.has(key)) {
      groups.set(key, { accountNumber, classification, statements: [] });
    }
    groups.get(key)!.statements.push(s);
  }

  return Array.from(groups.values()).sort((a, b) => {
    const c = a.classification.localeCompare(b.classification);
    return c !== 0 ? c : a.accountNumber.localeCompare(b.accountNumber);
  });
}

// --- Statement lookup map ---

function buildStatementMap(statements: StatementSummary[]): Map<string, StatementSummary> {
  const map = new Map<string, StatementSummary>();
  for (const s of statements) {
    map.set(s.statementDetails.statementId, s);
  }
  return map;
}

// =============================================================================
// Sheet generators
// =============================================================================

export function generateRecordsRows(
  statements: StatementSummary[],
  transactions: TransactionWithCheck[]
): any[][] {
  const stmtMap = buildStatementMap(statements);

  const header = [
    'Transaction Date', 'Description', 'Amount', '',
    'Account', 'Bates Stamp', 'Statement Date', 'Filename', 'File Page #',
    'Check Bates Stamp', 'Check Filename', 'Check File Page #',
  ];

  const rows: any[][] = [header];

  for (const { statementId, transactionDetails: txn, checkDetails } of transactions) {
    const stmt = stmtMap.get(statementId);
    if (!stmt) continue;

    const classificationType = stmt.classification.info.classificationType;
    const accountNumber = stmt.statementDetails.accountNumber ?? '';
    const account = accountNumber ? `${classificationType} - ${accountNumber}` : classificationType;
    const batesStamp = stmt.statementDetails.batesStamps[String(txn.filePageNumber)] ?? '';
    const filename = stmt.classification.inputFile.info.fileName;

    rows.push([
      formatDate(txn.date),
      txn.description ?? '',
      txn.amount ?? '',
      '',
      account,
      batesStamp,
      formatDate(stmt.statementDetails.date),
      filename,
      txn.filePageNumber,
      checkDetails?.batesStamp ?? '',
      // TODO: add check filename and file page # when CheckDetails includes them
      '',
      '',
    ]);
  }

  return rows;
}

export function generateAccountSummaryRows(statements: StatementSummary[]): any[][] {
  const header = ['Account', 'Bank', 'First Statement', 'Last Statement', 'Missing Statements', 'Suspicious Statements'];
  const rows: any[][] = [header];

  const groups = groupStatementsByAccount(statements);

  for (const group of groups) {
    const validStatements = group.statements
      .filter(s => {
        const d = s.statementDetails.date;
        if (!d || d === 'null' || d.trim() === '') return false;
        const date = new Date(d);
        return !isNaN(date.getTime()) && date.getFullYear() > 1900;
      })
      .sort((a, b) =>
        new Date(a.statementDetails.date!).getTime() - new Date(b.statementDetails.date!).getTime()
      );

    const firstDate = validStatements.length > 0
      ? formatDate(validStatements[0].statementDetails.date)
      : '';
    const lastDate = validStatements.length > 0
      ? formatDate(validStatements[validStatements.length - 1].statementDetails.date)
      : '';

    const missingMonths = getMissingMonths(group.statements);
    const missingStr = formatMissingMonths(missingMonths);

    const suspiciousDates = group.statements
      .filter(s => (s.suspiciousReasons?.length ?? 0) > 0)
      .map(s => formatDate(s.statementDetails.date))
      .filter(Boolean);
    const suspiciousStr = formatBracketList(suspiciousDates);

    rows.push([
      group.accountNumber,
      group.classification,
      firstDate,
      lastDate,
      missingStr,
      suspiciousStr,
    ]);
  }

  return rows;
}

export function generateStatementSummaryRows(statements: StatementSummary[]): any[][] {
  const header = [
    'Account', 'Bank', 'Statement Date', 'Beginning Balance', 'Ending Balance',
    'Net Transactions', 'Number of Transactions', 'Bates Stamps', 'Filename', 'File Page #s',
    'Status', 'Suspicious Reasons',
  ];
  const rows: any[][] = [header];

  const sorted = [...statements].sort((a, b) => {
    const accCmp = (a.statementDetails.accountNumber ?? '').localeCompare(
      b.statementDetails.accountNumber ?? ''
    );
    if (accCmp !== 0) return accCmp;
    return (a.statementDetails.date ?? '').localeCompare(b.statementDetails.date ?? '');
  });

  for (const s of sorted) {
    const pages = s.classification.info.pages;
    const batesStamps = pages
      .map(p => s.statementDetails.batesStamps[String(p)])
      .filter(Boolean);
    const batesStr = formatBracketList(batesStamps);
    const pagesStr = formatBracketList(pages.map(String));

    const beginning = s.statementDetails.beginningBalance;
    const ending = s.statementDetails.endingBalance;
    const net = beginning !== null && ending !== null ? ending - beginning : '';

    const status = (s.suspiciousReasons?.length ?? 0) > 0 ? 'Suspicious' : 'Verified';
    const suspiciousStr = (s.suspiciousReasons ?? []).join('; ');

    rows.push([
      s.statementDetails.accountNumber ?? '',
      s.classification.info.classificationType,
      formatDate(s.statementDetails.date),
      beginning ?? '',
      ending ?? '',
      net,
      s.numTransactions,
      batesStr,
      s.classification.inputFile.info.fileName,
      pagesStr,
      status,
      suspiciousStr,
    ]);
  }

  return rows;
}

export function generateCheckSummaryRows(
  transactions: TransactionWithCheck[],
  statements: StatementSummary[]
): any[][] {
  // TODO: rows 1–2 ("Check Images Not Found / Not Used") require new backend data
  const todoRow1 = ['Check Images Not Found', 'Check Images Not Used'];
  const todoRow2 = ['', ''];
  const emptyRow: any[] = [];
  const header = ['Account', 'Check Number', 'Description', 'Date', 'Amount', 'Bates Stamp', 'Filename', 'File Page #'];

  const stmtMap = buildStatementMap(statements);

  const checkRows: any[][] = [];
  for (const { statementId, transactionDetails: txn, checkDetails } of transactions) {
    if (checkDetails == null) continue;
    const stmt = stmtMap.get(statementId);

    checkRows.push([
      checkDetails.accountNumber ?? '',
      checkDetails.checkNumber ?? '',
      checkDetails.description ?? '',
      formatDate(checkDetails.date),
      checkDetails.amount ?? '',
      checkDetails.batesStamp ?? '',
      // TODO: add check filename and file page # when CheckDetails includes them
      stmt?.classification.inputFile.info.fileName ?? '',
      '',
    ]);
  }

  return [todoRow1, todoRow2, emptyRow, header, ...checkRows];
}

function computeTotalPages(statements: StatementSummary[]): number {
  const filePages = new Map<string, number>();
  for (const s of statements) {
    const { fileId, numPages } = s.classification.inputFile.info;
    filePages.set(fileId, numPages);
  }
  return Array.from(filePages.values()).reduce((sum, n) => sum + n, 0);
}

// Returns a 2D array with Google Sheets formula strings for the Total row.
// Use with spreadsheets.values.update (valueInputOption: USER_ENTERED).
export function generateBillData(
  numTransactions: number,
  numStatements: number,
  numChecks: number,
  statements: StatementSummary[]
): any[][] {
  const totalPages = computeTotalPages(statements);
  return [
    [null, 'Transactions', 'Statements', 'Checks', 'Pages', 'Special Charge Hours Worked', 'Total'],
    ['Amount', numTransactions, numStatements, numChecks, totalPages, '', null],
    ['Price', 0.25, 5.0, 1.0, 0.20, 295.0, null],
    ['Total', '=B2*B3', '=C2*C3', '=D2*D3', '=E2*E3', '=IF(F2="",0,F2*F3)', '=SUM(B4:F4)'],
    [],
    [],
  ];
}

// CSV-safe version (no formulas) used for the ZIP download.
export function generateBillRows(
  numTransactions: number,
  numStatements: number,
  numChecks: number,
  statements: StatementSummary[]
): any[][] {
  const totalPages = computeTotalPages(statements);
  const transTotal = numTransactions * 0.25;
  const stmtTotal = numStatements * 5.0;
  const checkTotal = numChecks * 1.0;
  const pagesTotal = totalPages * 0.20;
  return [
    [null, 'Transactions', 'Statements', 'Checks', 'Pages', 'Special Charge Hours Worked', 'Total'],
    ['Amount', numTransactions, numStatements, numChecks, totalPages, '', null],
    ['Price', 0.25, 5.0, 1.0, 0.20, 295.0, null],
    ['Total', transTotal, stmtTotal, checkTotal, pagesTotal, '', transTotal + stmtTotal + checkTotal + pagesTotal],
    [],
    [],
  ];
}
