# Tools

All-in-one toolbox of browser-based utilities for everyday digital tasks. Each tool runs entirely in the browser — no accounts, no uploads to a backend, and no build step.

**Live site:** [tools.collegeek.com](https://tools.collegeek.com/)

Part of [Collegeek](https://collegeek.com/). MIT licensed.

## Tools

| Tool | What it does |
|------|----------------|
| [JSON Genie](https://tools.collegeek.com/json-validator/) | Validate, format, and visualize JSON with a syntax-highlighted editor and tree view |
| [PDF Editor](https://tools.collegeek.com/pdfeditor/) | Merge, split, organize pages (rotate/delete/reorder), extract text, PDF ↔ images |
| [Markdown to PDF](https://tools.collegeek.com/md-to-pdf/) | Convert Markdown to PDF in the browser — style tables/code, custom print header/footer |
| [OCR Magic](https://tools.collegeek.com/ocr-magic/) | Extract text from images via Tesseract.js — upload, drag-and-drop, or paste |
| [UUID Generator](https://tools.collegeek.com/uuid-generator/) | Generate UUID v4, v1, or Nil; bulk generate up to 1,000 at once |
| [Image Inspector](https://tools.collegeek.com/image-inspector/) | Pixel-level inspection with zoom, magnifier, coordinates, and HEX / RGB / RGBA / HSL / HSV |
| [Image Combiner](https://tools.collegeek.com/image-combiner/) | Combine photos into one image: side by side, stacked, or a padded grid; optional max size or exact letterboxed canvas |
| [JSON Diff Studio](https://tools.collegeek.com/json-diff/) | Side-by-side JSON comparison with formatting, file load, and visual diffs |
| [JWT Token Parser](https://tools.collegeek.com/jwt-Token-Parser/) | Decode a JWT header and payload, with syntax highlighting and expiry as a readable date |
| [Live DHTML Simulator](https://tools.collegeek.com/Live-DHTML-Simulator/) | Live HTML / CSS / JS editor (Ace) with a real-time preview iframe |
| [Age Calculator](https://tools.collegeek.com/age-calculator/) | Exact age or interval between two dates (years through seconds) |
| [DropLink](https://tools.collegeek.com/droplink/) | Peer-to-peer file sharing over WebRTC — no cloud, no file size limit |
| [Password generator](https://tools.collegeek.com/random-password-generator/) | Customizable passwords with entropy, estimated crack time, and zxcvbn strength |
| [Column Converter](https://tools.collegeek.com/column-converter/) | Turn a column of values into a delimited list with custom prefixes and suffixes |

## How it works

This is a static site. The homepage (`index.html`) lists every utility; each tool lives in its own folder with its own `index.html`, CSS, and (where needed) JavaScript.

Work happens on the client. JSON parsing, PDF merge/split/images-to-PDF, Markdown-to-PDF (print), OCR, password generation, and UUID creation never leave the browser. DropLink is the exception on the network side: files still never go through Collegeek — they travel peer-to-peer over WebRTC (DTLS/SRTP). A STUN server and PeerJS signaling only help the two browsers find each other.

Shared assets:

- `css/` — homepage styles
- `icons/` — favicons and PWA manifest
- `image/` — shared images (e.g. noscript fallback)

Notable libraries (loaded from CDN or vendored in-repo): CodeMirror (JSON Genie), Tesseract.js (OCR Magic), pdf-lib / PDF.js / JSZip (PDF Editor), Ace (Live DHTML Simulator), PeerJS (DropLink), zxcvbn (password generator).

## Run locally

Clone the repo and serve the folder. A local HTTP server is recommended — some tools (OCR, PDF.js workers, DropLink) need more than a `file://` URL.

```bash
git clone https://github.com/sidpro-hash/tools.git
cd tools
python -m http.server 8090
```

Then open [http://localhost:8080](http://localhost:8080). Any other static file server works the same way.

## Deploy

Hosted on GitHub Pages at `tools.collegeek.com` (see `CNAME`). Pushing to the default branch publishes the static files as-is.

## License

[MIT](LICENSE) © Gabu Siddharth
