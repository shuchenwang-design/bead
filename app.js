let BEAD_PALETTE = [];
let currentImage = null;
let highlightCode = null;
let currentPattern = []; 
let showCodes = true;
let historyStack = [];

const controls = {
    upload: document.getElementById('imageUpload'),
    grid: document.getElementById('gridScale'),
    maxColors: document.getElementById('maxColors'),
    generate: document.getElementById('generateBtn'),
    container: document.getElementById('blueprintContainer'),
    legend: document.getElementById('legendContainer'),
    loading: document.getElementById('loadingOverlay'),
    preview: document.getElementById('previewCanvas'),
    toggleCodes: document.getElementById('toggleCodes'),
    floatingPicker: document.getElementById('floatingPicker'),
    hue: document.getElementById('hue'), sat: document.getElementById('sat'),
    light: document.getElementById('light'), contrast: document.getElementById('contrast'),
    gridVal: document.getElementById('gridVal'), colorVal: document.getElementById('colorVal'),
    hueVal: document.getElementById('hueVal'), satVal: document.getElementById('satVal'),
    lightVal: document.getElementById('lightVal'), contrastVal: document.getElementById('contrastVal')
};

// --- INITIALIZATION ---
async function init() {
    try {
        const response = await fetch('./mard-palette.json');
        if (!response.ok) throw new Error("JSON not found");
        BEAD_PALETTE = await response.json();
        syncLabels();

        currentImage = new Image();
        currentImage.crossOrigin = "anonymous";
        currentImage.onload = () => { updatePreview(); generate(); };
        currentImage.src = './default.png'; 
        
        controls.generate.innerText = "Generate Blueprint";
    } catch (e) {
        controls.generate.innerText = "Error: Palette Missing";
    }
}

// --- HISTORY & UNDO ---
function saveHistory() {
    // Save the state BEFORE the change
    historyStack.push(JSON.stringify(currentPattern));
    if (historyStack.length > 50) historyStack.shift(); 
}

window.addEventListener('keydown', (e) => {
    // Check for Ctrl+Z or Cmd+Z (Mac)
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (historyStack.length > 0) {
            e.preventDefault();
            const previousState = historyStack.pop();
            currentPattern = JSON.parse(previousState);
            render();
        }
    }
});

// --- UTILITIES ---
const hexToRgb = (hex) => ({
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16)
});
const getDistance = (c1, c2) => Math.sqrt((c1.r - c2.r) ** 2 + (c1.g - c2.g) ** 2 + (c1.b - c2.b) ** 2);

function syncLabels() {
    controls.gridVal.innerText = controls.grid.value;
    controls.colorVal.innerText = controls.maxColors.value;
    controls.hueVal.innerText = controls.hue.value;
    controls.satVal.innerText = controls.sat.value;
    controls.lightVal.innerText = controls.light.value;
    controls.contrastVal.innerText = controls.contrast.value;
}

[controls.grid, controls.maxColors, controls.hue, controls.sat, controls.light, controls.contrast].forEach(el => {
    el.addEventListener('input', () => {
        syncLabels();
        if (['hue', 'sat', 'light', 'contrast'].includes(el.id)) updatePreview();
    });
});

function updatePreview() {
    if (!currentImage) return;
    const ctx = controls.preview.getContext('2d');
    const scale = Math.min(300 / currentImage.width, 300 / currentImage.height);
    controls.preview.width = currentImage.width * scale;
    controls.preview.height = currentImage.height * scale;
    ctx.filter = `hue-rotate(${controls.hue.value}deg) saturate(${controls.sat.value}%) brightness(${controls.light.value}%) contrast(${controls.contrast.value}%)`;
    ctx.drawImage(currentImage, 0, 0, controls.preview.width, controls.preview.height);
}

