/**
 * SOMMELIER PRO — AI Concierge
 * フロントエンドRAG: knowledge_base.json内ベクトル検索 + GAS API経由Gemini回答生成
 */

// ---- CONFIG ----
const KB_LITE_PATH = '../data/knowledge_lite.json';
const KB_VECTORS_PATH = '../data/knowledge_vectors.bin';
// GAS_API_URLはデプロイ後に設定（Phase 2完了後）
// 暫定: フロントエンド直接モード（Gemini API直接呼び出し）
let GAS_API_URL = '';
let knowledgeBase = null;
let isAiOpen = false;
let isLoading = false;
let conversationHistory = [];

// Dev mode: API key injection (production should use GAS backend)
// Set via browser console: localStorage.setItem('sommelier_api_key', 'YOUR_KEY')


// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
    const closeBtn = document.getElementById('aiClose');
    const sendBtn = document.getElementById('aiSend');
    const input = document.getElementById('aiInput');

    closeBtn.addEventListener('click', closeAiPanel);
    sendBtn.addEventListener('click', () => submitQuery());
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submitQuery();
        }
    });

    // Suggestion buttons
    document.querySelectorAll('.ai-suggestion').forEach(btn => {
        btn.addEventListener('click', () => {
            const q = btn.dataset.q;
            document.getElementById('aiInput').value = q;
            submitQuery();
        });
    });

    // Listen for custom trigger to open panel and inject prompt
    document.addEventListener('open-ai-concierge', (e) => {
        const concierge = document.getElementById('aiConcierge');
        isAiOpen = true;
        concierge.classList.add('open');
        
        // Update nav item state
        document.querySelectorAll('.bottom-nav-item').forEach(i => i.classList.remove('active'));
        document.getElementById('navAi')?.classList.add('active');

        if (e.detail && e.detail.initialPrompt) {
            document.getElementById('aiInput').value = e.detail.initialPrompt;
            submitQuery();
        }
    });

    // Preload knowledge base in background
    preloadKnowledgeBase();
});


// ---- Panel Close ----
function closeAiPanel() {
    const concierge = document.getElementById('aiConcierge');
    isAiOpen = false;
    concierge.classList.remove('open');
    // Reset bottom nav to home
    document.querySelectorAll('.bottom-nav-item').forEach(i => i.classList.remove('active'));
    document.getElementById('navHome')?.classList.add('active');
}


// ---- Knowledge Base Loading (Lite JSON + Binary Vectors) ----
async function preloadKnowledgeBase() {
    try {
        console.log('[AI] Loading knowledge base (lite)...');

        // 1. Load text + metadata
        const liteRes = await fetch(KB_LITE_PATH);
        knowledgeBase = await liteRes.json();
        console.log(`[AI] Lite loaded: ${knowledgeBase.total_chunks} chunks`);

        // 2. Load binary vectors
        console.log('[AI] Loading vectors...');
        const vecRes = await fetch(KB_VECTORS_PATH);
        const buffer = await vecRes.arrayBuffer();
        const view = new DataView(buffer);

        const chunkCount = view.getUint32(0, true);  // little-endian
        const dim = view.getUint32(4, true);
        console.log(`[AI] Vectors: ${chunkCount} x ${dim}D`);

        // Parse Float32 vectors and attach to chunks
        const headerSize = 8;  // 2 x uint32
        for (let i = 0; i < chunkCount && i < knowledgeBase.chunks.length; i++) {
            const offset = headerSize + i * dim * 4;
            const embedding = new Float32Array(buffer, offset, dim);
            knowledgeBase.chunks[i].embedding = Array.from(embedding);
        }

        console.log(`[AI] ✅ Knowledge base ready: ${chunkCount} chunks with embeddings`);
    } catch (err) {
        console.warn('[AI] Knowledge base not available yet:', err.message);
    }
}


// ---- Query Submission ----
async function submitQuery() {
    const input = document.getElementById('aiInput');
    const query = input.value.trim();
    if (!query || isLoading) return;

    input.value = '';
    isLoading = true;

    // Show user question
    appendMessage('user', query);

    // Show loading
    const loadingId = appendMessage('ai', '<div class="ai-typing">ナレッジベースを検索中<span class="dots"></span></div>');

    try {
        let answer, sources;

        if (knowledgeBase && knowledgeBase.chunks && knowledgeBase.chunks.length > 0) {
            // フロントエンドRAGモード（ベクトル検索はローカル、生成のみAPI）
            const result = await localRAG(query);
            answer = result.answer;
            sources = result.sources;
        } else {
            answer = '知識ベースがまだ読み込まれていません。しばらくお待ちください。';
            sources = [];
        }

        // Remove loading, show answer
        removeMessage(loadingId);
        appendAnswer(answer, sources);

    } catch (err) {
        removeMessage(loadingId);
        appendMessage('ai', `<div class="ai-error">エラーが発生しました: ${err.message}</div>`);
    }

    isLoading = false;
}


