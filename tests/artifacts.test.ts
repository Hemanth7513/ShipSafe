import { analyzeArtifactResponse } from '../src/lib/scanner/rules/artifacts';

function runArtifactTests() {
  console.log('🧪 Starting SPA-Safe Artifact Signature Test Suite...\n');

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

  const mockSpaHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head><title>App</title></head>
    <body><div id="root">SPA Catch-All Route</div></body>
    </html>
  `;

  // 1. SPA Catch-All False Positive Tests
  const spaDotEnvFinding = analyzeArtifactResponse(
    'https://example.com/.env',
    200,
    mockSpaHtml,
    'text/html; charset=utf-8'
  );
  assert(
    spaDotEnvFinding === null,
    'Ignores SPA 200 OK HTML response for /.env (Zero False Positives)'
  );

  const spaGitFinding = analyzeArtifactResponse(
    'https://example.com/.git/config',
    200,
    mockSpaHtml,
    'text/html'
  );
  assert(
    spaGitFinding === null,
    'Ignores SPA 200 OK HTML response for /.git/config'
  );

  const spaMapFinding = analyzeArtifactResponse(
    'https://example.com/static/js/main.js.map',
    200,
    mockSpaHtml,
    'text/html'
  );
  assert(
    spaMapFinding === null,
    'Ignores SPA 200 OK HTML response for .js.map'
  );

  // 2. Real Leaked .env Detection
  const realDotEnv = `
    DATABASE_URL=postgres://user:supersecretpass@db.example.com/prod
    NEXTAUTH_SECRET=9a8b7c6d5e4f3a2b1c0d
    PORT=3000
  `;
  const realDotEnvFinding = analyzeArtifactResponse(
    'https://vulnerable.com/.env',
    200,
    realDotEnv,
    'text/plain'
  );
  assert(
    realDotEnvFinding !== null && realDotEnvFinding.id === 'ARTIFACT-EXPOSED-DOTENV',
    'Detects genuine exposed .env file'
  );
  assert(
    realDotEnvFinding?.severity === 'critical' && realDotEnvFinding?.deduction === 40,
    'Assigns CRITICAL severity (-40 points) to exposed .env file'
  );

  // 3. Real Leaked .git/config Detection
  const realGitConfig = `
    [core]
      repositoryformatversion = 0
      filemode = true
      bare = false
    [remote "origin"]
      url = git@github.com:myorg/secret-repo.git
  `;
  const realGitFinding = analyzeArtifactResponse(
    'https://vulnerable.com/.git/config',
    200,
    realGitConfig,
    'text/plain'
  );
  assert(
    realGitFinding !== null && realGitFinding.id === 'ARTIFACT-EXPOSED-GIT-CONFIG',
    'Detects genuine exposed .git/config'
  );

  // 4. Real Leaked Production Source Map Detection
  const realSourceMap = JSON.stringify({
    version: 3,
    sources: ['src/app/page.tsx', 'src/lib/api.ts'],
    names: [],
    mappings: 'AAAA,SAAS...'
  });
  const realMapFinding = analyzeArtifactResponse(
    'https://vulnerable.com/static/js/main.js.map',
    200,
    realSourceMap,
    'application/json'
  );
  assert(
    realMapFinding !== null && realMapFinding.id === 'ARTIFACT-EXPOSED-SOURCE-MAP',
    'Detects valid production source map JSON'
  );
  assert(
    realMapFinding?.severity === 'high',
    'Assigns HIGH severity to exposed source map'
  );

  console.log(`\n========================================`);
  console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runArtifactTests();
