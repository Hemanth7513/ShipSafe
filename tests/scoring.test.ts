import { calculateScoreAndGrade, generateMarkdownReport } from '../src/lib/scanner/scoring/engine';
import { Finding, ScanResult } from '../src/lib/types/scanner';

function runScoringTests() {
  console.log('🧪 Starting Scoring Engine & Report Generator Test Suite...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  // 1. Perfect Score Test
  const perfect = calculateScoreAndGrade([]);
  assert(perfect.overallScore === 100, 'Empty findings list produces 100 score');
  assert(perfect.grade === 'A', '100 score yields Grade A');

  // 2. Single Critical Finding Test
  const mockCritical: Finding = {
    id: 'SEC-SUPABASE-SERVICE-ROLE',
    category: 'baas',
    severity: 'critical',
    deduction: 40,
    title: 'Exposed Supabase service_role Key',
    impact: 'Total DB bypass',
    remediationSummary: 'Rotate key',
    fixPrompt: 'Fix prompt content'
  };

  const criticalResult = calculateScoreAndGrade([mockCritical]);
  assert(criticalResult.overallScore === 60, 'Single critical finding reduces score from 100 to 60');
  assert(criticalResult.grade === 'D', 'Score 60 yields Grade D');

  // 3. Two Critical Findings (Grade F)
  const fResult = calculateScoreAndGrade([mockCritical, mockCritical]);
  assert(fResult.overallScore === 20, 'Two critical findings reduce score to 20');
  assert(fResult.grade === 'F', 'Score 20 yields Grade F');

  // 4. Minor Deductions Test (Grade B)
  const mockMedium: Finding = {
    id: 'HDR-MISSING-CSP',
    category: 'headers',
    severity: 'medium',
    deduction: 12,
    title: 'Missing CSP',
    impact: 'XSS risk',
    remediationSummary: 'Add CSP',
    fixPrompt: 'Add CSP header'
  };

  const bResult = calculateScoreAndGrade([mockMedium]);
  assert(bResult.overallScore === 88, 'Single medium finding yields score 88');
  assert(bResult.grade === 'B', 'Score 88 yields Grade B');

  // 5. Markdown Report Generation Test
  const mockScanResult: ScanResult = {
    scanId: 'test-uuid-1234',
    targetUrl: 'https://test-startup.com',
    targetHost: 'test-startup.com',
    resolvedIp: '93.184.216.34',
    scannedAt: new Date().toISOString(),
    durationMs: 3200,
    overallScore: criticalResult.overallScore,
    grade: criticalResult.grade,
    severityCounts: criticalResult.severityCounts,
    findings: [mockCritical],
    scannedAssets: [],
    frameworkDetected: 'Next.js'
  };

  const md = generateMarkdownReport(mockScanResult);
  assert(md.includes('# 🛡️ ShipSafe Security Hygiene Report'), 'Report includes main title banner');
  assert(md.includes('Overall Grade:** **D** (60/100)'), 'Report includes Grade D badge');
  assert(md.includes('Fix prompt content'), 'Report includes AI Fix Prompt snippet');

  console.log(`\n========================================`);
  console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runScoringTests();