if (controls.toggleCodes) {
    controls.toggleCodes.onclick = () => {
        showCodes = !showCodes;
        controls.toggleCodes.innerText = `LABEL: ${showCodes ? 'ON' : 'OFF'}`;
        controls.toggleCodes.className = `px-2 py-1 text-fbfwhite text-[10px] ${showCodes ? 'bg-fbfred hover:bg-fbfred/80' : 'bg-fbfblack hover:bg-fbfblack/80 '} rounded font-bold transition-all`;
        render();
    };
}

// --- GENERATION ENGINE ---
function generate() {
    if (!currentImage || BEAD_PALETTE.length === 0) return;
    controls.loading.classList.remove('hidden');
    historyStack = []; // Clear history on new generation

    setTimeout(() => {
        const gridSize = parseInt(controls.grid.value);
        const sampleRes = 6; 
        const tempCanvas = document.createElement('canvas');
        const ctx = tempCanvas.getContext('2d', { willReadFrequently: true });
        tempCanvas.width = gridSize * sampleRes;
        tempCanvas.height = gridSize * sampleRes;

        const ratio = Math.min(tempCanvas.width / currentImage.width, tempCanvas.height / currentImage.height);
        ctx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        ctx.filter = `hue-rotate(${controls.hue.value}deg) saturate(${controls.sat.value}%) brightness(${controls.light.value}%) contrast(${controls.contrast.value}%)`;
        ctx.drawImage(currentImage, (tempCanvas.width - currentImage.width*ratio)/2, (tempCanvas.height - currentImage.height*ratio)/2, currentImage.width*ratio, currentImage.height*ratio);

        const imgData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height).data;
        let rawPattern = [];
        let tempCounts = {};

        for (let gy = 0; gy < gridSize; gy++) {
            for (let gx = 0; gx < gridSize; gx++) {
                let votes = {}, count = 0, rS = 0, gS = 0, bS = 0, trans = 0;
                for (let sy = 0; sy < sampleRes; sy++) {
                    for (let sx = 0; sx < sampleRes; sx++) {
                        const px = ((gy * sampleRes + sy) * tempCanvas.width + (gx * sampleRes + sx)) * 4;
                        if (imgData[px+3] < 51) { trans++; continue; }
                        const r = imgData[px], g = imgData[px+1], b = imgData[px+2];
                        rS += r, gS += g, bS += b, count++;
                        let closest = BEAD_PALETTE.reduce((prev, curr) => getDistance({r,g,b}, hexToRgb(curr.hex)) < getDistance({r,g,b}, hexToRgb(prev.hex)) ? curr : prev);
                        votes[closest.code] = (votes[closest.code] || 0) + 1;
                    }
                }
                if (trans > (sampleRes**2) * 0.8) { rawPattern.push(null); continue; }
                const sorted = Object.entries(votes).sort((a,b) => b[1] - a[1]);
                let bead = BEAD_PALETTE.find(b => b.code === sorted[0][0]);
                rawPattern.push(bead);
                if (bead) tempCounts[bead.code] = (tempCounts[bead.code] || 0) + 1;
            }
        }

        const max = parseInt(controls.maxColors.value);
        let sortedPairs = Object.entries(tempCounts).sort((a,b) => b[1] - a[1]);
        let finalAllowed = sortedPairs.slice(0, max).filter(c => c[1] >= 5).map(c => c[0]);
        if (finalAllowed.length === 0 && sortedPairs.length > 0) finalAllowed = [sortedPairs[0][0]];

        currentPattern = rawPattern.map(bead => {
            if (!bead || finalAllowed.includes(bead.code)) return bead;
            const subBead = BEAD_PALETTE.find(x => x.code === finalAllowed.reduce((prev, curr) => {
                const dPrev = getDistance(hexToRgb(bead.hex), hexToRgb(BEAD_PALETTE.find(y => y.code === prev).hex));
                const dCurr = getDistance(hexToRgb(bead.hex), hexToRgb(BEAD_PALETTE.find(y => y.code === curr).hex));
                return dCurr < dPrev ? curr : prev;
            }));
            return subBead;
        });

        render();
        controls.loading.classList.add('hidden');
    }, 100);
}

