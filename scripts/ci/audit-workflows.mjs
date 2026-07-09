import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const workflowsDir = path.join(process.cwd(), '.github', 'workflows');
const metadata = JSON.parse(await readFile('public/applications.json', 'utf8'));
const expected = new Map(metadata.map((app) => [`build-${app.slug}.yaml`, app]));
const files = (await readdir(workflowsDir)).filter((file) => file.endsWith('.yaml')).sort();
const failures = [];

function projectName(name) {
  if (name === 'Twitter / X') return 'X';
  if (name === 'Disney+') return 'Disney Plus';
  return name;
}

function requireIncludes(file, text, needle, message) {
  if (!text.includes(needle)) failures.push(`${file}: ${message}`);
}

for (const [file, app] of expected) {
  if (!files.includes(file)) failures.push(`${file}: missing workflow for ${app.name}`);
}

for (const file of files) {
  const app = expected.get(file);
  if (!app) {
    failures.push(`${file}: unexpected workflow file`);
    continue;
  }

  const text = await readFile(path.join(workflowsDir, file), 'utf8');
  const project = projectName(app.name);

  requireIncludes(file, text, `name: Build ${app.name} Pake Installers`, 'workflow name does not match metadata');
  requireIncludes(file, text, 'workflow_dispatch:', 'missing manual trigger');
  requireIncludes(file, text, "uses: actions/checkout@v4", 'missing checkout action');
  requireIncludes(file, text, "uses: actions/setup-node@v4", 'missing setup-node action');
  requireIncludes(file, text, "run: npm install --global pake-cli", 'Pake CLI must be installed with npm, not pnpm');
  requireIncludes(file, text, `run: pake "${app.url}" --name "${project}"`, 'missing hardcoded Pake URL/name build command');
  requireIncludes(file, text, `run: scripts/ci/validate-projects.sh "projects" "${project}"`, 'missing per-application project validation');
  requireIncludes(file, text, 'uses: actions/upload-artifact@v4', 'missing upload-artifact v4');
  requireIncludes(file, text, 'uses: actions/download-artifact@v4', 'missing download-artifact v4');
  requireIncludes(file, text, 'uses: softprops/action-gh-release@v2', 'missing release action');

  if (/APP_NAME|PNPM_HOME|pnpm install|pnpm add|pnpm setup|\$APP_NAME/.test(text)) {
    failures.push(`${file}: contains forbidden APP_NAME or pnpm global installation references`);
  }

  for (const referencedScript of ['scripts/ci/collect-pake-artifacts.sh', 'scripts/ci/validate-projects.sh']) {
    requireIncludes(file, text, referencedScript, `missing reference to ${referencedScript}`);
  }
}

if (files.length !== expected.size) {
  failures.push(`workflow count mismatch: expected ${expected.size}, found ${files.length}`);
}

if (failures.length) {
  console.error('Workflow audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Workflow audit passed for ${files.length} workflow(s).`);
