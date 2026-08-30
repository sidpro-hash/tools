

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const state = {
    files: [],
    pdfDoc: null,
    totalPages: 0,
    currentPage: 1,
    loading: false,
    mode: 'merge',
    organizePages: []
};

const controlClasses = ["control-split", "control-merge", "control-extract", "control-pdf-to-image", "control-images-to-pdf", "control-organize"];
const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/bmp,.jpg,.jpeg,.png,.webp,.gif,.bmp";
const PDF_ACCEPT = ".pdf,application/pdf";
let organizeLoadToken = 0;
let organizeDragIndex = null;

// DOM Elements
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const fileList = document.getElementById('file-list');
const mergeButton = document.getElementById('merge-button');
const clearButton = document.getElementById('clear-button');
const splitButton = document.getElementById('split-button');
const pdfToImageButton = document.getElementById('pdf-to-image-button');
const imagesToPdfButton = document.getElementById('images-to-pdf-button');
const organizeSaveButton = document.getElementById('organize-save-button');
const pageTitle = document.getElementById('page-title');
// Toggle the sidebar (navbar) on mobile
const hamburgerIcon = document.getElementById('hamburger-icon');
const sidebarOptions = document.querySelector('.sidebarOptions');

hamburgerIcon.addEventListener('click', () => {
    sidebarOptions.classList.toggle('open');
});

// Event Listeners
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const files = collectFiles(e.dataTransfer.files);
    if (files.length) handleFiles(files);
});

fileInput.addEventListener('change', (e) => {
    const files = collectFiles(e.target.files);
    if (files.length) handleFiles(files);
    e.target.value = '';
});

clearButton.addEventListener('click', clearFiles);
mergeButton.addEventListener('click', mergePDFs);

function isPdfFile(file) {
    return file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
}

function isImageFile(file) {
    if (/^image\/(jpeg|png|webp|gif|bmp)$/i.test(file.type)) return true;
    return /\.(jpe?g|png|webp|gif|bmp)$/i.test(file.name);
}

function collectFiles(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return [];
    if (state.mode === 'imagesToPdf') {
        const images = files.filter(isImageFile);
        if (!images.length) {
            alert('Please choose image files (JPG, PNG, WebP, GIF, or BMP).');
        }
        return images;
    }
    const pdfs = files.filter(isPdfFile);
    if (!pdfs.length) {
        alert('Please choose PDF files.');
        return [];
    }
    return (state.mode === 'merge') ? pdfs : [pdfs[0]];
}

function handleFiles(newFiles) {
    if (state.mode === 'merge' || state.mode === 'imagesToPdf') {
        state.files = [...state.files, ...newFiles];
    } else {
        state.files = newFiles;
    }
    updateFileList();
    updateButtons();
    if (state.mode === 'extract') {
        prepareFileExtract();
    }
    if (state.mode === 'organize') {
        prepareOrganize();
    }
}

function updateFileList() {
    if (state.files.length === 0) {
        fileList.innerHTML = '<p>No files selected</p>';
        return;
    }

    fileList.innerHTML = state.files
        .map((file, index) => `
            <div class="file-item">
                <span>${file.name}</span>
                <button onclick="removeFile(${index})">Remove</button>
            </div>
        `)
        .join('');
}

function removeFile(index) {
    state.files.splice(index, 1);
    updateFileList();
    updateButtons();
}

function updateButtons() {
    mergeButton.disabled = state.files.length < 2;
    clearButton.disabled = state.files.length == 0;
    splitButton.disabled = state.files.length != 1;
    pdfToImageButton.disabled = state.files.length != 1;
    imagesToPdfButton.disabled = state.files.length < 1;
    organizeSaveButton.disabled = state.organizePages.length < 1;
}

function clearFiles() {
    organizeLoadToken += 1;
    state.files = [];
    state.totalPages = 0;
    state.pdfDoc = null;
    state.organizePages = [];
    updateFileList();
    renderOrganizeBoard();
    updateButtons();
    fileInput.value = '';
    document.getElementById('page-number').innerHTML = '';
}

