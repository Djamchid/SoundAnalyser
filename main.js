/**
 * Main application script for Audio Spectrum Analyzer
 * Handles UI interactions and initializes the SoundAnalyzer
 */

// DOM elements
const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const resetButton = document.getElementById('resetButton');
const fftSizeSelect = document.getElementById('fftSize');
const minDecibelsInput = document.getElementById('minDecibels');
const maxDecibelsInput = document.getElementById('maxDecibels');
const frequencyCanvas = document.getElementById('frequencyCanvas');
const spectrogramCanvas = document.getElementById('spectrogramCanvas');
const dbValue = document.getElementById('dbValue');
const hzValue = document.getElementById('hzValue');
const audioSourceSelect = document.getElementById('audioSource');
const audioFileInput = document.getElementById('audioFile');

// Initialize sound analyzer
let analyzer = null;

/**
 * Initialize the application
 */
function init() {
    // Create SoundAnalyzer instance
    analyzer = new SoundAnalyzer({
        frequencyCanvas: frequencyCanvas,
        spectrogramCanvas: spectrogramCanvas,
        fftSize: parseInt(fftSizeSelect.value),
        minDecibels: parseInt(minDecibelsInput.value),
        maxDecibels: parseInt(maxDecibelsInput.value)
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
        analyzer.setupCanvas();
    });
    
    // Audio source select change
    audioSourceSelect.addEventListener('change', () => {
        if (audioSourceSelect.value === 'file') {
            audioFileInput.style.display = 'inline-block';
            audioFileInput.click();
        } else {
            audioFileInput.style.display = 'none';
        }
    });
    
    // Audio file input change
    audioFileInput.addEventListener('change', (event) => {
        if (event.target.files.length > 0) {
            const file = event.target.files[0];
            const fileName = file.name;
            startButton.textContent = `Analyze "${fileName}"`;
        }
    });
    
    // Start button click
    startButton.addEventListener('click', async () => {
        try {
            const sourceType = audioSourceSelect.value;
            
            if (sourceType === 'mic') {
                await analyzer.startMicrophoneAudio();
                startButton.textContent = 'Microphone Active';
            } else if (sourceType === 'file') {
                if (audioFileInput.files.length === 0) {
                    audioFileInput.click();
                    return;
                }
                await analyzer.startFileAudio(audioFileInput.files[0]);
                startButton.textContent = `Playing "${audioFileInput.files[0].name}"`;
            } else {
                analyzer.startDemoMode();
                startButton.textContent = 'Running in Demo Mode';
            }
            
            startButton.disabled = true;
            stopButton.disabled = false;
        } catch (err) {
            console.error('Error starting audio:', err);
            alert('Error starting audio: ' + err.message);
            try {
                analyzer.startDemoMode();
                startButton.textContent = 'Running in Demo Mode';
                startButton.disabled = true;
                stopButton.disabled = false;
            } catch (demoErr) {
                console.error('Failed to start demo mode:', demoErr);
            }
        }
    });
    
    // Stop button click
    stopButton.addEventListener('click', () => {
        analyzer.stopAudio();
        startButton.disabled = false;
        stopButton.disabled = true;
        startButton.textContent = 'Start Analysis';
    });
    
    // Reset button click
    resetButton.addEventListener('click', () => {
        analyzer.resetSpectrogram();
    });
    
    // FFT size change
    fftSizeSelect.addEventListener('change', () => {
        analyzer.updateSettings({
            fftSize: parseInt(fftSizeSelect.value)
        });
    });
    
    // Min decibels change
    minDecibelsInput.addEventListener('input', () => {
        analyzer.updateSettings({
            minDecibels: parseInt(minDecibelsInput.value)
        });
    });
    
    // Max decibels change
    maxDecibelsInput.addEventListener('input', () => {
        analyzer.updateSettings({
            maxDecibels: parseInt(maxDecibelsInput.value)
        });
    });
    
    // Click/hover on frequency canvas to show values
    frequencyCanvas.addEventListener('mousemove', handleFrequencyCanvasHover);
    frequencyCanvas.addEventListener('click', handleFrequencyCanvasClick);

    // Click/hover on spectrogram canvas to show frequency values
    spectrogramCanvas.addEventListener('mousemove', handleSpectrogramCanvasHover);
    spectrogramCanvas.addEventListener('click', handleSpectrogramCanvasHover);
}

/**
 * Handle mouse movement over frequency canvas
 * @param {MouseEvent} event - Mouse event
 */
function handleFrequencyCanvasHover(event) {
    if (!analyzer) return;
    
    const values = analyzer.handleCanvasHover(event);
    hzValue.textContent = `${values.frequency} Hz`;
    dbValue.textContent = `${values.db} dB`;
}

/**
 * Handle click on frequency canvas
 * @param {MouseEvent} event - Mouse event
 */
function handleFrequencyCanvasClick(event) {
    // Same as hover, just to ensure the display updates
    handleFrequencyCanvasHover(event);
}

/**
 * Handle mouse movement over spectrogram canvas
 * @param {MouseEvent} event - Mouse event
 */
function handleSpectrogramCanvasHover(event) {
    if (!analyzer) return;
    
    const rect = spectrogramCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Convert x position to frequency (logarithmic scale)
    const xRatio = x / rect.width;
    const minLog = Math.log10(20);  // 20Hz
    const maxLog = Math.log10(analyzer.audioContext ? (analyzer.audioContext.sampleRate / 2) : 22050);
    const freqLog = minLog + xRatio * (maxLog - minLog);
    const frequency = Math.round(Math.pow(10, freqLog));
    
    // Update display
    hzValue.textContent = `${frequency} Hz`;
}

// Initialize the app when the page loads
window.addEventListener('load', init);
