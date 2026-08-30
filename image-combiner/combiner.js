const MAX_EDGE = 8192;
const IMAGE_TYPES = /^image\/(jpeg|png|webp|gif|bmp)$/i;

const state = {
    images: []
};

const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const fileList = document.getElementById('file-list');
const layoutEl = document.getElementById('layout');
const colsGroup = document.getElementById('cols-group');
const gridColsEl = document.getElementById('grid-cols');
const bgColorEl = document.getElementById('bg-color');
const paddingEl = document.getElementById('padding');
const gapEl = document.getElementById('gap');
const formatEl = document.getElementById('format');
const sizeModeEl = document.getElementById('size-mode');
const maxWidthEl = document.getElementById('max-width');
const maxHeightEl = document.getElementById('max-height');
const sizePresetEl = document.getElementById('size-preset');
const exactWidthEl = document.getElementById('exact-width');
const exactHeightEl = document.getElementById('exact-height');
const downloadBtn = document.getElementById('download-btn');
const clearBtn = document.getElementById('clear-btn');
const preview = document.getElementById('preview');
const previewHint = document.getElementById('preview-hint');
const outputSizeEl = document.getElementById('output-size');

let renderTimer = null;

function isImageFile(file) {
    if (IMAGE_TYPES.test(file.type)) return true;
    return /\.(jpe?g|png|webp|gif|bmp)$/i.test(file.name);
}

function loadImageElement(file) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img);
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Could not read ' + file.name));
        };
        img.src = url;
    });
}

async function rasterizeFile(file) {
    let source;
    try {
        source = await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch (e) {
        source = await loadImageElement(file);
    }
    return {
        name: file.name,
        source,
        width: source.width,
        height: source.height
    };
}

async function addFiles(fileList) {
    const files = Array.from(fileList || []).filter(isImageFile);
    if (!files.length) {
        alert('Please choose image files (JPG, PNG, WebP, GIF, or BMP).');
        return;
    }
    for (const file of files) {
        try {
            state.images.push(await rasterizeFile(file));
        } catch (err) {
            console.error(err);
            alert('Could not read ' + file.name);
        }
    }
    refresh();
}

function refresh() {
    renderFileList();
    colsGroup.style.display = layoutEl.value === 'grid' ? '' : 'none';
    updateSizeModeVisibility();
    downloadBtn.disabled = state.images.length < 1;
    clearBtn.disabled = state.images.length < 1;
    schedulePreview();
}

function updateSizeModeVisibility() {
    const mode = sizeModeEl.value;
    document.querySelectorAll('.size-fit').forEach((el) => {
        el.style.display = mode === 'fit' ? 'flex' : 'none';
    });
    document.querySelectorAll('.size-exact').forEach((el) => {
        el.style.display = mode === 'exact' ? 'flex' : 'none';
    });
}

function renderFileList() {
    if (!state.images.length) {
        fileList.innerHTML = '<p>No images yet. Two is a good start; you can add more for a grid.</p>';
        return;
    }
    fileList.innerHTML = state.images.map((img, index) => `
        <div class="file-item">
            <span>${index + 1}. ${escapeHtml(img.name)} (${img.width}×${img.height})</span>
            <span>
                <button type="button" onclick="moveImage(${index}, -1)" ${index === 0 ? 'disabled' : ''}>&uarr;</button>
                <button type="button" onclick="moveImage(${index}, 1)" ${index === state.images.length - 1 ? 'disabled' : ''}>&darr;</button>
                <button type="button" onclick="removeImage(${index})">Remove</button>
            </span>
        </div>
    `).join('');
}

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/"/g, '&quot;');
}

function moveImage(index, delta) {
    const to = index + delta;
    if (to < 0 || to >= state.images.length) return;
    const item = state.images.splice(index, 1)[0];
    state.images.splice(to, 0, item);
    refresh();
}

function removeImage(index) {
    const item = state.images.splice(index, 1)[0];
    if (item && item.source && item.source.close) item.source.close();
    refresh();
}