async function mergePDFs() {
    if (state.files.length < 2) return;

    try {
        state.loading = true;
        showProcessing(true);
        mergeButton.disabled = true;

        const PDFLib = window.PDFLib;
        const mergedPdf = await PDFLib.PDFDocument.create();

        for (const file of state.files) {
            const bytes = await file.arrayBuffer();
            const pdf = await PDFLib.PDFDocument.load(bytes,);
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach((page) => mergedPdf.addPage(page));
        }

        const mergedPdfFile = await mergedPdf.save();
        
        // Create download link
        const blob = new Blob([mergedPdfFile], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'merged.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

    } catch (error) {
        console.error('Error merging PDFs:', error);
        alert('Error merging PDFs. Please try again.');
    } finally {
        state.loading = false;
        mergeButton.disabled = false;
        showProcessing(false);
        clearFiles();
    }
}

function showHideByClassName(className, show)
{
    Array.from(document.getElementsByClassName(className)).forEach((element,index) => {
        element.style.display = show ? '' : 'none';
    });
}

function showHideById(id, showStyle)
{
    document.getElementById(id).style.display = showStyle;
}

function changeOption(option, event) {
    if(document.querySelector('.sidebarOptions > li.active') !== null){
        document.querySelector('.sidebarOptions > li.active').classList.remove('active');
      }
      if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
      }
    // Change page title based on selected option
    state.mode = option;
    clearFiles();
    document.getElementById('output').innerHTML = '';
    fileInput.removeAttribute("multiple");
    fileInput.setAttribute("accept", PDF_ACCEPT);
    document.getElementById('drop-zone-label').textContent = 'Drop PDF files here or';
    controlClasses.forEach((e) => {showHideByClassName(e,false)});
    showHideByClassName('extract-elements-custom-display',false);
    if (option === 'merge') {
        pageTitle.textContent = 'Merge PDFs';
        fileInput.setAttribute("multiple","");
        showHideByClassName('control-merge',true);
    } else if (option === 'split') {
        pageTitle.textContent = 'Split PDFs';
        showHideByClassName('control-split',true);
    } else if (option === 'extract') {
        pageTitle.textContent = 'Extract Text';
        showHideByClassName('control-extract',true);
    } else if (option === 'pdfToImage') {
        pageTitle.textContent = 'PDF To Image';
        showHideByClassName('control-pdf-to-image',true);
    } else if (option === 'imagesToPdf') {
        pageTitle.textContent = 'Images to PDF';
        fileInput.setAttribute("multiple","");
        fileInput.setAttribute("accept", IMAGE_ACCEPT);
        document.getElementById('drop-zone-label').textContent = 'Drop image files here or';
        showHideByClassName('control-images-to-pdf',true);
    } else if (option === 'organize') {
        pageTitle.textContent = 'Organize Pages';
        showHideByClassName('control-organize',true);
        renderOrganizeBoard();
    }
}

function showProcessing(show) {
    const overlay = document.getElementById('overlay');
    const loadingDiv = document.getElementById('loading');
    loadingDiv.style.display = show ? 'block' : 'none';
    overlay.style.display = show ? 'block' : 'none';
}

