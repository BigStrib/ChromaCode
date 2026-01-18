/**
 * ChromaCode - Professional Color Parser
 * Enhanced color parsing with better regex patterns for all CSS color formats
 */

class ChromaCode {
    constructor() {
        this.colors = [];
        this.filteredColors = [];
        this.currentView = 'grid';
        this.searchQuery = '';
        this.currentExportFormat = 'css';
        
        // Named CSS colors for validation
        this.namedColors = new Set([
            'aliceblue', 'antiquewhite', 'aqua', 'aquamarine', 'azure', 'beige', 'bisque', 'black',
            'blanchedalmond', 'blue', 'blueviolet', 'brown', 'burlywood', 'cadetblue', 'chartreuse',
            'chocolate', 'coral', 'cornflowerblue', 'cornsilk', 'crimson', 'cyan', 'darkblue',
            'darkcyan', 'darkgoldenrod', 'darkgray', 'darkgreen', 'darkgrey', 'darkkhaki',
            'darkmagenta', 'darkolivegreen', 'darkorange', 'darkorchid', 'darkred', 'darksalmon',
            'darkseagreen', 'darkslateblue', 'darkslategray', 'darkslategrey', 'darkturquoise',
            'darkviolet', 'deeppink', 'deepskyblue', 'dimgray', 'dimgrey', 'dodgerblue', 'firebrick',
            'floralwhite', 'forestgreen', 'fuchsia', 'gainsboro', 'ghostwhite', 'gold', 'goldenrod',
            'gray', 'green', 'greenyellow', 'grey', 'honeydew', 'hotpink', 'indianred', 'indigo',
            'ivory', 'khaki', 'lavender', 'lavenderblush', 'lawngreen', 'lemonchiffon', 'lightblue',
            'lightcoral', 'lightcyan', 'lightgoldenrodyellow', 'lightgray', 'lightgreen', 'lightgrey',
            'lightpink', 'lightsalmon', 'lightseagreen', 'lightskyblue', 'lightslategray',
            'lightslategrey', 'lightsteelblue', 'lightyellow', 'lime', 'limegreen', 'linen',
            'magenta', 'maroon', 'mediumaquamarine', 'mediumblue', 'mediumorchid', 'mediumpurple',
            'mediumseagreen', 'mediumslateblue', 'mediumspringgreen', 'mediumturquoise',
            'mediumvioletred', 'midnightblue', 'mintcream', 'mistyrose', 'moccasin', 'navajowhite',
            'navy', 'oldlace', 'olive', 'olivedrab', 'orange', 'orangered', 'orchid', 'palegoldenrod',
            'palegreen', 'paleturquoise', 'palevioletred', 'papayawhip', 'peachpuff', 'peru', 'pink',
            'plum', 'powderblue', 'purple', 'rebeccapurple', 'red', 'rosybrown', 'royalblue',
            'saddlebrown', 'salmon', 'sandybrown', 'seagreen', 'seashell', 'sienna', 'silver',
            'skyblue', 'slateblue', 'slategray', 'slategrey', 'snow', 'springgreen', 'steelblue',
            'tan', 'teal', 'thistle', 'tomato', 'turquoise', 'violet', 'wheat', 'white', 'whitesmoke',
            'yellow', 'yellowgreen', 'transparent', 'currentcolor', 'inherit'
        ]);
        
        this.init();
    }
    
    init() {
        this.cacheDOM();
        this.createLineMeasurer();
        this.bindEvents();
        this.loadTheme();
        this.updateGutter();
        this.initResizer();
    }
    
