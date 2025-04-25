/**
 * Adapter pour le spectrogramme
 * Ce fichier contient un adaptateur qui se place entre sound-analyzer.js et l'interface utilisateur
 * pour effectuer la rotation du spectrogramme sans modifier la classe SoundAnalyzer
 */

// Attendre que la page soit chargée
window.addEventListener('load', () => {
    // Récupérer le canvas original
    const originalCanvas = document.getElementById('spectrogramCanvas');
    if (!originalCanvas) return;
    
    // Créer un proxy pour le contexte du canvas
    const originalCtx = originalCanvas.getContext('2d');
    const originalPutImageData = originalCtx.putImageData;
    
    // Redéfinir la méthode putImageData pour effectuer la rotation
    originalCtx.putImageData = function(imageData, dx, dy, ...args) {
        // Créer un canvas temporaire pour la rotation
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = imageData.height;
        tempCanvas.height = imageData.width;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Mettre l'image data dans le canvas temporaire
        const tempImageData = tempCtx.createImageData(imageData.height, imageData.width);
        
        // Transposer et inverser les pixels (rotation 90° sens antihoraire)
        for (let y = 0; y < imageData.height; y++) {
            for (let x = 0; x < imageData.width; x++) {
                const sourceIndex = (y * imageData.width + x) * 4;
                // Nouvel index après rotation (x devient y, y devient width-x-1)
                const targetIndex = ((imageData.width - x - 1) * imageData.height + y) * 4;
                
                tempImageData.data[targetIndex] = imageData.data[sourceIndex];
                tempImageData.data[targetIndex + 1] = imageData.data[sourceIndex + 1];
                tempImageData.data[targetIndex + 2] = imageData.data[sourceIndex + 2];
                tempImageData.data[targetIndex + 3] = imageData.data[sourceIndex + 3];
            }
        }
        
        // Réappliquer sur le canvas original
        return originalPutImageData.call(this, tempImageData, dy, originalCanvas.width - imageData.width - dx, ...args);
    };
    
    // Redéfinir également drawImage pour les opérations de scrolling du spectrogramme
    const originalDrawImage = originalCtx.drawImage;
    originalCtx.drawImage = function(image, sx, sy, sw, sh, dx, dy, dw, dh) {
        // Pour le scrolling, nous devons adapter les coordonnées
        if (arguments.length === 9 && image === originalCanvas) {
            // C'est l'opération de scrolling
            return originalDrawImage.call(
                this,
                image,
                sy, // sx devient sy
                originalCanvas.width - sx - sw, // sy devient la position inversée en x
                sh, // sw reste sh 
                sw, // sh devient sw
                dy, // dx devient dy
                originalCanvas.width - dx - dw, // dy devient la position inversée en x
                dh, // dw reste dh
                dw  // dh devient dw
            );
        } else {
            // Autres cas de drawImage, passer les arguments tels quels
            return originalDrawImage.apply(this, arguments);
        }
    };
    
    // Redéfinir fillRect pour la réinitialisation du spectrogramme
    const originalFillRect = originalCtx.fillRect;
    originalCtx.fillRect = function(x, y, width, height) {
        return originalFillRect.call(this, y, x, height, width);
    };
    
    console.log("Spectrogram adapter initialized");
});