document.getElementById('split-button').addEventListener('click', async () => {
    if (state.files.length != 1) return;
    
    const pageRangesInput = document.getElementById('page-ranges').value.trim();
    document.getElementById('page-ranges').value = '';
    if (!pageRangesInput) {
        alert('Please enter page ranges.');
        return;
    }

    try{
        state.loading = true;
        showProcessing(true);
        const pageRanges = pageRangesInput.split(',').map(range => range.trim());
        const outputPDFs = [];

        const file = state.files[0];
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);

        for (const range of pageRanges) {
            const pagesToExtract = [];
            const parts = range.split('-');

            if (parts.length === 1) {
                // Single page
                const pageNum = parseInt(parts[0], 10) - 1;
                if (pageNum >= 0 && pageNum < pdfDoc.getPageCount()) {
                    pagesToExtract.push(pageNum);
                }
            } else if (parts.length === 2) {
                // Page range
                const startPage = parseInt(parts[0], 10) - 1;
                const endPage = parseInt(parts[1], 10) - 1;
                if (startPage >= 0 && startPage < pdfDoc.getPageCount() && endPage >= startPage && endPage < pdfDoc.getPageCount()) {
                    for (let i = startPage; i <= endPage; i++) {
                        pagesToExtract.push(i);
                    }
                }
            }

            if (pagesToExtract.length > 0) {
                const newPdfDoc = await PDFLib.PDFDocument.create();
                const pagesToCopy = await newPdfDoc.copyPages(pdfDoc, pagesToExtract);
                pagesToCopy.forEach((page) => newPdfDoc.addPage(page));

                const pdfBytes = await newPdfDoc.save();
                outputPDFs.push(pdfBytes);
            }
        }

        // Display the resulting PDFs
        const outputContainer = document.getElementById('output');
        outputContainer.innerHTML = '';

        // Create a ZIP file
        const zip = new JSZip();

        outputPDFs.forEach((pdfBytes, index) => {
            const blob = new Blob([pdfBytes], {
                type: 'application/pdf'
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `split_${index + 1}.pdf`;
            link.innerText = `Download PDF ${index + 1}`;
            zip.file(`split_${index + 1}.pdf`, pdfBytes);
            outputContainer.appendChild(link);
            outputContainer.appendChild(document.createElement('br'));
        });

        // Generate the ZIP file and trigger the download
        zip.generateAsync({
            type: "blob"
        }).then(function(content) {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = "split_pdfs.zip";
            link.innerText = "Download split_pdfs.zip";
            outputContainer.prepend(document.createElement('br'));
            outputContainer.prepend(link);
        });
    }
    catch (error) {
        console.error('Error splitting PDFs:', error);
        alert('Error splitting PDFs. Please try again.');
    }
    finally{
        state.loading = false;
        showProcessing(false);
        clearFiles();
    }
});

// DOM Elements
const pageSelector = document.getElementById('page-selector');
const pageNumber = document.getElementById('page-number');
const extractButton = document.getElementById('extract-button');
const textOutput = document.getElementById('text-output');
const textContainer = document.getElementById('text-container');
const copyButton = document.getElementById('copy-button');
const searchBox = document.getElementById('search-box');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');

extractButton.addEventListener('click', extractText);
copyButton.addEventListener('click', copyText);
searchButton.addEventListener('click', searchText);
pdfToImageButton.addEventListener('click', convertPDFToImage);
imagesToPdfButton.addEventListener('click', convertImagesToPDF);
organizeSaveButton.addEventListener('click', saveOrganizedPDF);
document.getElementById('image-page-size').addEventListener('change', function() {
    document.getElementById('image-auto-orient').disabled = this.value === 'fit';
});

async function prepareFileExtract() {
    if (state.files.length != 1) return;
    try {
        showHideByClassName('extract-elements-custom-display',true);
        const file = state.files[0];
        const arrayBuffer = await file.arrayBuffer();
        state.pdfDoc = await pdfjsLib.getDocument(arrayBuffer).promise;
        state.totalPages = state.pdfDoc.numPages;
        
        let optionsVal = Array.from(
            { length: state.totalPages },
            (_, i) => `<option value="${i + 1}">Page ${i + 1}</option>`
        ).join('');

        optionsVal = '<option value="allPages">All Pages</option>' + optionsVal;
        // Update page selector
        pageNumber.innerHTML = optionsVal;

        pageSelector.style.display = 'block';
        searchBox.style.display = 'block';
    } catch (error) {
        console.error('Error loading PDF:', error);
        alert('Error loading PDF. Please try again.');
    }
}

async function extractText() {
    if (state.files.length != 1) return;

    try {
        showProcessing(true);
        textContainer.style.display = 'none';
        let text = '';
        textOutput.textContent = '';
        if(pageNumber.value != 'allPages'){
            const page = await state.pdfDoc.getPage(parseInt(pageNumber.value));
            const textContent = await page.getTextContent();
            text = textContent.items.map(item => item.str).join(' ');
        }
        else{
            
            for(let i=0;i<state.totalPages;++i)
            {
                const page = await state.pdfDoc.getPage(i+1);
                const textContent = await page.getTextContent();
                text += `\nPage-${i + 1}:\n` + textContent.items.map(item => item.str).join(' ');
            }
        }
        textOutput.textContent = text;
        textContainer.style.display = 'block';
    } catch (error) {
        console.error('Error extracting text:', error);
        alert('Error extracting text from PDF.');
    } finally {
        state.loading = false;
        showProcessing(false);
        clearFiles();
    }
}

function copyText() {
    navigator.clipboard.writeText(textOutput.textContent)
        .then(() => alert('Text copied to clipboard!'))
        .catch(err => console.error('Error copying text:', err));
}

function searchText() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    if (!searchTerm) return;

    const text = textOutput.textContent;
    const regex = new RegExp(searchTerm, 'gi');
    const highlightedText = text.replace(regex, match => `<span class="highlight">${match}</span>`);
    textOutput.innerHTML = highlightedText;
}

