let originalImage = null;
const canvas = document.getElementById('imageCanvas');
const ctx = canvas.getContext('2d');

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

document.getElementById('levels').addEventListener('input', function(e) {
    document.getElementById('levelValue').textContent = e.target.value;
    if (originalImage) processImage();
});

function processImage() {
    if (!originalImage) return;
    const levels = parseInt(document.getElementById('levels').value);
    canvas.width = originalImage.width;
    canvas.height = originalImage.height;
    ctx.drawImage(originalImage, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
        const levelSize = 256 / levels;
        const quantized = Math.floor(gray / levelSize) * levelSize + levelSize / 2;
        data[i] = data[i+1] = data[i+2] = quantized;
    }
    ctx.putImageData(imageData, 0, 0);
    document.getElementById('downloadBtn').style.display = 'block';
}

document.getElementById('downloadBtn').addEventListener('click', function() {
    const link = document.createElement('a');
    link.download = 'value-study.png';
    link.href = canvas.toDataURL();
    link.click();
});
