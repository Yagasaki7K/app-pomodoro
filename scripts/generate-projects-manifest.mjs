import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const projectsDir = path.join(root, 'projects');
const publicDir = path.join(root, 'public');
const metadata = JSON.parse(await readFile(path.join(publicDir, 'applications.json'), 'utf8'));
const bySlug = new Map(metadata.map((app) => [app.slug, app]));
const byName = new Map(metadata.map((app) => [normalize(app.name), app]));
const platformByExtension = {
  '.msi': { platform: 'Windows', type: 'MSI', label: 'Windows (.msi)' },
  '.deb': { platform: 'Linux', type: 'DEB', label: 'Linux (.deb)' },
  '.dmg': { platform: 'macOS', type: 'DMG', label: 'macOS (.dmg)' },
  '.app': { platform: 'macOS', type: 'APP', label: 'macOS (.app)' },
};

function normalize(value) {
  return value.toLowerCase().replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function slugify(value) {
  return normalize(value).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function titleCase(value) {
  return normalize(value).split(' ').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

let entries = [];
try {
  entries = await readdir(projectsDir, { withFileTypes: true });
} catch {
  entries = [];
}

const grouped = new Map();
for (const entry of entries) {
  if (entry.name.startsWith('.')) continue;
  const extension = entry.isDirectory() && entry.name.endsWith('.app') ? '.app' : path.extname(entry.name).toLowerCase();
  const platform = platformByExtension[extension];
  if (!platform) continue;
  const basename = entry.name.slice(0, -extension.length);
  const slug = slugify(basename);
  const known = bySlug.get(slug) ?? byName.get(normalize(basename));
  const key = known?.slug ?? slug;
  if (!grouped.has(key)) {
    grouped.set(key, {
      slug: key,
      name: known?.name ?? titleCase(basename),
      description: known?.description ?? 'Generated Pake desktop application.',
      sourceUrl: known?.url ?? null,
      icon: null,
      downloads: [],
    });
  }
  grouped.get(key).downloads.push({
    fileName: entry.name,
    href: `/projects/${encodeURIComponent(entry.name)}`,
    ...platform,
  });
}

const apps = [...grouped.values()].map((app) => ({
  ...app,
  platforms: [...new Set(app.downloads.map((download) => download.platform))].sort(),
  downloads: app.downloads.sort((a, b) => a.platform.localeCompare(b.platform) || a.type.localeCompare(b.type)),
})).sort((a, b) => a.name.localeCompare(b.name));

await writeFile(path.join(publicDir, 'projects-manifest.json'), `${JSON.stringify({ generatedAt: new Date().toISOString(), apps }, null, 2)}\n`);
console.log(`Generated public/projects-manifest.json with ${apps.length} application(s).`);
