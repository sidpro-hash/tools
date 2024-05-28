

window.addEventListener("load", (event) => {
    
    document.getElementById('imageInput').addEventListener('change', function() {
        readImage(this);
    });

    // Drag and Drop functionality
    const dropzone = document.getElementById('dropzone');
        dropzone.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', function() {
        this.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file) {
            showImageProcessing(true);
            imageProcess(file);
        }
    });

    dropzone.addEventListener('paste', function(e) {
        const items = (e.clipboardData || window.clipboardData).items;
        for (let item of items) {
          if (item.type.indexOf('image') !== -1) {
            const file = item.getAsFile();
            showImageProcessing(true);
            imageProcess(file);
          }
        }
      });

});


function readImage(input) {
    if (input.files && input.files[0]) {
        showImageProcessing(true);
        imageProcess(input.files[0]);
    }
}


function showImageProcessing(show) {
    const overlay = document.getElementById('overlay');
    overlay.style.display = show ? 'block' : 'none';
}

async function imageProcess(file) {
    const validFormats = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validFormats.includes(file.type)) {
        alert('Invalid file format. Please upload PNG, JPEG, or JPG image.');
        showImageProcessing(false);
        return;
    }

    // Load image and convert it to an image object
    const img = new Image();
    img.src = URL.createObjectURL(file);

    // Wait for the image to load
    await new Promise(resolve => {
        img.onload = resolve;
    });

    // Create a canvas to draw the enlarged image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const upscaleBy = 2;
    // Enlarge the image by doubling its size
    canvas.width = img.width * upscaleBy;
    canvas.height = img.height * upscaleBy;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Convert canvas to Blob object
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 1));

    // Use Tesseract.js to recognize the text in the enlarged image
    const result = await Tesseract.recognize(blob, 'eng');
    const text = result?.data?.text;
    document.getElementById('result').textContent = text;
    document.getElementById('scrollable').classList.add("resultOutline");

    showImageProcessing(false);

    return text;
}

