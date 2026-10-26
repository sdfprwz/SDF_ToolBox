import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pub = path.join(root, 'public');
const vendor = path.join(pub, 'vendor');
fs.mkdirSync(vendor, { recursive: true });

function copyRequired(from, to) {
  const src = path.join(root, 'node_modules', from);
  if (!fs.existsSync(src)) throw new Error(`Required browser dependency file is missing: ${src}`);
  fs.copyFileSync(src, path.join(vendor, to));
  console.log(`Copied ${from} -> public/vendor/${to}`);
}

copyRequired('pdf-lib/dist/pdf-lib.min.js', 'pdf-lib.min.js');
copyRequired('qrcodejs/qrcode.min.js', 'qrcode.min.js');
copyRequired('jszip/dist/jszip.min.js', 'jszip.min.js');
copyRequired('pdfjs-dist/build/pdf.min.js', 'pdf.min.js');
copyRequired('pdfjs-dist/build/pdf.worker.min.js', 'pdf.worker.min.js');

// Bundle pdfstudio as a local ESM module. The qpdf WebAssembly binary is copied
// alongside it and passed explicitly to createPdfToolkit at runtime.
const pdfstudioRoot = path.join(root, 'node_modules', 'pdfstudio');
function findNamedFile(dir, target) {
  if (!fs.existsSync(dir)) return null;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isFile() && entry.name === target) return full;
    if (entry.isDirectory()) {
      const found = findNamedFile(full, target);
      if (found) return found;
    }
  }
  return null;
}
const wasm = findNamedFile(pdfstudioRoot, 'qpdf.wasm');
if (!wasm) throw new Error('pdfstudio installed, but qpdf.wasm could not be found. Check the pinned pdfstudio package version.');
fs.copyFileSync(wasm, path.join(vendor, 'qpdf.wasm'));
console.log(`Copied ${path.relative(root, wasm)} -> public/vendor/qpdf.wasm`);

await build({
  absWorkingDir: root,
  entryPoints: [path.join(root, 'scripts', 'pdfstudio-entry.js')],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: ['es2020'],
  outfile: path.join(vendor, 'pdfstudio.bundle.js'),
  loader: { '.wasm': 'file' },
  assetNames: '[name]-[hash]',
  publicPath: '/vendor/',
  sourcemap: false,
  minify: true,
  logLevel: 'info'
});
console.log('Build complete. Static site is ready in ./public');
