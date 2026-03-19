const state = {
    stats: {
        calls: 0,
        orig: 0,
        comp: 0,
        lat: 0
    }
};

const DOMElements = {
    pdfSelect: document.getElementById('pdf-select'),
    clearBtn: document.getElementById('clear-btn'),
    refreshBtn: document.getElementById('refresh-btn'),
    chatHistory: document.getElementById('chat-history'),
    chatInput: document.getElementById('chat-input'),
    sendBtn: document.getElementById('send-btn'),

    // Stats
    stCalls: document.getElementById('stat-calls'),
    stRatio: document.getElementById('stat-ratio'),
    stLat: document.getElementById('stat-lat'),
    stOrig: document.getElementById('stat-orig'),
    stComp: document.getElementById('stat-comp'),
    stSaved: document.getElementById('stat-saved'),
    stSavings: document.getElementById('stat-savings'),
    summaryContainer: document.getElementById('summary-container'),
    summaryContent: document.getElementById('summary-content'),
    scrollArea: document.querySelector('.scroll-area'),
};

async function fetchDocuments() {
    try {
        const res = await fetch('/api/documents');
        const data = await res.json();
        const select = DOMElements.pdfSelect;
        select.innerHTML = '<option value="">-- Select Document --</option>';
        data.documents.forEach(doc => {
            const opt = document.createElement('option');
            opt.value = doc;
            opt.textContent = doc;
            select.appendChild(opt);
        });
    } catch (e) {
        console.error("Failed to fetch documents", e);
    }
}

function updateSidebarStats() {
    const s = state.stats;
    DOMElements.stCalls.textContent = s.calls;
    DOMElements.stOrig.textContent = s.orig.toLocaleString();
    DOMElements.stComp.textContent = s.comp.toLocaleString();

    const saved = s.orig - s.comp;
    DOMElements.stSaved.textContent = saved.toLocaleString();

    const ratio = s.orig > 0 ? ((saved / s.orig) * 100).toFixed(1) : 0;
    DOMElements.stRatio.textContent = ratio + '%';

    const avgLat = s.calls > 0 ? Math.round(s.lat / s.calls) : 0;
    DOMElements.stLat.textContent = avgLat + 'ms';

    // Calculate savings based on GPT-5.4 mini pricing: $0.75 per 1M tokens
    // Savings = (Original - Compressed) * Price
    const savingsDollars = (saved * 0.75) / 1000000;
    DOMElements.stSavings.textContent = '$' + savingsDollars.toFixed(2);
}

function addMessageToChat(role, text) {
    const tmplId = role === 'user' ? 'tmpl-user' : 'tmpl-bot';
    const tmpl = document.getElementById(tmplId);
    const clone = tmpl.content.cloneNode(true);
    const contentDiv = clone.querySelector('.msg-content');

    // Simple text replacement (could use marked.js for real markdown)
    contentDiv.innerHTML = text.replace(/\n/g, '<br>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');

    DOMElements.chatHistory.appendChild(clone);
    scrollToBottom();
    return DOMElements.chatHistory.lastElementChild;
}

function addMetricsCard(node, metrics) {
    const tmpl = document.getElementById('tmpl-metrics');
    const clone = tmpl.content.cloneNode(true);

    // Add doc filename if present
    if (metrics.pdf_filename) {
        const docRow = document.createElement('div');
        docRow.className = 'metric-doc';
        docRow.innerHTML = `<span>📂 Document Context: <b>${metrics.pdf_filename}</b></span>`;
        clone.querySelector('.metrics-row').prepend(docRow);
    }

    clone.querySelector('.m-orig').textContent = metrics.original_tokens.toLocaleString();
    clone.querySelector('.m-comp').textContent = metrics.compressed_tokens.toLocaleString();
    clone.querySelector('.m-red').textContent = metrics.reduction_pct + '%';
    node.appendChild(clone);
    scrollToBottom();
}

function scrollToBottom() {
    DOMElements.scrollArea.scrollTop = DOMElements.scrollArea.scrollHeight;
}

async function handleSend() {
    const prompt = DOMElements.chatInput.value.trim();
    const pdfFilename = DOMElements.pdfSelect.value;

    if (!prompt) return;

    DOMElements.chatInput.value = '';

    // Add User message
    addMessageToChat('user', prompt);

    // Show thinking indicator
    const botNode = addMessageToChat('bot', '<span class="thinking">Analyzing document and compressing context via API...</span>');
    const contentDiv = botNode.querySelector('.msg-content');

    try {
        const payload = { prompt, pdf_filename: pdfFilename };
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.detail || `Server error: ${res.status}`);
        }

        const data = await res.json();

        // Update Bot Content
        contentDiv.innerHTML = data.answer.replace(/\n/g, '<br>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');

        if (data.metrics) {
            // Update stats
            state.stats.calls++;
            state.stats.orig += data.metrics.original_tokens;
            state.stats.comp += data.metrics.compressed_tokens;
            state.stats.lat += data.metrics.latency_ms || 300;
            updateSidebarStats();

            // Render metrics card
            addMetricsCard(botNode, data.metrics);
        }
    } catch (e) {
        contentDiv.innerHTML = `<span style="color:red">Error processing request: ${e.message}</span>`;
    }
}

async function triggerSummary() {
    const filename = DOMElements.pdfSelect.value;
    if (!filename) {
        DOMElements.summaryContainer.style.display = 'none';
        return;
    }

    DOMElements.summaryContainer.style.display = 'block';
    DOMElements.summaryContent.innerHTML = '<span class="thinking">Generating simplified summary...</span>';

    try {
        const res = await fetch('/api/summarize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pdf_filename: filename })
        });

        if (!res.ok) throw new Error("Summary failed");

        const data = await res.json();
        DOMElements.summaryContent.innerHTML = data.answer.replace(/\n/g, '<br>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');

        if (data.metrics) {
            state.stats.calls++;
            state.stats.orig += data.metrics.original_tokens;
            state.stats.comp += data.metrics.compressed_tokens;
            state.stats.lat += data.metrics.latency_ms || 300;
            updateSidebarStats();
        }
    } catch (e) {
        DOMElements.summaryContent.innerHTML = `<span style="color:red">Error: ${e.message}</span>`;
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    fetchDocuments();
    updateSidebarStats();
});

DOMElements.sendBtn.addEventListener('click', handleSend);
DOMElements.chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSend();
});

DOMElements.pdfSelect.addEventListener('change', triggerSummary);

DOMElements.clearBtn.addEventListener('click', () => {
    DOMElements.chatHistory.innerHTML = '';
});

DOMElements.refreshBtn.addEventListener('click', updateSidebarStats);