async function convertPDFToImage() {
    state.loading = true;
    showProcessing(true);

    const file = state.files[0];

    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        const numPages = pdf.numPages;
        console.log(`Total pages: ${numPages}`);

        const pagePromises = [];

        for (let pageNumber = 1; pageNumber <= numPages; pageNumber++) {
            const page = await pdf.getPage(pageNumber);
            const scale = 2; // You can adjust the scale factor here for higher resolution
            const viewport = page.getViewport({ scale: scale });

            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");

            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const imagePromise = new Promise((resolve) => {
                page.render({
                    canvasContext: context,
                    viewport: viewport
                }).promise.then(() => {
                    const img = new Image();
                    img.src = canvas.toDataURL();

                    resolve(img.src);
                });
            });

            pagePromises.push(imagePromise);
        }

        const images = await Promise.all(pagePromises);

        if (images.length === 1) {
            downloadImage(images[0]);
        } else {
            await createZip(images);
        }

    } catch (error) {
        console.error('Error while rendering PDF:', error);
    } finally {
        state.loading = false;
        pdfToImageButton.disabled = false;
        showProcessing(false);
        clearFiles();
    }
}

async function createZip(images) {
    const zip = new JSZip();

    images.forEach((imageDataUrl, index) => {
        const imageName = `image_${index + 1}.png`; // Name each image differently
        const imageData = imageDataUrl.split(',')[1]; // Get the base64 part of the data URL
        zip.file(imageName, imageData, { base64: true });
    });

    // Generate the zip file and trigger download
    zip.generateAsync({ type: "blob" }).then(function(content) {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(content);
        link.download = "images.zip";
        link.click();
    });
}

function downloadImage(imageDataUrl) {
    const link = document.createElement("a");
    link.href = imageDataUrl;
    link.download = "image.png"; // Name the image file
    link.click();
}

const PAGE_SIZES = {
    a4: [595.28, 841.89],
    letter: [612, 792]
};
const PAGE_MARGIN = 36;
const MAX_IMAGE_EDGE = 4096;

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

async function rasterizeImageFile(file) {
    let source;
    try {
        source = await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch (e) {
        source = await loadImageElement(file);
    }

    let width = source.width;
    let height = source.height;
    if (width > MAX_IMAGE_EDGE || height > MAX_IMAGE_EDGE) {
        const scale = MAX_IMAGE_EDGE / Math.max(width, height);
        width = Math.max(1, Math.round(width * scale));
        height = Math.max(1, Math.round(height * scale));
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(source, 0, 0, width, height);
    if (source.close) source.close();

    const preferJpeg = file.type === 'image/jpeg' || /\.jpe?g$/i.test(file.name);
    const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
            (b) => b ? resolve(b) : reject(new Error('Could not encode ' + file.name)),
            preferJpeg ? 'image/jpeg' : 'image/png',
            0.92
        );
    });

    return {
        bytes: new Uint8Array(await blob.arrayBuffer()),
        isJpeg: preferJpeg,
        width,
        height
    };
}