// --- RENDER & RULERS ---
function render() {
    controls.container.innerHTML = '';
    const size = parseInt(controls.grid.value);
    
    const availableHeight = (window.innerHeight * 0.85) - 40; 
    const cellSize = Math.floor(availableHeight / size);

    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';

    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = `repeat(${size}, ${cellSize}px)`; 
    grid.className = 'border-t border-l border-fbfwhite bg-white';

    const counts = {};
    const activePalette = [...new Set(currentPattern.filter(b => b).map(b => b.code))];

    currentPattern.forEach((bead, idx) => {
        const cell = document.createElement('div');
        cell.style.width = cell.style.height = `${cellSize}px`;
        cell.className = 'font-pixel border-r border-b border-fbfwhite/50 flex items-center justify-center font-sans cursor-crosshair';
        cell.style.fontSize = `${Math.min(cellSize * 0.4, 8)}px`;
        if (bead) {
            cell.style.backgroundColor = bead.hex;
            cell.innerText = showCodes ? bead.code : "";
            cell.style.color = getDistance(hexToRgb(bead.hex), {r:0,g:0,b:0}) < 140 ? 'white' : '#292725';
            counts[bead.code] = (counts[bead.code] || 0) + 1;
            if (highlightCode && bead.code !== highlightCode) cell.style.opacity = '0.15';
        }
        cell.onclick = (e) => { e.stopPropagation(); openPicker(idx, e.pageX, e.pageY, activePalette); };
        grid.appendChild(cell);
    });

    renderRulers(wrapper, size, cellSize);
    wrapper.appendChild(grid);
    controls.container.appendChild(wrapper);
    renderLegend(counts);
}

function renderRulers(wrapper, size, cellSize) {
    const top = document.createElement('div');
    top.className = 'absolute top-[-15px] left-0 flex no-print';
    for(let i=1; i<=size; i++) {
        const n = document.createElement('div');
        n.style.width = `${cellSize}px`;
        n.className = 'text-[8px] font-sans text-fbfblack/50 text-center';
        n.innerText = i % 5 === 0 ? i : '';
        top.appendChild(n);
    }
    wrapper.appendChild(top);

    const left = document.createElement('div');
    left.className = 'absolute left-[-15px] top-0 flex flex-col no-print';
    for(let i=1; i<=size; i++) {
        const n = document.createElement('div');
        n.style.height = `${cellSize}px`;
        n.className = 'text-[8px] font-sans text-fbfblack/50 flex items-center justify-end pr-1';
        n.innerText = i % 5 === 0 ? i : '';
        left.appendChild(n);
    }
    wrapper.appendChild(left);
}

// --- COLOR PICKER ---
function openPicker(index, x, y, activeCodes) {
    const picker = controls.floatingPicker;
    picker.innerHTML = '';
    picker.classList.remove('hidden');
    
    picker.style.left = `${Math.min(x, window.innerWidth - 150)}px`;
    picker.style.top = `${Math.min(y, window.innerHeight*0.85 - 200)}px`;

    activeCodes.forEach(code => {
        const bead = BEAD_PALETTE.find(b => b.code === code);
        const btn = document.createElement('div');
        btn.className = "w-6 h-6 rounded border cursor-pointer hover:scale-110 transition shadow-sm";
        btn.style.backgroundColor = bead.hex;
        btn.onclick = (e) => {
            e.stopPropagation();
            saveHistory(); // Save BEFORE changing pattern
            currentPattern[index] = bead;
            picker.classList.add('hidden');
            render();
        };
        picker.appendChild(btn);
    });

    const clearBtn = document.createElement('div');
    clearBtn.className = "w-6 h-6 rounded border cursor-pointer hover:scale-110 transition shadow-sm relative bg-white overflow-hidden";
    
    const slash = document.createElement('div');
    slash.style.position = 'absolute';
    slash.style.top = '0';
    slash.style.left = '0';
    slash.style.width = '150%';
    slash.style.height = '2px';
    slash.style.backgroundColor = '#ef4444';
    slash.style.transform = 'rotate(45deg)';
    slash.style.transformOrigin = 'top left';
    
    clearBtn.appendChild(slash);
    clearBtn.onclick = (e) => {
        e.stopPropagation();
        saveHistory(); // Save BEFORE changing pattern
        currentPattern[index] = null;
        picker.classList.add('hidden');
        render();
    };
    picker.appendChild(clearBtn);

    const closeHandler = (e) => {
        if (!picker.contains(e.target)) {
            picker.classList.add('hidden');
            document.removeEventListener('mousedown', closeHandler);
        }
    };
    setTimeout(() => document.addEventListener('mousedown', closeHandler), 10);
}