function clearAll() {
    state.images.forEach((item) => {
        if (item.source && item.source.close) item.source.close();
    });
    state.images = [];
    refresh();
}

function num(el, fallback) {
    const value = parseInt(el.value, 10);
    return Number.isFinite(value) ? Math.max(0, value) : fallback;
}

function optionalSize(el) {
    const value = parseInt(el.value, 10);
    if (!Number.isFinite(value) || value <= 0) return null;
    return Math.min(MAX_EDGE, value);
}

function gridShape() {
    const n = state.images.length;
    const layout = layoutEl.value;
    if (layout === 'side') return { rows: 1, cols: n };
    if (layout === 'stack') return { rows: n, cols: 1 };
    const requested = Math.max(1, parseInt(gridColsEl.value, 10) || 2);
    const cols = Math.min(requested, n);
    return { rows: Math.ceil(n / cols), cols };
}

function cellFor(index, cols) {
    return { col: index % cols, row: Math.floor(index / cols) };
}

function drawContain(ctx, source, dx, dy, dw, dh) {
    const scale = Math.min(dw / source.width, dh / source.height);
    const w = source.width * scale;
    const h = source.height * scale;
    const x = dx + (dw - w) / 2;
    const y = dy + (dh - h) / 2;
    ctx.drawImage(source, x, y, w, h);
}

function buildCanvas() {
    const images = state.images;
    if (!images.length) return null;

    const padding = num(paddingEl, 24);
    const gap = num(gapEl, 16);
    const { rows, cols } = gridShape();
    const layout = layoutEl.value;

    let positions = [];
    let canvasW = 0;
    let canvasH = 0;

    if (layout === 'side') {
        const height = Math.max.apply(null, images.map((img) => img.height));
        let x = padding;
        images.forEach((img) => {
            const scale = height / img.height;
            const w = img.width * scale;
            positions.push({ x, y: padding, w, h: height, img });
            x += w + gap;
        });
        canvasW = x - gap + padding;
        canvasH = height + padding * 2;
    } else if (layout === 'stack') {
        const width = Math.max.apply(null, images.map((img) => img.width));
        let y = padding;
        images.forEach((img) => {
            const scale = width / img.width;
            const h = img.height * scale;
            positions.push({ x: padding, y, w: width, h, img });
            y += h + gap;
        });
        canvasW = width + padding * 2;
        canvasH = y - gap + padding;
    } else {
        const cellW = Math.max.apply(null, images.map((img) => img.width));
        const cellH = Math.max.apply(null, images.map((img) => img.height));
        images.forEach((img, index) => {
            const { col, row } = cellFor(index, cols);
            positions.push({
                x: padding + col * (cellW + gap),
                y: padding + row * (cellH + gap),
                w: cellW,
                h: cellH,
                img,
                contain: true
            });
        });
        canvasW = padding * 2 + cols * cellW + gap * Math.max(0, cols - 1);
        canvasH = padding * 2 + rows * cellH + gap * Math.max(0, rows - 1);
    }

    const scale = Math.min(1, MAX_EDGE / Math.max(canvasW, canvasH, 1));
    canvasW = Math.max(1, Math.round(canvasW * scale));
    canvasH = Math.max(1, Math.round(canvasH * scale));

    const canvas = document.createElement('canvas');
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = bgColorEl.value || '#ffffff';
    ctx.fillRect(0, 0, canvasW, canvasH);

    positions.forEach((pos) => {
        const x = pos.x * scale;
        const y = pos.y * scale;
        const w = pos.w * scale;
        const h = pos.h * scale;
        if (pos.contain) {
            drawContain(ctx, pos.img.source, x, y, w, h);
        } else {
            ctx.drawImage(pos.img.source, x, y, w, h);
        }
    });

    return applyOutputSize(canvas);
}