function layoutImagePage(imgW, imgH, pageSize, autoOrient) {
    if (pageSize === 'fit') {
        const maxPt = 14400;
        let w = imgW;
        let h = imgH;
        if (w > maxPt || h > maxPt) {
            const scale = maxPt / Math.max(w, h);
            w *= scale;
            h *= scale;
        }
        return { pageW: w, pageH: h, drawW: w, drawH: h, x: 0, y: 0 };
    }

    let [pageW, pageH] = PAGE_SIZES[pageSize] || PAGE_SIZES.a4;
    if (autoOrient) {
        const imageLandscape = imgW > imgH;
        const pageLandscape = pageW > pageH;
        if (imageLandscape !== pageLandscape) {
            const tmp = pageW;
            pageW = pageH;
            pageH = tmp;
        }
    }

    const maxW = Math.max(1, pageW - PAGE_MARGIN * 2);
    const maxH = Math.max(1, pageH - PAGE_MARGIN * 2);
    const scale = Math.min(maxW / imgW, maxH / imgH);
    const drawW = imgW * scale;
    const drawH = imgH * scale;
    return {
        pageW,
        pageH,
        drawW,
        drawH,
        x: (pageW - drawW) / 2,
        y: (pageH - drawH) / 2
    };
}

async function convertImagesToPDF() {
    if (state.files.length < 1) return;

    try {
        state.loading = true;
        showProcessing(true);
        imagesToPdfButton.disabled = true;

        const pdfDoc = await PDFLib.PDFDocument.create();
        const pageSize = document.getElementById('image-page-size').value;
        const autoOrient = document.getElementById('image-auto-orient').checked;
        const failed = [];

        for (const file of state.files) {
            try {
                const raster = await rasterizeImageFile(file);
                const image = raster.isJpeg
                    ? await pdfDoc.embedJpg(raster.bytes)
                    : await pdfDoc.embedPng(raster.bytes);
                const layout = layoutImagePage(image.width, image.height, pageSize, autoOrient);
                const page = pdfDoc.addPage([layout.pageW, layout.pageH]);
                page.drawImage(image, {
                    x: layout.x,
                    y: layout.y,
                    width: layout.drawW,
                    height: layout.drawH
                });
            } catch (err) {
                console.error('Error adding image to PDF:', file.name, err);
                failed.push(file.name);
            }
        }

        if (pdfDoc.getPageCount() === 0) {
            alert('Could not create a PDF from the selected images.');
            return;
        }

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'images.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        if (failed.length) {
            alert('PDF created, but these files were skipped:\n' + failed.join('\n'));
        }
    } catch (error) {
        console.error('Error creating PDF from images:', error);
        alert('Error creating PDF. Please try again.');
    } finally {
        state.loading = false;
        imagesToPdfButton.disabled = false;
        showProcessing(false);
        clearFiles();
    }
}

async function prepareOrganize() {
    const token = ++organizeLoadToken;
    state.organizePages = [];
    renderOrganizeBoard();
    updateButtons();
    if (state.files.length !== 1) return;

    try {
        showProcessing(true);
        const bytes = await state.files[0].arrayBuffer();
        if (token !== organizeLoadToken) return;
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(bytes) }).promise;
        const pages = [];
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            if (token !== organizeLoadToken) return;
            const viewport = page.getViewport({ scale: 0.35 });
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            await page.render({
                canvasContext: canvas.getContext('2d'),
                viewport
            }).promise;
            pages.push({
                originalIndex: i - 1,
                rotation: 0,
                thumb: canvas.toDataURL('image/jpeg', 0.72)
            });
        }
        if (token !== organizeLoadToken) return;
        state.organizePages = pages;
        renderOrganizeBoard();
        updateButtons();
    } catch (error) {
        console.error('Error loading PDF pages:', error);
        alert('Error loading PDF. Please try again.');
    } finally {
        if (token === organizeLoadToken) showProcessing(false);
    }
}