let isFirstChangeInSession = true;

function openGlobalPicker(oldCode, x, y) {
    const picker = controls.floatingPicker;
    picker.innerHTML = '';
    picker.classList.remove('hidden');
    isFirstChangeInSession = true; // Reset history trigger for this window session
    
    // Position the picker
    picker.style.left = `${Math.min(x - 220, window.innerWidth - 200)}px`;
    picker.style.top = `${Math.min(y - 80, window.innerHeight*0.9 - 320)}px`;

    // 1. Group colors by First Letter
    const groups = {};
    BEAD_PALETTE.forEach(bead => {
        const letter = bead.code.charAt(0).toUpperCase();
        if (!groups[letter]) groups[letter] = [];
        groups[letter].push(bead);
    });

    // 2. Sort and Render Groups
    Object.keys(groups).sort().forEach(letter => {
        // Add Letter Header
        const header = document.createElement('div');
        header.className = "group-header grow block w-full font-pixel";
        header.innerText = `${letter}`;
        picker.appendChild(header);

        // Add Beads for this letter
        groups[letter].forEach(newBead => {
            const btn = document.createElement('div');
            btn.className = "w-6 h-6 rounded-sm cursor-pointer hover:scale-110 transition-transform shadow-sm";
            btn.style.backgroundColor = newBead.hex;
            btn.title = newBead.code;

            btn.onclick = (e) => {
                e.stopPropagation();
                
                // Only save history on the first click of this picker session
                if (isFirstChangeInSession) {
                    saveHistory();
                    isFirstChangeInSession = false;
                }

                // Swap globally (Updates currentPattern but keeps picker open)
                currentPattern = currentPattern.map(bead => 
                    (bead && bead.code === oldCode) ? newBead : bead
                );
                
                // Update oldCode to the new one so the next click targets the same beads
                oldCode = newBead.code; 
                
                render(); 
            };
            picker.appendChild(btn);
        });
    });

    // 3. Robust Close Handler
    const closeHandler = (e) => {
        // If the click is OUTSIDE the picker, hide it and remove this listener
        if (!picker.contains(e.target)) {
            picker.classList.add('hidden');
            document.removeEventListener('mousedown', closeHandler);
        }
    };

    // Use a small timeout so the click that opened the picker doesn't immediately close it
    setTimeout(() => {
        document.addEventListener('mousedown', closeHandler);
    }, 50);
}

