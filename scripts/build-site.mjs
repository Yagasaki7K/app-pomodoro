import { cp, mkdir, rm } from 'node:fs/promises';
import './generate-projects-manifest.mjs';

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
await cp('index.html', 'dist/index.html');
await cp('src', 'dist/src', { recursive: true });
await cp('public', 'dist', { recursive: true });
await cp('projects', 'dist/projects', { recursive: true });
console.log('Built static site in dist.');