function renderOrganizeBoard() {
    const board = document.getElementById('page-thumbs');
    if (!board) return;
    if (!state.organizePages.length) {
        board.innerHTML = '<p class="option-hint">Load a PDF to see pages here.</p>';
        return;
    }
    board.innerHTML = state.organizePages.map((page, index) => `
        <div class="page-card" draggable="true" data-index="${index}">
            <div class="page-thumb-wrap">
                <img src="${page.thumb}" alt="Page ${index + 1}" style="transform:rotate(${page.rotation}deg)">
            </div>
            <div class="page-label">Page ${index + 1}</div>
            <div class="page-actions">
                <button type="button" onclick="event.stopPropagation();moveOrganizePage(${index}, -1)" title="Move left">&larr;</button>
                <button type="button" onclick="event.stopPropagation();rotateOrganizePage(${index})" title="Rotate 90 degrees">&#8635;</button>
                <button type="button" onclick="event.stopPropagation();moveOrganizePage(${index}, 1)" title="Move right">&rarr;</button>
                <button type="button" onclick="event.stopPropagation();deleteOrganizePage(${index})" title="Delete page">&times;</button>
            </div>
        </div>
    `).join('');
    bindOrganizeDrag();
}

function bindOrganizeDrag() {
    const cards = document.querySelectorAll('#page-thumbs .page-card');
    cards.forEach((card) => {
        card.addEventListener('dragstart', (e) => {
            organizeDragIndex = Number(card.dataset.index);
            card.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });
        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
            organizeDragIndex = null;
        });
        card.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });
        card.addEventListener('drop', (e) => {
            e.preventDefault();
            const toIndex = Number(card.dataset.index);
            if (organizeDragIndex === null || organizeDragIndex === toIndex) return;
            const moved = state.organizePages.splice(organizeDragIndex, 1)[0];
            state.organizePages.splice(toIndex, 0, moved);
            renderOrganizeBoard();
        });
    });
}

function moveOrganizePage(index, delta) {
    const toIndex = index + delta;
    if (toIndex < 0 || toIndex >= state.organizePages.length) return;
    const moved = state.organizePages.splice(index, 1)[0];
    state.organizePages.splice(toIndex, 0, moved);
    renderOrganizeBoard();
}

function rotateOrganizePage(index) {
    const page = state.organizePages[index];
    if (!page) return;
    page.rotation = (page.rotation + 90) % 360;
    renderOrganizeBoard();
}

function deleteOrganizePage(index) {
    if (state.organizePages.length <= 1) {
        alert('A PDF needs at least one page.');
        return;
    }
    state.organizePages.splice(index, 1);
    renderOrganizeBoard();
    updateButtons();
}

async function saveOrganizedPDF() {
    if (state.files.length !== 1 || state.organizePages.length < 1) return;

    try {
        state.loading = true;
        showProcessing(true);
        organizeSaveButton.disabled = true;

        const bytes = await state.files[0].arrayBuffer();
        const srcPdf = await PDFLib.PDFDocument.load(bytes);
        const outPdf = await PDFLib.PDFDocument.create();
        const indices = state.organizePages.map((page) => page.originalIndex);
        const copied = await outPdf.copyPages(srcPdf, indices);

        copied.forEach((page, i) => {
            const extra = state.organizePages[i].rotation || 0;
            const current = page.getRotation().angle || 0;
            const next = ((current + extra) % 360 + 360) % 360;
            page.setRotation(PDFLib.degrees(next));
            outPdf.addPage(page);
        });

        const pdfBytes = await outPdf.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'organized.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error saving organized PDF:', error);
        alert('Error saving PDF. Please try again.');
    } finally {
        state.loading = false;
        organizeSaveButton.disabled = false;
        showProcessing(false);
    }
}

document.getElementById('merge-option').click();
