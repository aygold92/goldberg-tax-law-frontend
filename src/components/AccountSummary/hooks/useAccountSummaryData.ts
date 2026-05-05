import { useMemo } from 'react';
import { StatementSummary } from '../../../types/api';
import { AccountGroup, NullAccountGroup, YearlyTimeline, MonthBlock } from '../types/accountSummary';

// Helpers to access StatementSummary fields uniformly
const getAccountNumber = (s: StatementSummary) => s.statementDetails.accountNumber ?? '';
const getClassification = (s: StatementSummary) => s.classification.info.classificationType;
const getDate = (s: StatementSummary) => s.statementDetails.date ?? '';
const isSuspicious = (s: StatementSummary) => (s.suspiciousReasons?.length ?? 0) > 0;
const isCreditCard = (s: StatementSummary) => getClassification(s).includes(' CC');

function isValidDate(dateString: string): boolean {
  if (!dateString || dateString === 'null' || dateString.trim() === '') return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && date.getFullYear() > 1900;
}

function formatMonthYear(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function formatStatementDate(dateString: string): string {
  if (!isValidDate(dateString)) return dateString || 'null';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function createYearlyTimeline(statements: StatementSummary[]): YearlyTimeline {
  const timeline: YearlyTimeline = {};
  if (statements.length === 0) return timeline;

  const years = new Set<number>();
  statements.forEach(s => { years.add(new Date(getDate(s)).getFullYear()); });

  const yearArray = Array.from(years);
  const minYear = Math.min(...yearArray);
  const maxYear = Math.max(...yearArray);

  for (let year = minYear; year <= maxYear; year++) {
    const yearStatements = statements.filter(s => new Date(getDate(s)).getFullYear() === year);
    const months: MonthBlock[] = [];

    for (let month = 0; month < 12; month++) {
      const monthName = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'short' });
      const statementForMonth = yearStatements.find(s => new Date(getDate(s)).getMonth() === month);

      months.push({
        month,
        monthName,
        hasStatement: !!statementForMonth,
        statement: statementForMonth,
        isSuspicious: statementForMonth ? isSuspicious(statementForMonth) : false,
        hasMissingChecks: (statementForMonth?.missingChecks?.length ?? 0) > 0,
        hasNoTransactions: statementForMonth ? statementForMonth.numTransactions === 0 : false,
        isMissing: false,
        statementDate: statementForMonth ? formatStatementDate(getDate(statementForMonth)) : undefined,
      });
    }

    timeline[year.toString()] = { months };
  }

  const sortedStatements = [...statements].sort((a, b) =>
    new Date(getDate(a)).getTime() - new Date(getDate(b)).getTime()
  );

  for (let i = 0; i < sortedStatements.length - 1; i++) {
    const currentDate = new Date(getDate(sortedStatements[i]));
    const nextDate = new Date(getDate(sortedStatements[i + 1]));
    let checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);

    while (
      checkDate.getFullYear() < nextDate.getFullYear() ||
      (checkDate.getFullYear() === nextDate.getFullYear() && checkDate.getMonth() < nextDate.getMonth())
    ) {
      const yr = checkDate.getFullYear();
      const mo = checkDate.getMonth();
      if (timeline[yr.toString()]) {
        timeline[yr.toString()].months[mo].isMissing = true;
      }
      checkDate.setMonth(checkDate.getMonth() + 1);
    }
  }

  return timeline;
}

function calculateMissingMonthsCount(timeline: YearlyTimeline): number {
  let count = 0;
  Object.values(timeline).forEach(yearData => {
    count += yearData.months.filter(m => m.isMissing).length;
  });
  return count;
}

