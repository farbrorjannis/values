let originalImage = null;
const canvas = document.getElementById('imageCanvas');
const ctx = canvas.getContext('2d');

document.getElementById('imageInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            getExifOrientation(file, function(orientation) {
                const img = new Image();
                img.onload = function() {
                    originalImage = fixOrientation(img, orientation);
                    processImage();
                };
                img.src = event.target.result;
            });
        };
        reader.readAsDataURL(file);
    }
});

// Läser EXIF orientation-taggen direkt från filen
function getExifOrientation(file, callback) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const view = new DataView(e.target.result);
        if (view.getUint16(0, false) !== 0xFFD8) return callback(1);
        const length = view.byteLength;
        let offset = 2;
        while (offset < length) {
            const marker = view.getUint16(offset, false);
            offset += 2;
            if (marker === 0xFFE1) {
                if (view.getUint32(offset += 2, false) !== 0x45786966) return callback(1);
                const little = view.getUint16(offset += 6, false) === 0x4949;
                offset += view.getUint32(offset + 4, little);
                const tags = view.getUint16(offset, little);
                for (let i = 0; i < tags; i++) {
                    if (view.getUint16(offset + (i * 12) + 2, little) === 0x0112) {
                        return callback(view.getUint16(offset + (i * 12) + 8, little));
                    }
                }
            } else if ((marker & 0xFF00) !== 0xFF00) break;
            else offset += view.getUint16(offset, false);
        }
        callback(1);
    };
    reader.readAsArrayBuffer(file.slice(0, 64 * 1024));
}

// Ritar om bilden korrekt baserat på orientation-värdet
function fixOrientation(img, orientation) {
    const offscreen = document.createElement('canvas');
    const octx = offscreen.getContext('2d');
    const w = img.width, h = img.height;

    if (orientation >= 5) { offscreen.width = h; offscreen.height = w; }
    else { offscreen.width = w; offscreen.height = h; }

    switch (orientation) {
        case 2: octx.transform(-1, 0, 0, 1, w, 0); break;
        case 3: octx.transform(-1, 0, 0, -1, w, h); break;
        case 4: octx.transform(1, 0, 0, -1, 0, h); break;
        case 5: octx.transform(0, 1, 1, 0, 0, 0); break;
        case 6: octx.transform(0, 1, -1, 0, h, 0); break;
        case 7: octx.transform(0, -1, -1, 0, h, w); break;
        case 8: octx.transform(0, -1, 1, 0, 0, w); break;
    }
    octx.drawImage(img, 0, 0);

    const fixed = new Image();
    fixed.src = offscreen.toDataURL();
    fixed.width = offscreen.width;
    fixed.height = offscreen.height;
    return fixed;
}

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
