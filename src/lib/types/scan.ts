/**
 * Core ShipSafe Types & Data Contracts
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
  id: string;
  category: FindingCategory;
  severity: FindingSeverity;
  title: string;
  impact: string;
  remediationSummary: string;
  fixPrompt: string;
  maskedEvidence?: string;
  assetUrl?: string;
  owaspMapping?: string;
  deduction: number;
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
  scannedAt: string;
  durationMs: number;
  overallScore: number;
  grade: LetterGrade;
  severityCounts: SeverityCounts;
  findings: Finding[];
  scannedAssets: ScannedAsset[];
  frameworkDetected?: string;
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
