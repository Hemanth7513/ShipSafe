# 🛡️ ShipSafe — Passive Security Hygiene Auditor

> **The 10-Second Security Sanity Check for Startups & AI-Built Web Apps.**  
> Detects leaked admin keys, exposed source maps, and missing headers with letter grades (A–F) and copy-paste AI remediation prompts.

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![OWASP](https://img.shields.io/badge/OWASP-Top%2010%20Mapped-orange?style=flat-square)](https://owasp.org/)
[![Tests](https://img.shields.io/badge/Defensive%20Tests-83%20Passing-brightgreen?style=flat-square)]()

---

## ⚡ What is ShipSafe?

ShipSafe is a strictly passive, read-only security auditor tailored for apps built with modern AI tools (Cursor, v0, Bolt, Lovable). Instead of noisy enterprise CVE dumps, it inspects public HTTP responses in under 10 seconds and outputs **copy-paste AI prompts** to fix issues instantly.

### Core Capabilities
* **BaaS Disambiguation:** In-memory JWT decoder distinguishing critical Supabase `service_role` leaks (-40 pts) from intended public `anon` keys.
* **Secret Detection:** Shannon Entropy ($H \ge 3.6$) pre-filtering + regex rules for modern OpenAI Project keys (`sk-proj-`), Stripe secrets (`sk_live_`), and AWS keys.
* **Headers & Cookies:** Audits CSP, HSTS, anti-clickjacking, `nosniff`, and cookie flags (`HttpOnly`, `Secure`, `SameSite`).
* **SPA-Safe Artifacts:** Eliminates SPA 200 catch-all false positives on `/.env`, `/.git/config`, and `.js.map` via structural signature validation.
* **Defensive SSRF Guard:** Strict RFC 6890/1918 CIDR blocklist with IP verification on every redirect hop.
* **Self-Hardened:** Configured with strict CSP and HSTS in `next.config.mjs`—scoring 100/100 (A+) on itself.

---

## 🚀 Quickstart

```bash
# 1. Clone & Install
git clone https://github.com/Hemanth7513/ShipSafe.git
cd shipsafe
npm install

# 2. Run All 83 Defensive Tests
npm test

# 3. Start Local Dev Server
npm run dev
# Open http://localhost:3000
```

---

## License

MIT © [Hemanth7513](https://github.com/Hemanth7513)