// ---- Local RAG (Frontend Vector Search + Gemini API) ----
async function localRAG(query) {
    // Step 1: クエリをEmbedding化
    const queryEmbedding = await embedQuery(query);

    // Step 2: コサイン類似度で上位チャンク検索
    const topChunks = searchTopK(queryEmbedding, 5);

    // Step 3: コンテキスト構築 + Gemini API呼び出し
    const context = topChunks.map((c, i) =>
        `【引用${i + 1}】[ナレッジベース「${c.chapter_title}」より]\n${c.text}`
    ).join('\n\n');

    const systemPrompt = `あなたは「Deviens sommelier」のAIワインコンシェルジュである。
以下のプロフェッショナル・ワイン知識データベースを最優先の参照元として、質問に正確に回答せよ。

ルール:
- データベースに関連する記載がある場合は、それに基づいて回答し、回答の最後に参照した引用番号を明記すること（例: [引用1, 引用3]）
- データベースに記載がない場合でも、WSETや一般的なワインの教養・専門知識に関する質問であれば、あなたの持つプロフェッショナルな知識を用いて回答すること。ただしその際は「ナレッジベース外の一般知識に基づく」旨を添えること。
- 無関係な雑談やワイン以外の質問には「ワインに関する質問をお願いする」と返答すること
- 回答は簡潔かつ的確に（200〜400文字程度）
- 重要な用語は正確に表現し、外国語の単語（産地、ブドウ品種など）が登場する場合は可能な限り直後にカッコ書きでカタカナのふりがなを付けること（例: Pinot Noir（ピノ・ノワール））
- 「である・だ」調の断定形で回答すること

====
${context}
====`;

    const answer = await callGeminiDirect(systemPrompt, query);

    return {
        answer: answer,
        sources: topChunks.map(c => ({
            chapter_title: c.chapter_title,
            page: c.page,
            score: c.score.toFixed(3),
        })),
    };
}


// ---- Embedding (via Gemini API) ----
async function embedQuery(text) {
    // Use the same API key approach
    // In production this should go through GAS to hide the key
    const apiKey = getApiKey();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${apiKey}`;

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            content: { parts: [{ text: text }] },
        }),
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.embedding.values;
}


// ---- Gemini Direct Call ----
async function callGeminiDirect(systemPrompt, userQuery) {
    const apiKey = getApiKey();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:generateContent?key=${apiKey}`;

    // これまでの会話履歴に今回のユーザー発言を追加
    const contentsObj = [...conversationHistory];
    contentsObj.push({ role: 'user', parts: [{ text: userQuery }] });

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: contentsObj,
            generationConfig: { temperature: 0.2, maxOutputTokens: 4096 },
        }),
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    
    const answer = data.candidates[0].content.parts[0].text;
    
    // 履歴に保存（直近10ターン分＝20メッセージを残す）
    conversationHistory.push({ role: 'user', parts: [{ text: userQuery }] });
    conversationHistory.push({ role: 'model', parts: [{ text: answer }] });
    if (conversationHistory.length > 20) {
        conversationHistory = conversationHistory.slice(conversationHistory.length - 20);
    }
    
    return answer;
}


// ---- Vector Search ----
function searchTopK(queryEmbedding, k) {
    const chunks = knowledgeBase.chunks;
    const scored = [];

    for (const chunk of chunks) {
        if (!chunk.embedding || chunk.embedding.length === 0) continue;
        const score = cosineSimilarity(queryEmbedding, chunk.embedding);
        scored.push({ ...chunk, score });
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, k);
}

function cosineSimilarity(a, b) {
    if (!a || !b || a.length !== b.length) return 0;
    let dot = 0, magA = 0, magB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        magA += a[i] * a[i];
        magB += b[i] * b[i];
    }
    const denom = Math.sqrt(magA) * Math.sqrt(magB);
    return denom === 0 ? 0 : dot / denom;
}


// ---- API Key Management (Delegated to DSMAuth) ----
function getApiKey() {
    return DSMAuth.getApiKey() || '';
}


// ---- UI Helpers ----
let messageCounter = 0;

function appendMessage(role, html) {
    const body = document.getElementById('aiBody');
    const id = `msg-${++messageCounter}`;

    // Clear welcome if first message
    const welcome = body.querySelector('.ai-welcome');
    if (welcome) welcome.remove();

    const div = document.createElement('div');
    div.id = id;
    div.className = `ai-msg ai-msg-${role}`;
    div.innerHTML = html;
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
    return id;
}

function appendAnswer(text, sources) {
    const body = document.getElementById('aiBody');

    // Format answer (simple markdown-like)
    const formatted = text
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');

    // Sources (Remove confusing page numbers, show unique chapters)
    // Deduplicate chapters
    const uniqueChapters = [...new Set(sources.map(s => s.chapter_title))];
    
    const sourcesHtml = uniqueChapters.length > 0
        ? `<div class="ai-sources">
            <div class="ai-sources-title"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" style="vertical-align:middle;margin-right:3px"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>参照元: ナレッジベース</div>
            <div class="ai-sources-list">
            ${uniqueChapters.map(ch => `<span class="ai-source-tag"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" style="vertical-align:middle;margin-right:2px"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>${ch}</span>`).join('')}
            </div>
           </div>`
        : '';

    const div = document.createElement('div');
    div.className = 'ai-msg ai-msg-ai';
    div.innerHTML = `<div class="ai-answer"><p>${formatted}</p></div>${sourcesHtml}`;
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
}

function removeMessage(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}