// --- LEGEND & DELETE ---
function renderLegend(counts) {
    controls.legend.innerHTML = '';
    Object.entries(counts).sort((a,b) => b[1] - a[1]).forEach(([code, count]) => {
        const bead = BEAD_PALETTE.find(b => b.code === code);
        const item = document.createElement('div');
        item.className = `legend-item flex max-h-10 items-center gap-2 rounded cursor-pointer ${highlightCode === code ? 'bg-fbfblue text-fbfwhite' : 'bg-white/80 text-fbfblack'} hover:bg-fbfblue/60 hover:scale-105 transition duration-300`;
        item.innerHTML = `
            
            <div class="h-10 w-10 rounded-l flex-shrink-0 flex items-center justify-center relative" style="background-color: ${bead.hex}">
                <button class="exchange-btn text-center p-1 transition-colors flex items-center justify-center" title="Replace this color globally">
                    <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                        <path fill-rule="evenodd" d="M11.5 15a.5.5 0 0 0 .5-.5V2.707l3.146 3.147a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 1 0 .708.708L11 2.707V14.5a.5.5 0 0 0 .5.5zm-7-14a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L4 13.293V1.5a.5.5 0 0 1 .5-.5z"/>
                    </svg>
                </button>
            </div>
            <div class="flex-1 p-2 min-w-0 font-sans">
                <div class="text-[10px] font-bold truncate">${code}</div>
                <div class="text-[9px] opacity-60">${count} pcs</div>
            </div>
            <button class="p-2 delete-btn ${highlightCode === code ? 'text-fbfwhite/60' : 'text-fbfblack/40'} hover:text-fbfred">
                <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>
            </button>`;

        
            // Handle the Exchange Click
        item.querySelector('.exchange-btn').onclick = (e) => {
            e.stopPropagation();
            openGlobalPicker(code, e.pageX, e.pageY);
        };

        // Handle Highlight Click
        item.onclick = (e) => { 
            if (!e.target.closest('.delete-btn') && !e.target.closest('.exchange-btn')) { 
                highlightCode = (highlightCode === code) ? null : code; 
                render(); 
            } 
        };

        // Handle Delete Click
        item.querySelector('.delete-btn').onclick = (e) => {
            e.stopPropagation();
            const others = Object.keys(counts).filter(c => c !== code);
            if (others.length === 0) return alert("Cannot delete the last remaining color.");
            saveHistory();
            const subBead = BEAD_PALETTE.find(x => x.code === others.reduce((a, b) => {
                const dA = getDistance(hexToRgb(bead.hex), hexToRgb(BEAD_PALETTE.find(y => y.code === a).hex));
                const dB = getDistance(hexToRgb(bead.hex), hexToRgb(BEAD_PALETTE.find(y => y.code === b).hex));
                return dB < dA ? b : a;
            }));
            currentPattern = currentPattern.map(b => (b && b.code === code) ? subBead : b);
            render();
        };
        controls.legend.appendChild(item);
    });
}

