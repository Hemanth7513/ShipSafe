import { Finding } from '@/lib/types/scan';

export type SupportedFramework = 'nextjs' | 'vite' | 'express' | 'remix';

export const FRAMEWORK_LABELS: Record<SupportedFramework, string> = {
  nextjs: 'Next.js App Router',
  vite: 'Vite / React SPA',
  express: 'Express / Node.js',
  remix: 'Remix / React Router',
};

/**
 * Dynamically customizes remediation prompts based on the developer's selected stack.
 */
export function getTailoredAiPrompt(finding: Finding, framework: SupportedFramework): string {
  const category = finding.category;
  const id = finding.id;

  // 1. Supabase service_role Key Leaks
  if (id === 'SEC-SUPABASE-SERVICE-ROLE') {
    switch (framework) {
      case 'nextjs':
        return `I accidentally leaked my Supabase service_role key in client code.
Please help me fix this in Next.js App Router:
1. Remind me how to rotate the service_role key in the Supabase Dashboard (Settings -> API).
2. Ensure my client code uses ONLY NEXT_PUBLIC_SUPABASE_ANON_KEY.
3. Move all privileged operations (that legitimately need service_role) into a secure Server Action or API Route Handler (/api/admin/route.ts) where process.env.SUPABASE_SERVICE_ROLE_KEY is accessed server-side only without the NEXT_PUBLIC_ prefix.`;

      case 'vite':
        return `I accidentally exposed my Supabase service_role key in my Vite/React SPA.
Please help me fix this:
1. Show me how to rotate the service_role key immediately in Supabase Dashboard.
2. In my Vite .env, ensure the client ONLY uses VITE_SUPABASE_ANON_KEY.
3. Because Vite is a pure client-side SPA, explain how to build a lightweight backend API (e.g. Express, Cloudflare Worker, or Supabase Edge Function) to handle service_role tasks so the secret is never bundled in client dist/assets.`;

      case 'express':
        return `My Supabase service_role key was found in frontend code.
Help me move this logic to my Express backend:
1. Rotate the key in Supabase Dashboard.
2. Store SUPABASE_SERVICE_ROLE_KEY in a server-side .env loaded via dotenv.
3. Create a protected Express router endpoint (e.g. router.post('/admin/manage', ...)) with authentication middleware to run privileged database queries safely on the server.`;

      case 'remix':
        return `My Supabase service_role key was exposed in client code.
Help me fix this in Remix:
1. Rotate the key in Supabase Dashboard.
2. Ensure only the public anon key is exposed to the client.
3. Move all service_role database queries strictly inside Remix loader and action functions where code runs server-only and accesses process.env.SUPABASE_SERVICE_ROLE_KEY.`;
    }
  }

  // 2. HTTP Security Headers
  if (category === 'headers') {
    switch (framework) {
      case 'nextjs':
        return `Configure production security headers in my Next.js configuration (next.config.js or next.config.mjs).
Please add the headers() async function with:
- Content-Security-Policy (CSP) allowing self-hosted scripts, styles, Google Fonts, and frame-ancestors 'none'.
- Strict-Transport-Security (HSTS): max-age=63072000; includeSubDomains; preload.
- X-Frame-Options: DENY.
- X-Content-Type-Options: nosniff.
- Referrer-Policy: strict-origin-when-cross-origin.
- Permissions-Policy: camera=(), microphone=(), geolocation=().`;

      case 'vite':
        return `My Vite app is missing HTTP security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options).
Since Vite builds static assets, show me how to configure these headers:
1. If hosting on Vercel: provide a vercel.json headers configuration.
2. If hosting on Netlify: provide a _headers file configuration.
3. If using an Nginx reverse proxy: provide the add_header directives.`;

      case 'express':
        return `Add production security headers to my Express.js server:
1. Show me how to use the 'helmet' npm package with recommended defaults.
2. Configure helmet.contentSecurityPolicy() with directives allowing self-hosted assets and Google Fonts.
3. Configure helmet.hsts() with maxAge: 63072000, includeSubDomains: true, and preload: true.`;

      case 'remix':
        return `Add HTTP security headers to my Remix application:
1. In entry.server.tsx, show me how to append CSP, HSTS, X-Frame-Options: DENY, and X-Content-Type-Options: nosniff to responseHeaders before returning the response.
2. Provide a vercel.json or hosting headers config if deploying to a CDN edge.`;
    }
  }

  // 3. Exposed Production Source Maps
  if (id === 'ARTIFACT-EXPOSED-SOURCE-MAP') {
    switch (framework) {
      case 'nextjs':
        return `My production .js.map source maps are publicly downloadable.
In Next.js, show me how to ensure productionBrowserSourceMaps: false is set in next.config.js and verify that my build output excludes .map files from public hosting.`;

      case 'vite':
        return `My production build is exposing .js.map files.
In vite.config.ts, show me how to configure build: { sourcemap: false } to prevent generating or deploying source maps in production builds.`;

      case 'express':
      case 'remix':
        return `My web app is serving unminified source maps (.js.map) to public visitors.
How do I configure my bundler (Webpack / esbuild / Vite) to disable source map output for production builds?`;
    }
  }

  // 4. Exposed .env files
  if (id === 'ARTIFACT-EXPOSED-DOTENV') {
    switch (framework) {
      case 'nextjs':
      case 'vite':
      case 'remix':
        return `My production .env file is publicly accessible over HTTP.
Help me fix this immediately:
1. Show me how to remove .env from any public/ or static directories.
2. Provide web server rules (for Vercel, Netlify, or Nginx) to deny HTTP access to all dotfiles (^/\\.).
3. Provide a rotation checklist for environment variables exposed in production.`;

      case 'express':
        return `My production .env file is being served statically by Express.
Ensure that app.use(express.static('...')) does not point to the project root containing .env, and add middleware to explicitly block any requests matching /\\.env.`;
    }
  }

  // Fallback to finding's default prompt
  return finding.fixPrompt;
}
