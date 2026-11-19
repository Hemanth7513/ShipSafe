import { Finding, LetterGrade, SeverityCounts } from '@/lib/types/scan';

/**
 * Pure calculation of numeric score (0-100), letter grade (A-F),
 * and severity count breakdown based on findings.
 */
export function calculateScoreAndGrade(findings: Finding[]): {
  overallScore: number;
  grade: LetterGrade;
  severityCounts: SeverityCounts;
} {
  const severityCounts: SeverityCounts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  };

  let criticalDeduction = 0;
  let highDeduction = 0;
  let mediumDeduction = 0;
  let lowDeduction = 0;

  for (const f of findings) {
    if (f.severity === 'critical') {
      severityCounts.critical++;
      criticalDeduction += f.deduction;
    } else if (f.severity === 'high') {
      severityCounts.high++;
      highDeduction += f.deduction;
    } else if (f.severity === 'medium') {
      severityCounts.medium++;
      mediumDeduction += f.deduction;
    } else if (f.severity === 'low') {
      severityCounts.low++;
      lowDeduction += f.deduction;
    } else if (f.severity === 'info') {
      severityCounts.info++;
    }
  }

  // Apply maximum category caps to ensure balanced penalties
  const cappedCritical = Math.min(80, criticalDeduction);
  const cappedHigh = Math.min(50, highDeduction);
  const cappedMedium = Math.min(36, mediumDeduction);
  const cappedLow = Math.min(15, lowDeduction);

  const totalDeductions = cappedCritical + cappedHigh + cappedMedium + cappedLow;
  const overallScore = Math.max(0, 100 - totalDeductions);

  let grade: LetterGrade = 'F';
  if (overallScore >= 90) grade = 'A';
  else if (overallScore >= 80) grade = 'B';
  else if (overallScore >= 70) grade = 'C';
  else if (overallScore >= 60) grade = 'D';
  else grade = 'F';

  return {
    overallScore,
    grade,
    severityCounts,
  };
}

export { generateMarkdownReport } from '../remediation/exporter';
