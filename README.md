# SDF Toolbox — Render deployment package

This repository is configured as a Render Static Site. The landing page and toolbox are separate views in one app, served from `public/index.html`.

## Deploy to Render

1. Extract this ZIP.
2. Upload the **contents** of the extracted folder to the root of a new GitHub repository (so `render.yaml` and `package.json` are at the repository root).
3. Push/commit the files to GitHub.
4. In Render, choose **New → Blueprint** and connect that repository. Render reads `render.yaml`, installs the pinned npm dependencies, builds the local browser assets, and publishes `public/`.
5. When deployment finishes, open the generated `onrender.com` URL. The landing page appears first; tap **Open SDF Toolbox** to enter the tools.

If you prefer to create the service manually, choose **Static Site**, use build command `npm install --no-audit --no-fund && npm run build`, and publish directory `public`.

## What the build does

- Copies `pdf-lib`, `QRCode.js`, `JSZip`, and PDF.js into `public/vendor/` so normal file operations do not depend on a third-party CDN at runtime.
- Bundles `pdfstudio` as a local browser module and copies its `qpdf.wasm` file for the PDF password tool.
- Keeps file processing in the user's browser; this static site does not add an upload backend or database.
- Uses Render's HTTPS URL, which is required by browsers for camera/scanner access. Users still need to grant camera permission.

## Local build

Requires Node.js 18 or newer:

```sh
npm install
npm run build
```

The deployable site is in `public/`. To test it locally, serve `public/` over HTTP(S) rather than opening the HTML directly as `file://`, because WebAssembly and browser storage behave differently on file URLs.

## Notes and limitations

- The build vendors the required browser libraries, but a successful Render build and a real-browser smoke test are still required before claiming every feature is fully verified.
- Large PDFs/images can use substantial phone memory. For very large files, use a computer where possible.
- The camera scanner depends on browser support and user permission.
- The password tool uses `pdfstudio`/qpdf WebAssembly. The tool displays an error if the security engine cannot initialize or the PDF is unsupported; never close the page while it is processing a large document.
