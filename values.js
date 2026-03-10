// values.js

let originalImage = null;
let canvas = document.getElementById('imageCanvas');
let ctx = canvas.getContext('2d');

// Load image
document.getElementById('imageInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                originalImage = img;
                processImage();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Change number of tonal values
document.getElementById('levels').addEventListener('input', function(e) {
    document.getElementById('levelValue').textContent = e.target.value;
    if (originalImage) processImage();
});

// Main image processing function
function processImage() {
    if (!originalImage) return;
    
    const levels = parseInt(document.getElementById('levels').value);
    
    // Set canvas to original image size (no downscaling!)
    canvas.width = originalImage.width;
    canvas.height = originalImage.height;
    
    // Draw original image at full size
    ctx.drawImage(originalImage, 0, 0);
    
    // Get image data for processing
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Convert to grayscale and quantize to chosen values
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Standard grayscale conversion (Luminosity method)
        const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        
        // Calculate value based on number of levels
        const levelSize = 256 / levels;
        const quantized = Math.floor(gray / levelSize) * levelSize + levelSize / 2;
        
        data[i] = quantized;     // R
        data[i + 1] = quantized; // G
        data[i + 2] = quantized; // B
        // data[i + 3] is alpha, left untouched
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Show download button
    document.getElementById('downloadBtn').style.display = 'inline-block';
}

// Download the result
document.getElementById('downloadBtn').addEventListener('click', function() {
    const link = document.createElement('a');
    link.download = 'value-image.png'; // Updated filename to English
    link.href = canvas.toDataURL('image/png');
    link.click();
});

// Initialize slider text
document.getElementById('levelValue').textContent = document.getElementById('levels').value;
