/**
 * ShipSafe Core Scanner Type Definitions
 * Maps to OWASP Top 10 (2021) and OWASP ASVS v4.0 verification standards.
 */

export type FindingSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type FindingCategory = 
  | 'headers' 
  | 'cookies' 
  | 'secrets' 
  | 'baas' 
  | 'artifacts' 
  | 'cors';

export type LetterGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface Finding {
  id: string;                      // E.g., 'SEC-SUPABASE-SERVICE-ROLE'
  category: FindingCategory;
  severity: FindingSeverity;
  title: string;
  impact: string;                  // Plain-English consequence
  remediationSummary: string;      // Concise human action
  fixPrompt: string;               // Copy-paste AI prompt (for Cursor, Claude, etc.)
  maskedEvidence?: string;         // Safe, masked proof string (e.g. sk_live_•••••••9a2f)
  assetUrl?: string;               // Specific JS bundle or file where finding was located
  owaspMapping?: string;           // E.g., 'OWASP A01:2021 - Broken Access Control'
  deduction: number;               // Points deducted (e.g. 40, 25, 12, 5, 0)
}

export interface SeverityCounts {
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
}

export interface ScannedAsset {
  url: string;
  sizeBytes: number;
  type: 'html' | 'script' | 'map' | 'artifact';
  status: number;
}

export interface ScanResult {
  scanId: string;
  targetUrl: string;
  targetHost: string;
  resolvedIp: string;
  scannedAt: string;               // ISO 8601 string
  durationMs: number;
  overallScore: number;            // 0 - 100
  grade: LetterGrade;
  severityCounts: SeverityCounts;
  findings: Finding[];
  scannedAssets: ScannedAsset[];
  frameworkDetected?: string;      // 'Next.js' | 'Vite' | 'Remix' | 'Nuxt' | 'Generic'
  isDemoTarget?: boolean;
}

export type ScanProgressStepId = 
  | 'resolving_ssrf'
  | 'fetching_headers'
  | 'discovering_scripts'
  | 'analyzing_secrets'
  | 'verifying_artifacts'
  | 'calculating_score'
  | 'completed'
  | 'failed';

export interface ScanProgressEvent {
  step: ScanProgressStepId;
  message: string;
  timestamp: number;
  progressPercent: number;
}

export interface ScanRequest {
  url: string;
  confirmedOwnership?: boolean;
  isDemo?: boolean;
}

export interface SSRFValidationResult {
  allowed: boolean;
  resolvedIp?: string;
  hostname?: string;
  error?: string;
}
