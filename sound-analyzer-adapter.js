/**
 * Adapter for the spectrogram
 * This file contains an adapter that sits between sound-analyzer.js and the UI
 * to perform spectrogram rotation without modifying the SoundAnalyzer class
 */

// Wait for the page to load
window.addEventListener('load', () => {
    // Get the original canvas
    const originalCanvas = document.getElementById('spectrogramCanvas');
    if (!originalCanvas) return;
    
    // Create a proxy for the canvas context
    const originalCtx = originalCanvas.getContext('2d');
    const originalPutImageData = originalCtx.putImageData;
    
    // Override the putImageData method to perform rotation
    originalCtx.putImageData = function(imageData, dx, dy, ...args) {
        // Create a temporary canvas for rotation
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = imageData.height;
        tempCanvas.height = imageData.width;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Create image data for the rotated image
        const tempImageData = tempCtx.createImageData(imageData.height, imageData.width);
        
        // Transpose and invert pixels (rotate 90° counterclockwise)
        for (let y = 0; y < imageData.height; y++) {
            for (let x = 0; x < imageData.width; x++) {
                const sourceIndex = (y * imageData.width + x) * 4;
                // New index after rotation (x becomes y, y becomes width-x-1)
                const targetIndex = ((imageData.width - x - 1) * imageData.height + y) * 4;
                
                tempImageData.data[targetIndex] = imageData.data[sourceIndex];
                tempImageData.data[targetIndex + 1] = imageData.data[sourceIndex + 1];
                tempImageData.data[targetIndex + 2] = imageData.data[sourceIndex + 2];
                tempImageData.data[targetIndex + 3] = imageData.data[sourceIndex + 3];
            }
        }
        
        // Apply to the original canvas with adjusted coordinates
        return originalPutImageData.call(this, tempImageData, dy, originalCanvas.width - imageData.width - dx, ...args);
    };
    
    // Override drawImage for spectrogram scrolling
    const originalDrawImage = originalCtx.drawImage;
    originalCtx.drawImage = function(image, sx, sy, sw, sh, dx, dy, dw, dh) {
        // For scrolling, we need to adapt the coordinates
        if (arguments.length === 9 && image === originalCanvas) {
            // This is the scrolling operation
            return originalDrawImage.call(
                this,
                image,
                sy,                           // sx becomes sy
                originalCanvas.width - sx - sw, // sy becomes the inverted x position
                sh,                           // sw remains sh 
                sw,                           // sh becomes sw
                dy,                           // dx becomes dy
                originalCanvas.width - dx - dw, // dy becomes the inverted x position
                dh,                           // dw remains dh
                dw                            // dh becomes dw
            );
        } else {
            // Other drawImage cases, pass arguments as-is
            return originalDrawImage.apply(this, arguments);
        }
    };
    
    // Override fillRect for spectrogram reset
    const originalFillRect = originalCtx.fillRect;
    originalCtx.fillRect = function(x, y, width, height) {
        return originalFillRect.call(this, y, x, height, width);
    };
    
    console.log("Spectrogram adapter initialized");
});
