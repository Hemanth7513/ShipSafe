import { ScanResult } from '@/lib/types/scan';

/**
 * Generates an exportable, institutional GitHub-Flavored Markdown report.
 */
export function generateMarkdownReport(result: ScanResult): string {
  const { targetUrl, scannedAt, overallScore, grade, severityCounts, findings, frameworkDetected } = result;

  const dateStr = new Date(scannedAt).toUTCString();

  let md = `# ShipSafe Security Hygiene Report\n\n`;
  md += `**Target URL:** \`${targetUrl}\`  \n`;
  md += `**Audit Timestamp:** ${dateStr}  \n`;
  md += `**Runtime Environment:** ${frameworkDetected || 'Generic Web Application'}  \n`;
  md += `**Overall Grade:** **${grade}** (${overallScore}/100)  \n\n`;

  md += `## Executive Summary\n\n`;
  md += `| Severity Classification | Count | Risk Characterization |\n`;
  md += `| :--- | :--- | :--- |\n`;
  md += `| **[CRITICAL]** | ${severityCounts.critical} | Unrestricted database bypass, live credentials, or raw .env exposure |\n`;
  md += `| **[HIGH]** | ${severityCounts.high} | Exposed production source maps, permissive CORS with credential reflection |\n`;
  md += `| **[MEDIUM]** | ${severityCounts.medium} | Absence of Content-Security-Policy, HSTS, or session cookie directives |\n`;
  md += `| **[LOW]** | ${severityCounts.low} | MIME type confusion risks, referrer leakage, verbose server banners |\n`;
  md += `| **[INFO]** | ${severityCounts.info} | Public client identifiers & architectural checklist verifications |\n\n`;

  if (findings.length === 0) {
    md += `> **Audit Passed:** No passive security hygiene vulnerabilities were detected on public endpoints. The target application aligns with baseline defense-in-depth security standards.\n\n`;
    return md;
  }

  md += `## Detailed Findings & Remediation Analysis\n\n`;

  findings.forEach((finding, index) => {
    md += `### ${index + 1}. [${finding.severity.toUpperCase()}] ${finding.title}\n\n`;
    md += `* **Category:** \`${finding.category}\`  \n`;
    if (finding.owaspMapping) {
      md += `* **Standards Mapping:** ${finding.owaspMapping}  \n`;
    }
    if (finding.assetUrl) {
      md += `* **Observed Asset:** \`${finding.assetUrl}\`  \n`;
    }
    if (finding.maskedEvidence) {
      md += `* **Redacted Evidence:** \`${finding.maskedEvidence}\`  \n`;
    }
    md += `* **Score Impact:** -${finding.deduction} pts  \n\n`;

    md += `**Threat Impact:**  \n${finding.impact}\n\n`;
    md += `**Engineering Remediation:**  \n${finding.remediationSummary}\n\n`;

    md += `#### AI Remediation Directive (Cursor / Claude / Copilot Prompt)\n`;
    md += `\`\`\`markdown\n${finding.fixPrompt}\n\`\`\`\n\n`;
    md += `---\n\n`;
  });

  md += `\n*Assessment compiled by **ShipSafe** — Passive Security Hygiene Auditor for Rapid-Prototyped Web Applications (OWASP ASVS v4.0 aligned).*\n`;
  return md;
}
