

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const state = {
    files: [],
    pdfDoc: null,
    totalPages: 0,
    currentPage: 1,
    loading: false
};

const controlClasses = ["control-split", "control-merge", "control-extract", "control-pdf-to-image"];

// DOM Elements
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const fileList = document.getElementById('file-list');
const mergeButton = document.getElementById('merge-button');
const clearButton = document.getElementById('clear-button');
const splitButton = document.getElementById('split-button');
const pdfToImageButton = document.getElementById('pdf-to-image-button');
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
    const files = Array.from(e.dataTransfer.files).filter(file => file.type === 'application/pdf');
    handleFiles(pageTitle.textContent == 'Merge PDFs' ? files : [files[0]]);
});

fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    handleFiles(pageTitle.textContent == 'Merge PDFs' ? files : [files[0]]);
});

clearButton.addEventListener('click', clearFiles);
mergeButton.addEventListener('click', mergePDFs);

function handleFiles(newFiles) {
    state.files = [...state.files, ...newFiles];
    updateFileList();
    updateButtons();
    if(pageTitle.textContent == 'Extract Text')
    {
        prepareFileExtract();
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
}

function clearFiles() {
    state.files = [];
    state.totalPages = 0;
    state.pdfDoc = null;
    updateFileList();
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
      event.target.className = "active";
    // Change page title based on selected option
    clearFiles();
    document.getElementById('output').innerHTML = '';
    fileInput.removeAttribute("multiple");
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

document.getElementById('merge-option').click();