export function useAccountSummaryData(statements: StatementSummary[]) {
  return useMemo(() => {
    const groups = new Map<string, AccountGroup>();
    const nullGroups = new Map<string, NullAccountGroup>();

    statements.forEach(statement => {
      const accountNum = getAccountNumber(statement);
      const hasValidAccount = accountNum && accountNum !== 'null' && accountNum.trim() !== '';

      if (hasValidAccount) {
        const accountKey = `${accountNum}-${getClassification(statement)}`;
        if (!groups.has(accountKey)) {
          groups.set(accountKey, {
            accountKey,
            accountNumber: accountNum,
            classification: getClassification(statement),
            bankType: isCreditCard(statement) ? 'CREDIT_CARD' : 'BANK',
            statements: [],
            totalStatements: 0,
            suspiciousCount: 0,
            missingChecksCount: 0,
            noTransactionsCount: 0,
            dateRange: '',
            missingMonthsCount: 0,
            yearlyTimeline: {},
            invalidDateStatements: [],
          });
        }
        groups.get(accountKey)!.statements.push(statement);
      } else {
        const classificationKey = getClassification(statement);
        if (!nullGroups.has(classificationKey)) {
          nullGroups.set(classificationKey, {
            classification: classificationKey,
            statements: [],
            totalStatements: 0,
            suspiciousCount: 0,
            missingChecksCount: 0,
            noTransactionsCount: 0,
            yearlyTimeline: {},
            invalidDateStatements: [],
          });
        }
        nullGroups.get(classificationKey)!.statements.push(statement);
      }
    });

    groups.forEach(group => {
      const validDateStatements: StatementSummary[] = [];
      const invalidDateStatements: StatementSummary[] = [];

      group.statements.forEach(s => {
        if (isValidDate(getDate(s))) validDateStatements.push(s);
        else invalidDateStatements.push(s);
      });

      group.invalidDateStatements = invalidDateStatements;
      validDateStatements.sort((a, b) => new Date(getDate(a)).getTime() - new Date(getDate(b)).getTime());

      group.totalStatements = group.statements.length;
      group.suspiciousCount = group.statements.filter(isSuspicious).length;
      group.missingChecksCount = group.statements.filter(s => s.missingChecks.length > 0).length;
      group.noTransactionsCount = group.statements.filter(s => s.numTransactions === 0).length;

      if (validDateStatements.length > 0) {
        const firstDate = new Date(getDate(validDateStatements[0]));
        const lastDate = new Date(getDate(validDateStatements[validDateStatements.length - 1]));
        group.dateRange = `${formatMonthYear(firstDate.toISOString())} - ${formatMonthYear(lastDate.toISOString())}`;
      }

      group.yearlyTimeline = createYearlyTimeline(validDateStatements);
      group.missingMonthsCount = calculateMissingMonthsCount(group.yearlyTimeline);
    });

    nullGroups.forEach(nullGroup => {
      const validDateStatements: StatementSummary[] = [];
      const invalidDateStatements: StatementSummary[] = [];

      nullGroup.statements.forEach(s => {
        if (isValidDate(getDate(s))) validDateStatements.push(s);
        else invalidDateStatements.push(s);
      });

      nullGroup.invalidDateStatements = invalidDateStatements;
      validDateStatements.sort((a, b) => new Date(getDate(a)).getTime() - new Date(getDate(b)).getTime());

      nullGroup.totalStatements = nullGroup.statements.length;
      nullGroup.suspiciousCount = nullGroup.statements.filter(isSuspicious).length;
      nullGroup.missingChecksCount = nullGroup.statements.filter(s => s.missingChecks).length;
      nullGroup.noTransactionsCount = nullGroup.statements.filter(s => s.numTransactions === 0).length;
      nullGroup.yearlyTimeline = createYearlyTimeline(validDateStatements);
    });

    const sortedAccountGroups = Array.from(groups.values()).sort((a, b) => {
      const c = a.classification.localeCompare(b.classification);
      return c !== 0 ? c : a.accountNumber.localeCompare(b.accountNumber);
    });

    const sortedNullGroups = Array.from(nullGroups.values()).sort((a, b) =>
      a.classification.localeCompare(b.classification)
    );

    return { accountGroups: sortedAccountGroups, nullAccountGroups: sortedNullGroups };
  }, [statements]);
}