function applyOutputSize(src) {
    const mode = sizeModeEl.value;
    if (mode === 'fit') {
        const maxW = optionalSize(maxWidthEl);
        const maxH = optionalSize(maxHeightEl);
        if (!maxW && !maxH) return src;
        const scale = Math.min(
            maxW ? maxW / src.width : Infinity,
            maxH ? maxH / src.height : Infinity,
            MAX_EDGE / src.width,
            MAX_EDGE / src.height
        );
        const w = Math.max(1, Math.min(MAX_EDGE, Math.round(src.width * scale)));
        const h = Math.max(1, Math.min(MAX_EDGE, Math.round(src.height * scale)));
        if (w === src.width && h === src.height) return src;
        const out = document.createElement('canvas');
        out.width = w;
        out.height = h;
        out.getContext('2d').drawImage(src, 0, 0, w, h);
        return out;
    }

    if (mode === 'exact') {
        const tw = Math.max(1, optionalSize(exactWidthEl) || 1080);
        const th = Math.max(1, optionalSize(exactHeightEl) || 1080);
        const out = document.createElement('canvas');
        out.width = tw;
        out.height = th;
        const ctx = out.getContext('2d');
        ctx.fillStyle = bgColorEl.value || '#ffffff';
        ctx.fillRect(0, 0, tw, th);
        const scale = Math.min(tw / src.width, th / src.height);
        const dw = src.width * scale;
        const dh = src.height * scale;
        ctx.drawImage(src, (tw - dw) / 2, (th - dh) / 2, dw, dh);
        return out;
    }

    return src;
}

function schedulePreview() {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(updatePreview, 80);
}

function updatePreview() {
    const canvas = buildCanvas();
    const ctx = preview.getContext('2d');
    if (!canvas) {
        preview.width = 1;
        preview.height = 1;
        ctx.clearRect(0, 0, 1, 1);
        previewHint.style.display = 'block';
        outputSizeEl.hidden = true;
        return;
    }
    previewHint.style.display = 'none';
    preview.width = canvas.width;
    preview.height = canvas.height;
    ctx.drawImage(canvas, 0, 0);
    outputSizeEl.hidden = false;
    outputSizeEl.textContent = canvas.width + ' × ' + canvas.height;
}

function downloadImage() {
    const canvas = buildCanvas();
    if (!canvas) return;
    const format = formatEl.value === 'jpeg' ? 'image/jpeg' : 'image/png';
    const ext = format === 'image/jpeg' ? 'jpg' : 'png';
    canvas.toBlob((blob) => {
        if (!blob) {
            alert('Could not create the image. Try fewer or smaller photos.');
            return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'combined.' + ext;
        link.click();
        URL.revokeObjectURL(url);
    }, format, 0.92);
}

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    addFiles(e.dataTransfer.files);
});

document.getElementById('select-btn').addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => {
    addFiles(e.target.files);
    e.target.value = '';
});

['layout', 'grid-cols', 'bg-color', 'padding', 'gap', 'format', 'size-mode', 'max-width', 'max-height', 'exact-width', 'exact-height'].forEach((id) => {
    document.getElementById(id).addEventListener('input', refresh);
    document.getElementById(id).addEventListener('change', refresh);
});

sizePresetEl.addEventListener('change', () => {
    const preset = sizePresetEl.value;
    if (preset === 'custom') {
        refresh();
        return;
    }
    const parts = preset.split('x');
    exactWidthEl.value = parts[0];
    exactHeightEl.value = parts[1];
    refresh();
});

exactWidthEl.addEventListener('input', syncPresetToCustom);
exactHeightEl.addEventListener('input', syncPresetToCustom);

function syncPresetToCustom() {
    const key = exactWidthEl.value + 'x' + exactHeightEl.value;
    const match = Array.from(sizePresetEl.options).some((opt) => opt.value === key);
    sizePresetEl.value = match ? key : 'custom';
}

downloadBtn.addEventListener('click', downloadImage);
clearBtn.addEventListener('click', clearAll);

refresh();