    cacheDOM() {
        // Editor
        this.editor = document.getElementById('editor');
        this.gutter = document.getElementById('gutter');
        this.lineInfo = document.getElementById('lineInfo');
        this.charInfo = document.getElementById('charInfo');
        this.editorBody = document.querySelector('.editor-body');
        
        // Output
        this.colorContainer = document.getElementById('colorContainer');
        this.emptyState = document.getElementById('emptyState');
        this.colorBadge = document.getElementById('colorBadge');
        this.outputBody = document.getElementById('outputBody');
        
        // Stats
        this.totalColors = document.getElementById('totalColors');
        this.solidCount = document.getElementById('solidCount');
        this.gradientCount = document.getElementById('gradientCount');
        
        // Controls
        this.searchInput = document.getElementById('searchInput');
        this.searchClear = document.getElementById('searchClear');
        this.viewBtns = document.querySelectorAll('.view-btn');
        
        // Buttons
        this.importBtn = document.getElementById('importBtn');
        this.exportBtn = document.getElementById('exportBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.pasteBtn = document.getElementById('pasteBtn');
        this.themeToggle = document.getElementById('themeToggle');
        this.fileInput = document.getElementById('fileInput');
        
        // Modals
        this.colorModal = document.getElementById('colorModal');
        this.exportModal = document.getElementById('exportModal');
        
        // Toast
        this.toast = document.getElementById('toast');
    }
    
    /**
     * Create a hidden element to measure line heights
     * This mirrors the textarea's styling to get accurate measurements
     */
    createLineMeasurer() {
        this.lineMeasurer = document.createElement('div');
        this.lineMeasurer.className = 'line-measurer';
        this.lineMeasurer.setAttribute('aria-hidden', 'true');
        document.body.appendChild(this.lineMeasurer);
    }
    
    bindEvents() {
        // Editor input - live parsing
        this.editor.addEventListener('input', () => {
            this.updateGutter();
            this.updateEditorInfo();
            this.parse();
        });
        
        // Sync scroll between gutter and editor
        this.editor.addEventListener('scroll', () => {
            this.gutter.scrollTop = this.editor.scrollTop;
        });
        
        // Update gutter on resize (line wrapping may change)
        window.addEventListener('resize', () => {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => this.updateGutter(), 100);
        });
        
        // Cursor position
        this.editor.addEventListener('click', () => this.updateEditorInfo());
        this.editor.addEventListener('keyup', () => this.updateEditorInfo());
        
        // Tab support
        this.editor.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = this.editor.selectionStart;
                const end = this.editor.selectionEnd;
                this.editor.value = this.editor.value.substring(0, start) + '  ' + this.editor.value.substring(end);
                this.editor.selectionStart = this.editor.selectionEnd = start + 2;
                this.updateGutter();
                this.parse();
            }
        });
        
        // Search
        this.searchInput.addEventListener('input', () => {
            this.searchQuery = this.searchInput.value.toLowerCase().trim();
            this.filterAndRender();
        });
        
        this.searchClear.addEventListener('click', () => {
            this.searchInput.value = '';
            this.searchQuery = '';
            this.filterAndRender();
        });
        
        // View toggle
        this.viewBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.viewBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentView = btn.dataset.view;
                this.updateView();
            });
        });
        
        // Header buttons
        this.importBtn.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.importFile(e));
        this.exportBtn.addEventListener('click', () => this.openExportModal());
        this.clearBtn.addEventListener('click', () => this.clearEditor());
        this.pasteBtn.addEventListener('click', () => this.pasteFromClipboard());
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // Color modal
        document.getElementById('closeColorModal').addEventListener('click', () => {
            this.colorModal.classList.remove('show');
        });
        
        // Export modal
        document.getElementById('closeExportModal').addEventListener('click', () => {
            this.exportModal.classList.remove('show');
        });
        
        // Modal backdrop click
        [this.colorModal, this.exportModal].forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.classList.remove('show');
            });
        });
        
        // Export format tabs
        document.querySelectorAll('.format-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.format-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.currentExportFormat = tab.dataset.format;
                this.updateExportPreview();
            });
        });
        
        // Export actions
        document.getElementById('copyExportBtn').addEventListener('click', () => {
            this.copyExportCode();
        });
        
        document.getElementById('copyExportFull').addEventListener('click', () => {
            this.copyExportCode();
        });
        
        document.getElementById('downloadExport').addEventListener('click', () => {
            this.downloadExport();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.colorModal.classList.remove('show');
                this.exportModal.classList.remove('show');
            }
            
            if ((e.ctrlKey || e.metaKey) && e.key === 'v' && document.activeElement !== this.editor) {
                this.pasteFromClipboard();
            }
        });
    }
    
    // ========================================
    // Gutter (Line Numbers) - Fixed for Word Wrap
    // ========================================
    
    /**
     * Measure the rendered height of a line of text
     * accounting for word wrap
     */
    measureLineHeight(text) {
        // Set the measurer width to match the editor's content width
        const editorStyle = getComputedStyle(this.editor);
        const editorWidth = this.editor.clientWidth 
            - parseFloat(editorStyle.paddingLeft) 
            - parseFloat(editorStyle.paddingRight);
        
        this.lineMeasurer.style.width = editorWidth + 'px';
        
        // Use a non-breaking space for empty lines to get proper height
        this.lineMeasurer.textContent = text || '\u00A0';
        
        return this.lineMeasurer.offsetHeight;
    }
    
    updateGutter() {
        const lines = this.editor.value.split('\n');
        const colorLineSet = this.getColorLineNumbers();
        
        let html = '';
        
        for (let i = 0; i < lines.length; i++) {
            const lineNum = i + 1;
            const hasColor = colorLineSet.has(lineNum);
            const lineHeight = this.measureLineHeight(lines[i]);
            
            html += `<div class="gutter-line${hasColor ? ' has-color' : ''}" style="height: ${lineHeight}px">${lineNum}</div>`;
        }
        
        // Ensure at least one line
        if (lines.length === 0) {
            const defaultHeight = this.measureLineHeight('');
            html = `<div class="gutter-line" style="height: ${defaultHeight}px">1</div>`;
        }
        
        this.gutter.innerHTML = html;
        
        // Sync scroll position
        this.gutter.scrollTop = this.editor.scrollTop;
    }
    
    getColorLineNumbers() {
        const lines = this.editor.value.split('\n');
        const colorLines = new Set();
        
        lines.forEach((line, idx) => {
            if (this.extractColorsFromLine(line).length > 0) {
                colorLines.add(idx + 1);
            }
        });
        
        return colorLines;
    }
    
    updateEditorInfo() {
        const value = this.editor.value;
        const pos = this.editor.selectionStart;
        
        const beforeCursor = value.substring(0, pos);
        const lines = beforeCursor.split('\n');
        const currentLine = lines.length;
        const currentCol = lines[lines.length - 1].length + 1;
        
        this.lineInfo.textContent = `Ln ${currentLine}, Col ${currentCol}`;
        this.charInfo.textContent = `${value.length} characters`;
    }
    
    // ========================================
    // Resizer
    // ========================================
    
    initResizer() {
        const resizer = document.getElementById('resizer');
        const editorPanel = document.getElementById('editorPanel');
        
        if (!resizer || !editorPanel) return;
        
        let isResizing = false;
        let startX = 0;
        let startWidth = 0;
        
        resizer.addEventListener('mousedown', (e) => {
            isResizing = true;
            startX = e.clientX;
            startWidth = editorPanel.offsetWidth;
            resizer.classList.add('active');
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            const delta = e.clientX - startX;
            const newWidth = Math.max(320, Math.min(startWidth + delta, window.innerWidth * 0.6));
            editorPanel.style.width = newWidth + 'px';
            
            // Update gutter when resizing since word wrap changes
            this.updateGutter();
        });
        
        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                resizer.classList.remove('active');
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            }
        });
    }
    
    // ========================================
    // Smart Color Parsing - FIXED REGEX
    // ========================================
    
    parse() {
        this.colors = [];
        const lines = this.editor.value.split('\n');
        
        lines.forEach((line, idx) => {
            const lineNum = idx + 1;
            const extracted = this.extractColorsFromLine(line);
            
            extracted.forEach(colorInfo => {
                this.colors.push({
                    line: lineNum,
                    name: colorInfo.name,
                    value: colorInfo.value,
                    type: colorInfo.type
                });
            });
        });
        
        this.updateStats();
        this.filterAndRender();
        this.updateGutter();
    }
    
    extractColorsFromLine(line) {
        const results = [];
        const trimmed = line.trim();
        
        // Skip empty lines, comments
        if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
            return results;
        }
        
        let name = 'Color';
        let valuePart = trimmed;
        
        // Check for variable or property assignment
        if (line.includes(':')) {
            const colonIdx = line.indexOf(':');
            const potentialName = line.substring(0, colonIdx).trim();
            valuePart = line.substring(colonIdx + 1).trim().replace(/;$/, '').replace(/!important/gi, '').trim();
            
            // Clean up the name
            name = potentialName.replace(/^--|^\$|^@/, '').trim() || 'Color';
        }
        
        // Smart extraction - treats gradients as single units
        const colorValues = this.smartExtractColors(valuePart);
        
        colorValues.forEach(colorValue => {
            const cleanedValue = colorValue.trim();
            if (cleanedValue && this.isValidColor(cleanedValue)) {
                results.push({
                    name: name,
                    value: cleanedValue,
                    type: this.getColorType(cleanedValue)
                });
            }
        });
        
        return results;
    }
    
    /**
     * Smart color extraction - extracts gradients as complete units
     * and doesn't double-extract colors that are part of gradients
     * 
     * FIXED: Enhanced regex patterns to support all CSS color formats including:
     * - hsl(280, 100%, 59%) - HSL with commas
     * - hsl(280 100% 59%) - HSL with spaces (modern syntax)
     * - hsl(280deg 100% 59% / 0.5) - HSL with slash alpha
     * - rgb(255, 44, 44) - RGB with commas
     * - rgb(255 44 44) - RGB with spaces
     * - rgba(255 44 44 / 0.5) - RGBA with slash alpha
     */
    smartExtractColors(text) {
        const colors = [];
        let remainingText = text;
        
        // Step 1: Extract all gradients first (they contain other colors)
        const gradientPattern = /(?:linear-gradient|radial-gradient|conic-gradient|repeating-linear-gradient|repeating-radial-gradient|repeating-conic-gradient)\s*\((?:[^()]+|\((?:[^()]+|\([^()]*\))*\))*\)/gi;
        
        const gradients = text.match(gradientPattern) || [];
        gradients.forEach(gradient => {
            if (this.isValidColor(gradient)) {
                colors.push(gradient);
                // Remove this gradient from remaining text to avoid double extraction
                remainingText = remainingText.replace(gradient, ' __EXTRACTED__ ');
            }
        });
        
        // Step 2: Extract color functions from remaining text
        // These patterns handle both comma-separated and space-separated formats
        
        // OKLCH - modern syntax (handles spaces, commas, and slash alpha)
        const oklchPattern = /oklch\s*\(\s*([\d.]+(?:%)?)\s*[, ]\s*([\d.]+)\s*[, ]\s*([\d.]+(?:deg)?)\s*(?:\/\s*([\d.]+(?:%)?))?\s*\)/gi;
        
        // OKLAB
        const oklabPattern = /oklab\s*\(\s*([\d.]+(?:%)?)\s*[, ]\s*(-?[\d.]+)\s*[, ]\s*(-?[\d.]+)\s*(?:\/\s*([\d.]+(?:%)?))?\s*\)/gi;
        
        // LCH
        const lchPattern = /lch\s*\(\s*([\d.]+(?:%)?)\s*[, ]\s*([\d.]+)\s*[, ]\s*([\d.]+(?:deg)?)\s*(?:\/\s*([\d.]+(?:%)?))?\s*\)/gi;
        
        // LAB
        const labPattern = /lab\s*\(\s*([\d.]+(?:%)?)\s*[, ]\s*(-?[\d.]+)\s*[, ]\s*(-?[\d.]+)\s*(?:\/\s*([\d.]+(?:%)?))?\s*\)/gi;
        
        // HWB
        const hwbPattern = /hwb\s*\(\s*([\d.]+(?:deg|rad|grad|turn)?)\s*[, ]\s*([\d.]+(?:%)?)\s*[, ]\s*([\d.]+(?:%)?)\s*(?:\/\s*([\d.]+(?:%)?))?\s*\)/gi;
        
        // color() function
        const colorPattern = /color\s*\(\s*([\w-]+)\s+([-\d.]+(?:%)?)\s+([-\d.]+(?:%)?)\s+([-\d.]+(?:%)?)\s*(?:\/\s*([\d.]+(?:%)?))?\s*\)/gi;
        
        // HSL/HSLA - flexible pattern handling spaces, commas, and slash alpha
        // Matches: hsl(280, 100%, 59%), hsl(280 100% 59%), hsl(280deg 100% 59% / 0.5), hsla(280 100% 59% / 0.5)
        const hslPattern = /hsla?\s*\(\s*([\d.]+(?:deg|rad|grad|turn)?)\s*[, ]\s*([\d.]+(?:%)?)\s*[, ]\s*([\d.]+(?:%)?)\s*(?:\/\s*([\d.]+(?:%)?)|(?:,\s*([\d.]+(?:%)?)))?\s*\)/gi;
        
        // RGB/RGBA - flexible pattern handling spaces, commas, and slash alpha
        // Matches: rgb(255, 44, 44), rgb(255 44 44), rgb(255 44 44 / 0.5), rgba(255 44 44, 0.5)
        const rgbPattern = /rgba?\s*\(\s*([\d.]+(?:%)?)\s*[, ]\s*([\d.]+(?:%)?)\s*[, ]\s*([\d.]+(?:%)?)\s*(?:\/\s*([\d.]+(?:%)?)|(?:,\s*([\d.]+(?:%)?)))?\s*\)/gi;
        
        const colorFunctionPatterns = [
            { pattern: oklchPattern, name: 'oklch' },
            { pattern: oklabPattern, name: 'oklab' },
            { pattern: lchPattern, name: 'lch' },
            { pattern: labPattern, name: 'lab' },
            { pattern: hwbPattern, name: 'hwb' },
            { pattern: colorPattern, name: 'color' },
            { pattern: hslPattern, name: 'hsl' },
            { pattern: rgbPattern, name: 'rgb' },
        ];
        
        colorFunctionPatterns.forEach(({ pattern, name }) => {
            let match;
            while ((match = pattern.exec(remainingText)) !== null) {
                const fullMatch = match[0];
                if (!colors.includes(fullMatch) && this.isValidColor(fullMatch)) {
                    colors.push(fullMatch);
                    // Replace in remaining text (being careful to only replace this specific match)
                    const escapedMatch = fullMatch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    remainingText = remainingText.replace(new RegExp(escapedMatch), ' __EXTRACTED__ ');
                }
            }
        });
        
        // Step 3: Extract hex colors from remaining text
        const hexPatterns = [
            { pattern: /#[0-9A-Fa-f]{8}\b/g, name: 'hex8' },
            { pattern: /#[0-9A-Fa-f]{6}\b/g, name: 'hex6' },
            { pattern: /#[0-9A-Fa-f]{4}\b/g, name: 'hex4' },
            { pattern: /#[0-9A-Fa-f]{3}\b/g, name: 'hex3' },
        ];
        
        hexPatterns.forEach(({ pattern }) => {
            const matches = remainingText.match(pattern) || [];
            matches.forEach(match => {
                if (!colors.includes(match) && this.isValidColor(match)) {
                    colors.push(match);
                    remainingText = remainingText.replace(match, ' __EXTRACTED__ ');
                }
            });
        });
        
        // Step 4: Extract named colors from remaining text
        const words = remainingText.toLowerCase().split(/[\s:;,(){}'"]+/);
        words.forEach(word => {
            const cleanWord = word.trim();
            if (cleanWord && this.namedColors.has(cleanWord) && !colors.map(c => c.toLowerCase()).includes(cleanWord)) {
                // Don't add 'inherit' or 'currentcolor' as they're not real colors
                if (cleanWord !== 'inherit' && cleanWord !== 'currentcolor') {
                    colors.push(cleanWord);
                }
            }
        });
        
        return colors;
    }
    
    isValidColor(str) {
        if (!str || str.length === 0) return false;
        
        const trimmed = str.trim();
        if (!trimmed) return false;
        
        // Quick validation for known patterns
        const lowerStr = trimmed.toLowerCase();
        
        // Skip CSS keywords that aren't colors
        const skipKeywords = ['none', 'inherit', 'initial', 'unset', 'auto', 'normal', 'solid'];
        if (skipKeywords.includes(lowerStr)) return false;
        
        // Skip numeric values alone
        if (/^[\d.,%\s]+$/.test(trimmed)) return false;
        
        // Use the browser to validate
        const testEl = document.createElement('div');
        testEl.style.background = '';
        testEl.style.background = trimmed;
        
        return testEl.style.background !== '';
    }
    
    getColorType(value) {
        const lower = value.toLowerCase();
        
        // Check for gradients
        if (lower.includes('gradient')) {
            return 'gradient';
        }
        
        // Check for transparency
        if (lower === 'transparent') {
            return 'transparent';
        }
        
        // Check for alpha channel in various formats
        if (lower.includes('rgba') || lower.includes('hsla')) {
            return 'transparent';
        }
        
        // Modern color functions with alpha (using / syntax)
        if ((lower.includes('rgb(') || lower.includes('hsl(') || 
             lower.includes('oklch(') || lower.includes('oklab(') ||
             lower.includes('lch(') || lower.includes('lab(') ||
             lower.includes('hwb(') || lower.includes('color(')) && lower.includes('/')) {
            return 'transparent';
        }
        
        // 4-digit or 8-digit hex (with alpha)
        if (lower.startsWith('#') && (lower.length === 5 || lower.length === 9)) {
            return 'transparent';
        }
        
        return 'solid';
    }
    
    // ========================================
    // Filtering & Rendering
    // ========================================
    
    filterAndRender() {
        if (this.searchQuery) {
            this.filteredColors = this.colors.filter(c => 
                c.name.toLowerCase().includes(this.searchQuery) ||
                c.value.toLowerCase().includes(this.searchQuery) ||
                c.type.toLowerCase().includes(this.searchQuery)
            );
        } else {
            this.filteredColors = [...this.colors];
        }
        
        this.render();
    }
    
    render() {
        this.colorContainer.innerHTML = '';
        
        if (this.filteredColors.length === 0) {
            this.emptyState.classList.add('show');
            this.colorBadge.textContent = '0';
            return;
        }
        
        this.emptyState.classList.remove('show');
        this.colorBadge.textContent = this.filteredColors.length;
        
        this.filteredColors.forEach((color, idx) => {
            const card = this.createColorCard(color, idx);
            this.colorContainer.appendChild(card);
        });
        
        this.updateView();
    }
    
    createColorCard(color, idx) {
        const card = document.createElement('div');
        card.className = 'color-card';
        card.dataset.index = idx;
        
        // Determine display value (truncate long gradients)
        const displayValue = color.value.length > 50 
            ? color.value.substring(0, 47) + '...' 
            : color.value;
        
        card.innerHTML = `
            <span class="card-line-badge">L${color.line}</span>
            <div class="card-swatch">
                <div class="checkerboard"></div>
                <div class="color-fill" style="background: ${color.value}"></div>
            </div>
            <button class="card-quick-copy" title="Copy color value">
                <i class="fas fa-copy"></i>
            </button>
            <div class="card-body">
                <div class="card-name">${this.escapeHtml(this.formatName(color.name))}</div>
                <div class="card-value" title="${this.escapeHtml(color.value)}">${this.escapeHtml(displayValue)}</div>
                <span class="card-type-badge">${color.type}</span>
            </div>
        `;
        
        // Open modal on click
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.card-quick-copy')) {
                this.openColorModal(color);
            }
        });
        
        // Quick copy
        card.querySelector('.card-quick-copy').addEventListener('click', (e) => {
            e.stopPropagation();
            this.copyToClipboard(color.value);
        });
        
        return card;
    }
    
    formatName(name) {
        return name.replace(/^--|^\$|^@/, '').trim() || 'Color';
    }
    
    updateView() {
        this.colorContainer.className = `color-container view-${this.currentView}`;
    }
    
    updateStats() {
        const total = this.colors.length;
        const solid = this.colors.filter(c => c.type === 'solid').length;
        const gradient = this.colors.filter(c => c.type === 'gradient').length;
        const transparent = this.colors.filter(c => c.type === 'transparent').length;
        
        this.totalColors.textContent = total;
        this.solidCount.textContent = solid;
        this.gradientCount.textContent = gradient + transparent;
    }
    
    // ========================================
    // Color Modal
    // ========================================
    
    openColorModal(color) {
        document.getElementById('modalColorName').textContent = this.formatName(color.name);
        document.getElementById('colorFill').style.background = color.value;
        document.getElementById('previewLine').textContent = `Line ${color.line}`;
        document.getElementById('previewType').textContent = color.type.charAt(0).toUpperCase() + color.type.slice(1);
        
        // Populate formats
        const formatGrid = document.getElementById('formatGrid');
        formatGrid.innerHTML = '';
        
        const formats = this.getColorFormats(color);
        
        formats.forEach(format => {
            const row = document.createElement('div');
            row.className = 'format-row';
            row.innerHTML = `
                <label>${format.label}</label>
                <input type="text" value="${this.escapeHtml(format.value)}" readonly>
                <button class="copy-btn" title="Copy">
                    <i class="fas fa-copy"></i>
                </button>
            `;
            
            row.querySelector('.copy-btn').addEventListener('click', () => {
                this.copyToClipboard(format.value);
            });
            
            formatGrid.appendChild(row);
        });
        
        // Shades section - only for non-gradients
        const shadesSection = document.getElementById('shadesSection');
        const shadesStrip = document.getElementById('shadesStrip');
        
        if (color.type !== 'gradient') {
            shadesSection.style.display = 'block';
            this.renderShades(shadesStrip, color.value);
        } else {
            shadesSection.style.display = 'none';
        }
        
        // Harmony section - only for non-gradients
        const harmonySection = document.getElementById('harmonySection');
        const harmonyGrid = document.getElementById('harmonyGrid');
        
        if (color.type !== 'gradient') {
            harmonySection.style.display = 'block';
            this.renderHarmony(harmonyGrid, color.value);
        } else {
            harmonySection.style.display = 'none';
        }
        
        this.colorModal.classList.add('show');
    }
    
    getColorFormats(color) {
        const formats = [
            { label: 'Original', value: color.value }
        ];
        
        // For gradients, extract the colors used
        if (color.type === 'gradient') {
            const gradientColors = this.extractGradientColors(color.value);
            if (gradientColors.length > 0) {
                formats.push({ label: 'Colors', value: gradientColors.join(', ') });
            }
            return formats;
        }
        
        try {
            const rgb = this.parseToRGB(color.value);
            if (rgb) {
                const hex = this.rgbToHex(rgb.r, rgb.g, rgb.b);
                const hsl = this.rgbToHSL(rgb.r, rgb.g, rgb.b);
                
                formats.push({ label: 'HEX', value: hex });
                formats.push({ label: 'RGB', value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` });
                formats.push({ label: 'HSL', value: `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)` });
                
                // Add alpha formats if transparent
                if (rgb.a !== undefined && rgb.a < 1) {
                    const alpha = Math.round(rgb.a * 100) / 100;
                    formats.push({ label: 'RGBA', value: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})` });
                    formats.push({ label: 'HSLA', value: `hsla(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%, ${alpha})` });
                    
                    // 8-digit hex with alpha
                    const alphaHex = Math.round(rgb.a * 255).toString(16).padStart(2, '0');
                    formats.push({ label: 'HEX8', value: hex + alphaHex });
                }
            }
        } catch (e) {
            // Silent fail
        }
        
        return formats;
    }
    
    extractGradientColors(gradientStr) {
        const colors = [];
        
        const colorPatterns = [
            /#[0-9A-Fa-f]{3,8}\b/g,
            /rgba?\s*\([^)]+\)/gi,
            /hsla?\s*\([^)]+\)/gi,
        ];
        
        colorPatterns.forEach(pattern => {
            const matches = gradientStr.match(pattern) || [];
            matches.forEach(match => {
                if (!colors.includes(match)) {
                    colors.push(match);
                }
            });
        });
        
        return colors;
    }
    
    renderShades(container, colorValue) {
        container.innerHTML = '';
        
        try {
            const rgb = this.parseToRGB(colorValue);
            if (!rgb) return;
            
            const hsl = this.rgbToHSL(rgb.r, rgb.g, rgb.b);
            
            for (let l = 5; l <= 95; l += 10) {
                const chip = document.createElement('div');
                chip.className = 'shade-chip';
                chip.style.background = `hsl(${hsl.h}, ${hsl.s}%, ${l}%)`;
                chip.dataset.lightness = `${l}%`;
                
                chip.addEventListener('click', () => {
                    this.copyToClipboard(`hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${l}%)`);
                });
                
                container.appendChild(chip);
            }
        } catch (e) {
            // Silent fail
        }
    }
    
    renderHarmony(container, colorValue) {
        container.innerHTML = '';
        
        try {
            const rgb = this.parseToRGB(colorValue);
            if (!rgb) return;
            
            const hsl = this.rgbToHSL(rgb.r, rgb.g, rgb.b);
            
            const harmonies = [
                { h: hsl.h, label: 'Original' },
                { h: (hsl.h + 180) % 360, label: 'Complementary' },
                { h: (hsl.h + 120) % 360, label: 'Triadic' },
                { h: (hsl.h + 240) % 360, label: 'Triadic' },
                { h: (hsl.h + 30) % 360, label: 'Analogous' },
            ];
            
            harmonies.forEach(harmony => {
                const chip = document.createElement('div');
                chip.className = 'harmony-chip';
                chip.style.background = `hsl(${harmony.h}, ${hsl.s}%, ${hsl.l}%)`;
                chip.title = harmony.label;
                
                chip.addEventListener('click', () => {
                    this.copyToClipboard(`hsl(${Math.round(harmony.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)`);
                });
                
                container.appendChild(chip);
            });
        } catch (e) {
            // Silent fail
        }
    }
    
    // ========================================
    // Export Modal
    // ========================================
    
    openExportModal() {
        if (this.colors.length === 0) {
            this.showToast('No colors to export', 'warning');
            return;
        }
        
        this.updateExportPreview();
        this.exportModal.classList.add('show');
    }
    
    updateExportPreview() {
        const code = document.getElementById('exportCode');
        const fileName = document.getElementById('exportFileName');
        
        let output = '';
        const ext = { css: 'css', scss: 'scss', json: 'json', tailwind: 'js', array: 'js' };
        
        fileName.textContent = `colors.${ext[this.currentExportFormat]}`;
        
        switch (this.currentExportFormat) {
            case 'css':
                output = ':root {\n';
                this.colors.forEach((c, i) => {
                    const varName = c.name.startsWith('--') ? c.name : `--${this.slugify(c.name)}-${i + 1}`;
                    output += `  ${varName}: ${c.value};\n`;
                });
                output += '}';
                break;
                
            case 'scss':
                this.colors.forEach((c, i) => {
                    const varName = '$' + this.slugify(c.name.replace(/^--|^\$/g, '')) + '-' + (i + 1);
                    output += `${varName}: ${c.value};\n`;
                });
                break;
                
            case 'json':
                const jsonObj = {};
                this.colors.forEach((c, i) => {
                    const key = this.slugify(c.name.replace(/^--|^\$/g, '')) + '_' + (i + 1);
                    jsonObj[key] = c.value;
                });
                output = JSON.stringify(jsonObj, null, 2);
                break;
                
            case 'tailwind':
                output = `module.exports = {\n  theme: {\n    extend: {\n      colors: {\n`;
                this.colors.forEach((c, i) => {
                    const key = this.slugify(c.name.replace(/^--|^\$/g, '')) + '-' + (i + 1);
                    const escapedValue = c.value.replace(/'/g, "\\'");
                    output += `        '${key}': '${escapedValue}',\n`;
                });
                output += `      },\n    },\n  },\n}`;
                break;
                
            case 'array':
                const arr = this.colors.map(c => c.value);
                output = `const colors = [\n${arr.map(v => `  '${v.replace(/'/g, "\\'")}'`).join(',\n')}\n];\n\nexport default colors;`;
                break;
        }
        
        code.textContent = output;
    }
    
    copyExportCode() {
        const code = document.getElementById('exportCode').textContent;
        this.copyToClipboard(code);
    }
    
    downloadExport() {
        const code = document.getElementById('exportCode').textContent;
        const fileName = document.getElementById('exportFileName').textContent;
        
        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showToast(`Downloaded ${fileName}`);
    }
    
    // ========================================
    // File Import
    // ========================================
    
    importFile(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (evt) => {
            this.editor.value = evt.target.result;
            this.updateGutter();
            this.updateEditorInfo();
            this.parse();
            this.showToast(`Imported ${file.name}`);
        };
        reader.readAsText(file);
        e.target.value = '';
    }
    
    async pasteFromClipboard() {
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                if (this.editor.value.trim()) {
                    this.editor.value += '\n' + text;
                } else {
                    this.editor.value = text;
                }
                this.updateGutter();
                this.updateEditorInfo();
                this.parse();
                this.showToast('Pasted from clipboard');
            }
        } catch (e) {
            this.showToast('Failed to paste', 'error');
        }
    }
    
    clearEditor() {
        if (this.editor.value && !confirm('Clear all code?')) return;
        this.editor.value = '';
        this.updateGutter();
        this.updateEditorInfo();
        this.parse();
        this.showToast('Editor cleared');
    }
    
    // ========================================
    // Theme
    // ========================================
    
    toggleTheme() {
        const isDark = !document.body.hasAttribute('data-theme');
        
        if (isDark) {
            document.body.setAttribute('data-theme', 'light');
            this.themeToggle.querySelector('i').className = 'fas fa-sun';
            localStorage.setItem('chromacode-theme', 'light');
        } else {
            document.body.removeAttribute('data-theme');
            this.themeToggle.querySelector('i').className = 'fas fa-moon';
            localStorage.setItem('chromacode-theme', 'dark');
        }
    }
    
    loadTheme() {
        const theme = localStorage.getItem('chromacode-theme');
        if (theme === 'light') {
            document.body.setAttribute('data-theme', 'light');
            this.themeToggle.querySelector('i').className = 'fas fa-sun';
        }
    }
    
    // ========================================
    // Utilities
    // ========================================
    
    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            this.showToast('Copied!');
        }).catch(() => {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
                this.showToast('Copied!');
            } catch (e) {
                this.showToast('Failed to copy', 'error');
            }
            document.body.removeChild(textarea);
        });
    }
    
    showToast(message, type = 'success') {
        const icon = this.toast.querySelector('.toast-icon');
        const msg = this.toast.querySelector('.toast-message');
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle'
        };
        
        const colors = {
            success: 'var(--success)',
            error: 'var(--error)',
            warning: 'var(--warning)'
        };
        
        icon.className = `toast-icon fas ${icons[type] || icons.success}`;
        icon.style.color = colors[type] || colors.success;
        msg.textContent = message;
        
        this.toast.classList.add('show');
        
        clearTimeout(this.toastTimeout);
        this.toastTimeout = setTimeout(() => {
            this.toast.classList.remove('show');
        }, 2500);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    slugify(text) {
        return text.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '') || 'color';
    }
    
    // ========================================
    // Color Parsing & Conversion
    // ========================================
    
    parseToRGB(colorValue) {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 1;
        const ctx = canvas.getContext('2d');
        
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = colorValue;
        ctx.fillRect(0, 0, 1, 1);
        
        const data = ctx.getImageData(0, 0, 1, 1).data;
        return { 
            r: data[0], 
            g: data[1], 
            b: data[2], 
            a: Math.round((data[3] / 255) * 100) / 100 
        };
    }
    
    rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }
    
    rgbToHSL(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        
        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            
            switch (max) {
                case r: 
                    h = ((g - b) / d + (g < b ? 6 : 0)) / 6; 
                    break;
                case g: 
                    h = ((b - r) / d + 2) / 6; 
                    break;
                case b: 
                    h = ((r - g) / d + 4) / 6; 
                    break;
            }
        }
        
        return { 
            h: h * 360, 
            s: s * 100, 
            l: l * 100 
        };
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.chromaCode = new ChromaCode();
});