async function downloadBlueprint() {
    const size = parseInt(controls.grid.value);
    const exportCellSize = 25; 
    const margin = 100;
    const headerHeight = 50;
    const rulerOffset = 20; 
    const footerMargin = 60;
    
    const counts = {};
    currentPattern.forEach(b => { if(b) counts[b.code] = (counts[b.code] || 0) + 1; });
    const sortedPalette = Object.entries(counts).sort((a,b) => b[1] - a[1]);
    
    // --- 1. CALCULATE DIMENSIONS FIRST ---
    const gridWidth = size * exportCellSize;
    const cardWidth = 200;
    const cardHeight = 40;
    const horizontalGap = 15;
    const verticalGap = 15;

    // Calculate columns based on grid width
    const cols = Math.max(1, Math.floor((gridWidth + horizontalGap) / (cardWidth + horizontalGap)));
    
    // Now you can safely use 'cols' for these calculations
    const legendRows = Math.ceil(sortedPalette.length / cols);
    const legendTotalHeight = legendRows * (cardHeight + verticalGap);
    const legendWidth = (cols * cardWidth) + ((cols - 1) * horizontalGap);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Width: Left Margin + Left Ruler + Grid + Right Ruler + Right Margin
    canvas.width = Math.max(gridWidth + (rulerOffset * 2), legendWidth) + (margin * 2);
    // Height: Header + Top Ruler + Grid + Bottom Ruler + Footer + Legend + Margin
    canvas.height = headerHeight + gridWidth + (rulerOffset * 2) + footerMargin + legendTotalHeight + (margin * 2);

    // Background
    ctx.fillStyle = '#F0E9DD';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header Title
    ctx.fillStyle = '#8F3333';
    ctx.font = '32px "Tiny5", sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText('Fuse Bead Fuel', margin + rulerOffset, margin -20);

    // Positioning the grid centrally within the ruler frame
    const gridLeft = (canvas.width - gridWidth) / 2;
    const gridTop = headerHeight + rulerOffset + margin;

    // --- DRAW RULERS (All 4 Edges) ---
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = 'rgba(41, 39, 37, 0.5)';
    ctx.font = 'bold 11px sans-serif';

    for (let i = 1; i <= size; i++) {
        const offset = (i - 1) * exportCellSize + (exportCellSize / 2);
        
        // Horizontal Rulers (Top & Bottom)
        if (i % 1 === 0 || i === 1 || i === size) {
            ctx.textAlign = 'center';
            // Top
            ctx.fillText(i, gridLeft + offset, gridTop - 15);
            // Bottom
            ctx.fillText(i, gridLeft + offset, gridTop + gridWidth + 5);
        }

        // Vertical Rulers (Left & Right)
        if (i % 1 === 0 || i === 1 || i === size) {
            // Left
            ctx.textAlign = 'right';
            ctx.fillText(i, gridLeft - 5, gridTop + offset - 4);
            // Right
            ctx.textAlign = 'left';
            ctx.fillText(i, gridLeft + gridWidth + 5, gridTop + offset - 4);
        }
    }

    // --- DRAW BLUEPRINT GRID ---
    currentPattern.forEach((bead, idx) => {
        const x = idx % size;
        const y = Math.floor(idx / size);
        const posX = gridLeft + (x * exportCellSize);
        const posY = gridTop + (y * exportCellSize);

        if (bead) {
            const isHighlighted = !highlightCode || bead.code === highlightCode;
            ctx.globalAlpha = isHighlighted ? 1.0 : 0.15;
            
            ctx.fillStyle = bead.hex;
            ctx.fillRect(posX, posY, exportCellSize, exportCellSize);
            
            if (showCodes && isHighlighted) {
                ctx.globalAlpha = 1.0;
                ctx.fillStyle = getDistance(hexToRgb(bead.hex), {r:0,g:0,b:0}) < 140 ? 'white' : '#292725';
                ctx.font = `${exportCellSize * 0.4}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(bead.code, posX + (exportCellSize/2), posY + (exportCellSize/2));
            }
        }
        
        ctx.globalAlpha = 0.2;
        ctx.strokeStyle = '#292725';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(posX, posY, exportCellSize, exportCellSize);
    });

    // --- DRAW LEGEND ---
    const legendTop = gridTop + gridWidth + rulerOffset + footerMargin;
    const legendLeft = (canvas.width - legendWidth) / 2;

    sortedPalette.forEach(([code, count], i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = legendLeft + (col * (cardWidth + horizontalGap));
        const y = legendTop + (row * (cardHeight + verticalGap));
        const bead = BEAD_PALETTE.find(b => b.code === code);
        const isHighlighted = highlightCode === code;

        ctx.globalAlpha = 1.0;
        ctx.fillStyle = isHighlighted ? '#2452AD' : 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.roundRect(x, y, cardWidth, cardHeight, 4);
        ctx.fill();

        ctx.fillStyle = bead.hex;
        ctx.fillRect(x, y, cardHeight, cardHeight);

        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = isHighlighted ? '#F0E9DD' : '#292725';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(code, x + cardHeight + 8, y + 13);
        
        ctx.fillStyle = isHighlighted ? 'rgba(240, 233, 221, 0.7)' : 'rgba(41, 39, 37, 0.6)';
        ctx.font = '10px sans-serif';
        ctx.fillText(`${count} pcs`, x + cardHeight + 8, y + 27);
    });

    const link = document.createElement('a');
    link.download = `FBF-Blueprint-Complete-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
}

// Hook it up to your button
document.getElementById('downloadBtn').onclick = downloadBlueprint;

// Attach to button
document.getElementById('downloadBtn').onclick = downloadBlueprint;

controls.upload.onchange = (e) => {
    const reader = new FileReader();
    reader.onload = (f) => {
        currentImage = new Image();
        currentImage.onload = updatePreview;
        currentImage.src = f.target.result;
    };
    reader.readAsDataURL(e.target.files[0]);
};

controls.generate.onclick = generate;
init();