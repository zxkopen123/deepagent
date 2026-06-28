/* ══════════════════════════════════════════════════════════════
   DeepAgent — Renderer / UI Logic
   ══════════════════════════════════════════════════════════════ */

// ── State ──────────────────────────────────────────────────
const state = {
  chats: [],
  currentChatId: null,
  messages: [],
  config: {},
  isStreaming: false,
  streamingContent: '',
  apiKey: '',
  apiProvider: 'deepseek',
  apiEndpoint: 'https://api.deepseek.com/v1',
  language: 'zh',
  streamEnded: false,
  pendingToolCalls: [],
  toolCallActive: false,
  fileTree: null,
  fileTreePath: '',
  selectedFilePath: null,
  terminalStarted: false,
};

// ── DOM refs ────────────────────────────────────────────────
const $ = (sel) => document.querySelector(sel);

const chatListEl = $('#chat-list');
const messagesEl = $('#messages');
const containerEl = $('#messages-container');
const inputEl = $('#message-input');
const sendBtn = $('#send-btn');
const stopBtn = $('#stop-btn');
const uploadBtn = $('#upload-btn');
const micBtn = $('#mic-btn');
const newChatBtn = $('#new-chat-btn');
const termPanel = $('#term-panel');
const termPanelOutput = $('#term-panel-output');
const termPanelInput = $('#term-panel-input');
const termPanelClear = $('#term-panel-clear');
const termPanelTitle = document.querySelector('.term-panel-title');
const themeToggle = $('#theme-toggle');
const modelSelect = $('#model-select');
const settingsBtn = $('#settings-btn');
const settingsBack = $('#settings-back');
const apiKeyInput = $('#api-key-input');
const apiProvider = $('#api-provider');
const apiEndpoint = $('#api-endpoint');
const themeSelect = $('#theme-select');
const langSelect = $('#lang-select');
const modelSelectSettings = $('#model-select-settings');
const saveSettings = $('#save-settings');
const settingsStatus = $('#settings-status');
const providerLinks = document.querySelectorAll('.provider-link');
const providerHint = $('#provider-hint');
const endpointGroup = $('#endpoint-group');
const currentChatTitle = $('#current-chat-title');
const chatListItems = $('#chat-list-items');
const chatSearch = $('#chat-search');

// ── New DOM refs ──────────────────────────────────────────────
const sidebarTabs = document.querySelectorAll('.sidebar-tab');
const mainTabs = document.querySelectorAll('.main-tab');
const ftContainer = $('#ft-tree-container');
const ftRefresh = $('#ft-refresh');
const ftDriveSelect = $('#ft-drive-select');
const dropOverlay = $('#drop-overlay');
const inputWrapper = $('#input-wrapper');
const codeView = $('#view-code');
const codePath = $('#code-path');
const codeContent = $('#code-content');
const codeClose = $('#code-close');
const codeEditBtn = $('#code-edit-btn');
const codeSaveBtn = $('#code-save-btn');
const exportBtn = $('#export-btn');
const shareBtn = $('#share-btn');
const batchToggleBtn = $('#batch-toggle-btn');
const reviewBtn = $('#review-btn');
const reviewOverlay = $('#review-overlay');
const reviewPath = $('#review-path');
const reviewStartBtn = $('#review-start-btn');
const reviewResult = $('#review-result');
const reviewStatus = $('#review-status');
const reviewClose = $('#review-close');
const voiceBtn = $('#voice-btn');
const globalSearchInput = $('#global-search-input');
const globalSearchResults = $('#global-search-results');
const bookmarksList = $('#bookmarks-list');
const syncDot = $('#sync-dot');
const presetsOverlay = $('#presets-overlay');
const presetsList = $('#presets-list');
const presetsClose = $('#presets-close');
const presetNewBtn = $('#preset-new-btn');
const presetsNewArea = $('#presets-new-area');
const presetNameInput = $('#preset-name-input');
const presetContentInput = $('#preset-content-input');
const presetSaveBtn = $('#preset-save-btn');
const managePresetsLink = $('#manage-presets-link');
const currentRoleBadge = $('#current-role-badge');
const roleOverlay = $('#role-overlay');
const roleList = $('#role-list');
const roleDetail = $('#role-detail');
const roleAddBtn = $('#role-add-btn');
const roleClose = $('#role-close');

const DEFAULT_ROLES = [
  { name: '通用', emoji: '🤖', prompt: '', model: null, temperature: 0.7, tools: true, id: 'default' },
  { name: '程序员', emoji: '🧑‍💻', prompt: '你是一个资深程序员。给出简洁、高效的代码解决方案。', model: null, temperature: 0.2, tools: true, id: 'coder' },
  { name: '翻译', emoji: '🌍', prompt: '你是一个专业翻译。将用户输入准确翻译成目标语言。', model: null, temperature: 0.1, tools: false, id: 'translator' },
  { name: '老师', emoji: '👨‍🏫', prompt: '你是一个耐心的老师。用简单的方式解释复杂概念。', model: null, temperature: 0.5, tools: false, id: 'teacher' },
  { name: '直言不讳', emoji: '🗣️', prompt: '直言不讳、不吹嘘、考虑底层逻辑、做我的严苛导师，用专业角度帮我分析规划挑战我的假设，压力测试我的每一个想法。', model: null, temperature: 0.3, tools: true, id: 'blunt' },
  { name: '增强', emoji: '💪', prompt: '在回答时使用你的全部能力，包括记忆和工具。给出完整、深入的回复。', model: null, temperature: 0.7, tools: true, id: 'enhanced' },
  { name: '默认', emoji: '🔄', prompt: '', model: null, temperature: 0.7, tools: true, id: 'default2' },
];
const voiceStatusText = $('#voice-status-text');
const sysPromptInput = $('#sys-prompt');
const searchProvider = $('#search-provider');
const searchApiKey = $('#search-api-key');
const densitySelect = $('#density-select');
const depCheckBtn = $('#dep-check-btn');
const chatModelSelect = $('#chat-model-select');
const themePrimary = $('#theme-primary');
const themeBg = $('#theme-bg');
const themeText = $('#theme-text');
const themeBorder = $('#theme-border');
const themeResetBtn = $('#theme-reset-btn');
const mcpReloadBtn = $('#mcp-reload-btn');
const mcpStatusList = $('#mcp-status-list');
const syncToken = $('#sync-token');
const syncEnabled = $('#sync-enabled');
const syncUploadBtn = $('#sync-upload-btn');
const syncDownloadBtn = $('#sync-download-btn');
const syncStatus = $('#sync-status');
const workspaceSelect = $('#workspace-select');
const workspaceAddBtn = $('#workspace-add-btn');
const workspaceRemoveBtn = $('#workspace-remove-btn');
const knowledgeDropZone = $('#knowledge-drop-zone');
const knowledgeList = $('#knowledge-list');
const knowledgeSearch = $('#knowledge-search');
const knowledgeSearchResults = $('#knowledge-search-results');
const playbackBtn = $('#playback-btn');
const playbackControls = $('#playback-controls');
const playbackPlayBtn = $('#playback-play-btn');
const playbackProgress = $('#playback-progress');
const playbackPos = $('#playback-pos');
const playbackSpeed = $('#playback-speed');
const playbackExitBtn = $('#playback-exit-btn');
const ttsProvider = $('#tts-provider');
const ttsAk = $('#tts-ak');
const ttsSk = $('#tts-sk');
const ttsVolcVoice = $('#tts-volc-voice');
const ttsVolcSpeed = $('#tts-volc-speed');
const ttsElevenKey = $('#tts-eleven-key');
const ttsElevenVoice = $('#tts-eleven-voice');
const ttsElevenSpeed = $('#tts-eleven-speed');
const ttsTestBtn = $('#tts-test-btn');
const ttsVolcConfig = $('#tts-volc-config');
const ttsElevenConfig = $('#tts-eleven-config');
const depCheckResult = $('#dep-check-result');
const checkUpdateBtn = $('#check-update-btn');
const updateOverlay = $('#update-overlay');
const updateStatusText = $('#update-status-text');
const updateVersionInfo = $('#update-version-info');
const updateCurrentVer = $('#update-current-ver');
const updateNewVer = $('#update-new-ver');
const updateReleaseNotes = $('#update-release-notes');
const updateProgressContainer = $('#update-progress-container');
const updateProgressFill = $('#update-progress-fill');
const updateProgressText = $('#update-progress-text');
const updateDownloadBtn = $('#update-download');
const updateInstallBtn = $('#update-install');
const updateLaterBtn = $('#update-later');
const updateCloseBtn = $('#update-close');
const terminalContainer = $('#terminal-container');
const terminalStatus = $('#terminal-status');
const terminalRestartBtn = $('#terminal-restart-btn');

// ── Permission Dialog ──────────────────────────────────────────
const permOverlay = $('#perm-overlay');
const permToolName = $('#perm-tool-name');
const permArgs = $('#perm-args');
const permAllow = $('#perm-allow');
const permDeny = $('#perm-deny');
let pendingPermId = null;

// ── Helpers ─────────────────────────────────────────────────
function generateId() {
  return 'chat_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

function truncate(str, len = 60) {
  return str.length > len ? str.slice(0, len) + '…' : str;
}

function formatDate(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;
  return d.toLocaleDateString();
}

function getAvatar(role) {
  if (role === 'user') return '我';
  if (role === 'tool') return '🔧';
  return 'D';
}

// ── Theme ───────────────────────────────────────────────────
function applyTheme(theme) {
  const app = $('#app');
  app.classList.remove('theme-dark', 'theme-light');
  app.classList.add(`theme-${theme}`);
  themeToggle.textContent = theme === 'dark' ? '🌙' : '☀️';

  const hljsLink = $('#hljs-theme');
  if (hljsLink) {
    hljsLink.href = theme === 'dark'
      ? 'https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/styles/github-dark.min.css'
      : 'https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/styles/github.min.css';
  }
}

// ── Markdown rendering ─────────────────────────────────────
function renderMarkdown(text) {
  if (!text) return '';

  const renderer = new marked.Renderer();

  renderer.code = ({ text: codeText, lang }) => {
    const language = lang || 'plaintext';

    // Mermaid 图表渲染
    if (language === 'mermaid' && typeof mermaid !== 'undefined') {
      const mmdId = 'mmd-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
      const escapedCode = escapeHtml(codeText);
      setTimeout(() => {
        try { const el = document.getElementById(mmdId); if (el) mermaid.run({ nodes: [el] }); } catch(e) { console.warn('Mermaid:', e); }
      }, 50);
      return `<div class="code-block"><div class="code-header"><span class="code-lang">📊 Mermaid</span></div><div class="mermaid" id="${mmdId}">${escapedCode}</div></div>`;
    }

    const validLang = hljs.getLanguage(language) ? language : 'plaintext';
    let highlighted;
    try {
      highlighted = hljs.highlight(codeText, { language: validLang }).value;
    } catch (_) {
      highlighted = escapeHtml(codeText);
    }

    const lines = codeText.split('\n');
    const lineNumbers = lines.map((_, i) => `<span>${i + 1}</span>`).join('');

    const langNames = { javascript: 'JavaScript', typescript: 'TypeScript', python: 'Python', java: 'Java', go: 'Go', rust: 'Rust', c: 'C', cpp: 'C++', html: 'HTML', css: 'CSS', sql: 'SQL', bash: 'Bash', powershell: 'PowerShell', json: 'JSON', xml: 'XML', yaml: 'YAML', markdown: 'Markdown', plaintext: 'Text' };
    const displayLang = langNames[language] || language;
    const copyLabel = language === 'plaintext' ? '复制代码' : `复制 ${displayLang}`;

    return `<div class="code-block">
      <div class="code-header">
        <span class="code-lang">${escapeHtml(displayLang)}</span>
        <button class="copy-btn" onclick="copyCode(this)">📋 ${copyLabel}</button>
      </div>
      <div class="code-block-wrapper">
        <div class="line-numbers">${lineNumbers}</div>
        <pre><code class="hljs language-${escapeHtml(validLang)}">${highlighted}</code></pre>
      </div>
    </div>`;
  };

  renderer.codespan = ({ text: codeText }) => {
    return `<code>${escapeHtml(codeText)}</code>`;
  };

  marked.setOptions({
    renderer,
    breaks: true,
    gfm: true,
  });

  return marked.parse(text);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ── Copy code ──────────────────────────────────────────────
window.copyCode = function(btn) {
  const pre = btn.closest('.code-block').querySelector('pre code');
  const text = pre.textContent;
  navigator.clipboard.writeText(text).then(() => {
    btn.textContent = '✅ 已复制';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = '📋 复制';
      btn.classList.remove('copied');
    }, 2000);
  }).catch(() => {
    const range = document.createRange();
    range.selectNode(pre);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
    document.execCommand('copy');
    btn.textContent = '✅ 已复制';
    setTimeout(() => btn.textContent = '📋 复制', 2000);
  });
};

// ── Tool call rendering ────────────────────────────────────
function renderToolCallMessage(toolCall, result) {
  const div = document.createElement('div');
  div.className = 'message tool-call';
  div.dataset.toolId = toolCall.id;

  let argsText = '';
  try {
    const args = JSON.parse(toolCall.arguments || '{}');
    argsText = Object.entries(args)
      .map(([k, v]) => `<span class="tool-arg"><span class="tool-arg-key">${escapeHtml(k)}</span>: <span class="tool-arg-val">${escapeHtml(String(v).slice(0, 200))}</span></span>`)
      .join(' ');
  } catch (_) {
    argsText = escapeHtml(toolCall.arguments);
  }

  let resultHtml = '';
  if (toolCall.status === 'running') {
    resultHtml = '<div class="tool-status tool-running">⏳ 执行中...</div>';
  } else if (toolCall.status === 'error') {
    const errMsg = result?.error || '未知错误';
    resultHtml = `<div class="tool-status tool-error">❌ ${escapeHtml(errMsg)}</div>`;
  } else if (toolCall.status === 'done' && result) {
    const resultStr = JSON.stringify(result, null, 2);
    const truncated = resultStr.length > 5000 ? resultStr.slice(0, 5000) + '\n... (截断)' : resultStr;
    resultHtml = `<pre class="tool-result-content"><code>${escapeHtml(truncated)}</code></pre>`;
  }

  div.innerHTML = `
    <div class="tool-avatar">🔧</div>
    <div class="tool-call-card">
      <div class="tool-call-header">
        <span class="tool-name">${escapeHtml(toolCall.name)}</span>
        <span class="tool-args-summary">${argsText}</span>
      </div>
      <div class="tool-call-body">
        ${resultHtml}
      </div>
    </div>
  `;

  return div;
}

// ── Message rendering ──────────────────────────────────────
function renderMessage(msg) {
  // 工具调用消息
  if (msg.role === 'tool' && msg._toolCall) {
    return renderToolCallMessage(msg._toolCall, msg._result);
  }

  const div = document.createElement('div');
  div.className = `message ${msg.role}`;
  div.dataset.messageId = msg.id || '';

  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  avatar.textContent = getAvatar(msg.role);

  const content = document.createElement('div');
  content.className = 'message-content';

  // 搜索高亮
  function highlightText(raw) {
    if (!searchText && !searchRegex) return raw;
    let result = raw;
    if (searchRegex) {
      result = result.replace(searchRegex, m => `<mark class="highlight-match">${m}</mark>`);
    } else if (searchText) {
      const escaped = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      result = result.replace(new RegExp(escaped, 'gi'), m => `<mark class="highlight-match">${m}</mark>`);
    }
    return result;
  }

  if (msg.role === 'user') {
    if (msg._imageData) {
      const label = msg._fileName ? escapeHtml(msg._fileName) : '图片';
      content.innerHTML = `<div class="msg-image"><img src="${msg._imageData}" alt="${label}" title="${label}"><p>${label}</p></div>`;
    } else {
      content.innerHTML = `<p>${highlightText(escapeHtml(msg.content))}</p>`;
    }
  } else {
    content.innerHTML = highlightText(renderMarkdown(msg.content));
    // 朗读按钮
    const playBtn = document.createElement('button');
    playBtn.className = 'msg-tts-btn';
    playBtn.textContent = '🔊'; playBtn.title = '朗读';
    playBtn.dataset.msgId = msg.id || '';
    playBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleTts(msg.id || '', msg.content || ''); });
    content.appendChild(playBtn);
  }

  // 星标按钮
  const starId = `${state.currentChatId || 'chat'}_${msg.id || ''}`;
  const isBookmarked = state.config.bookmarks?.some(b => b.id === starId);
  const starBtn = document.createElement('button');
  starBtn.className = `msg-star-btn${isBookmarked ? ' bookmarked' : ''}`;
  starBtn.textContent = isBookmarked ? '★' : '☆';
  starBtn.title = isBookmarked ? '取消收藏' : '收藏';
  starBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleBookmark(starId, msg); });
  div.appendChild(starBtn);

  // 编辑/撤回按钮（仅用户消息）
  if (msg.role === 'user') {
    const editBtn = document.createElement('button');
    editBtn.className = 'msg-edit-btn'; editBtn.textContent = '✏️'; editBtn.title = '编辑';
    editBtn.addEventListener('click', (e) => { e.stopPropagation(); editMessage(msg.id || ''); });
    div.dataset.msgId = msg.id || '';
    div.appendChild(editBtn);

    const recallBtn = document.createElement('button');
    recallBtn.className = 'msg-edit-btn'; recallBtn.textContent = '↩️'; recallBtn.title = '撤回';
    recallBtn.addEventListener('click', (e) => { e.stopPropagation(); recallMessage(msg.id || ''); });
    div.appendChild(recallBtn);
  }

  div.appendChild(avatar);
  div.appendChild(content);
  return div;
}

// ── Welcome screen ─────────────────────────────────────────
function renderWelcomeScreen() {
  const welcome = document.createElement('div');
  welcome.className = 'welcome-screen';
  welcome.innerHTML = `
    <div class="welcome-logo">🐋</div>
    <h1 class="welcome-title">${t('chat.welcome_title')}</h1>
    <p class="welcome-subtitle">${t('chat.welcome_desc')}</p>
    <div class="welcome-suggestions">
      <div class="suggestion-chip" data-prompt="列出当前目录下的所有文件">${t('chat.suggestion_list')}</div>
      <div class="suggestion-chip" data-prompt="创建一个 test.txt 文件，写入一些文字，然后读取它">${t('chat.suggestion_list')}</div>
      <div class="suggestion-chip" data-prompt="用 PowerShell 查看系统信息">${t('chat.suggestion_sysinfo')}</div>
      <div class="suggestion-chip" data-prompt="搜索所有包含 'function' 的 JS 文件">${t('chat.suggestion_list')}</div>
    </div>
  `;

  welcome.querySelectorAll('.suggestion-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const prompt = chip.dataset.prompt;
      inputEl.value = prompt;
      sendMessage();
    });
  });

  return welcome;
}

// ── Error banner ───────────────────────────────────────────
// ── 错误消息优化 ──
const ERROR_MESSAGES = {
  'fetch failed': '网络连接失败，请检查网络或代理设置',
  'Failed to fetch': '网络连接失败，请检查网络或代理设置',
  '401': 'API Key 无效，请在设置中重新配置 API Key',
  'Unauthorized': 'API Key 无效，请在设置中重新配置 API Key',
  '402': 'API 余额不足，请充值',
  '429': '请求过于频繁，请稍后再试',
  'timeout': '模型响应超时，请重试或换一个模型',
  'ETIMEDOUT': '网络连接超时，请检查网络',
  'ENOTFOUND': 'DNS 解析失败，请检查网络连接',
  'ECONNREFUSED': '连接被拒绝，请检查服务是否正常运行',
  'ECONNRESET': '连接被重置，请检查网络稳定性',
  'ENOENT': '文件或路径不存在',
  'EACCES': '权限不足，无法访问该文件',
  'Command timed out': '命令执行超时，可能需要更长时间完成',
  'model not found': '模型名称无效，请在设置中重新选择模型',
  'not found': '模型名称无效，请检查设置中的默认模型',
  'invalid model': '模型名称无效，请在设置中选择正确的模型',
};

function showError(message) {
  // 转换为用户可读的消息
  let userMsg = message;
  for (const [key, value] of Object.entries(ERROR_MESSAGES)) {
    if (message && message.includes(key)) { userMsg = value; break; }
  }

  const existing = document.querySelector('.error-banner');
  if (existing) existing.remove();

  const banner = document.createElement('div');
  banner.className = 'error-banner';
  banner.innerHTML = `<span class="error-icon">⚠️</span> ${escapeHtml(userMsg)}`;
  containerEl.insertBefore(banner, containerEl.querySelector('#scroll-anchor'));
  containerEl.scrollTop = containerEl.scrollHeight;

  setTimeout(() => {
    if (banner.parentNode) banner.remove();
  }, 8000);
}

// ── Smart message rendering (avoids full re-render flash) ──
const messageElements = new Map(); // id → HTMLElement
let welcomeEl = null;

function displayMessages() {
  // Update title
  const firstUserMsg = state.messages.find(m => m.role === 'user');
  currentChatTitle.textContent = firstUserMsg
    ? truncate(firstUserMsg.content, 60)
    : t('chat.new_conversation');

  // Show / hide welcome screen
  if (!state.messages.length && !state.pendingToolCalls.length) {
    if (!welcomeEl || !welcomeEl.parentNode) {
      messagesEl.innerHTML = '';
      messageElements.clear();
      welcomeEl = renderWelcomeScreen();
      messagesEl.appendChild(welcomeEl);
    }
    scrollToBottom();
    return;
  }

  // If welcome screen is showing, remove it
  if (welcomeEl && welcomeEl.parentNode) {
    welcomeEl.remove();
    welcomeEl = null;
    // Don't clear messageElements on first transition — they're all empty anyway
  }

  // ── Sync message DOM with state ──
  const validIds = new Set();

  // Phase 1: Add/update messages
  state.messages.forEach((msg, idx) => {
    const id = msg.id || `msg_${idx}`;
    validIds.add(id);

    let el = messageElements.get(id);
    if (!el) {
      // New message — create element
      el = renderMessage(msg);
      el.dataset.msgIndex = idx;
      messageElements.set(id, el);
      // Insert before the next message or at the end
      const nextMsg = state.messages.slice(idx + 1).find(m => messageElements.has(m.id));
      if (nextMsg && messageElements.get(nextMsg.id)?.parentNode) {
        messagesEl.insertBefore(el, messageElements.get(nextMsg.id));
      } else {
        messagesEl.appendChild(el);
      }
    } else {
      // Update index for ordering
      el.dataset.msgIndex = idx;
    }
  });

  // Phase 2: Remove deleted messages
  messageElements.forEach((el, id) => {
    if (!validIds.has(id)) {
      el.remove();
      messageElements.delete(id);
    }
  });

  // Phase 3: Ensure correct ordering
  let prevEl = null;
  state.messages.forEach((msg, idx) => {
    const id = msg.id || `msg_${idx}`;
    const el = messageElements.get(id);
    if (!el || !el.parentNode) return;
    // Move element if it's before the previous sibling (out of order)
    if (prevEl && el.previousElementSibling !== prevEl) {
      messagesEl.insertBefore(el, prevEl.nextElementSibling);
    }
    prevEl = el;
  });

  // Phase 4: Add tool call cards after their parent message
  if (state.pendingToolCalls.length > 0) {
    state.pendingToolCalls.forEach(tc => {
      const tcId = `tool_${tc.id}`;
      if (!messageElements.has(tcId)) {
        const tcEl = renderToolCallMessage(tc, tc.result);
        tcEl.dataset.msgIndex = 'tool';
        messageElements.set(tcId, tcEl);
        // Insert after the last message
        messagesEl.appendChild(tcEl);
      } else {
        // Update existing tool card with latest result
        const existing = messageElements.get(tcId);
        const newEl = renderToolCallMessage(tc, tc.result);
        existing.replaceWith(newEl);
        messageElements.set(tcId, newEl);
      }
    });
  }

  // Remove completed tool call cards (toolCall results are now in state.messages)
  messageElements.forEach((el, id) => {
    if (id.startsWith('tool_') && !state.pendingToolCalls.find(tc => `tool_${tc.id}` === id)) {
      // Only remove if no corresponding pending tool call
      // (tool results are now in state.messages with role 'tool')
    }
  });

  // Phase 5: Update streaming content in-place (no re-render)
  if (state.isStreaming && state.streamingContent && !state.toolCallActive) {
    // Find the last assistant message element
    const lastAssistantId = [...state.messages].reverse().find(m => m.role === 'assistant')?.id;
    if (lastAssistantId) {
      const el = messageElements.get(lastAssistantId);
      if (el) {
        const contentDiv = el.querySelector('.message-content');
        if (contentDiv) {
          contentDiv.innerHTML = renderMarkdown(state.streamingContent) + '<span class="streaming-cursor"></span>';
        }
      }
    }
  }

  // Phase 6: Tool streaming indicator
  if (state.toolCallActive) {
    if (!document.querySelector('.tool-streaming')) {
      const indicator = document.createElement('div');
      indicator.className = 'tool-streaming';
      indicator.innerHTML = '<span class="streaming-cursor"></span>';
      messagesEl.appendChild(indicator);
    }
  } else {
    const indicator = document.querySelector('.tool-streaming');
    if (indicator) indicator.remove();
  }

  scrollToBottom();
}

// Full re-render (for theme changes, chat switches)
function fullRefreshMessages() {
  // Clear tracking
  messageElements.clear();
  if (welcomeEl) { welcomeEl = null; }

  // Build from scratch but batch via innerHTML for first paint
  messagesEl.innerHTML = '';

  if (!state.messages.length && !state.pendingToolCalls.length) {
    welcomeEl = renderWelcomeScreen();
    messagesEl.appendChild(welcomeEl);
    currentChatTitle.textContent = t('chat.new_conversation');
    scrollToBottom();
    return;
  }

  state.messages.forEach(msg => {
    const el = renderMessage(msg);
    messageElements.set(msg.id || `msg_${Date.now()}_${Math.random()}`, el);
    messagesEl.appendChild(el);
  });

  if (state.pendingToolCalls.length > 0) {
    state.pendingToolCalls.forEach(tc => {
      const tcEl = renderToolCallMessage(tc, tc.result);
      messageElements.set(`tool_${tc.id}`, tcEl);
      messagesEl.appendChild(tcEl);
    });
  }

  if (state.toolCallActive) {
    const indicator = document.createElement('div');
    indicator.className = 'tool-streaming';
    indicator.innerHTML = '<span class="streaming-cursor"></span>';
    messagesEl.appendChild(indicator);
  }

  const firstUserMsg = state.messages.find(m => m.role === 'user');
  currentChatTitle.textContent = firstUserMsg ? truncate(firstUserMsg.content, 60) : t('chat.new_conversation');
  scrollToBottom();
}

function scrollToBottom() {
  const el = containerEl || document.getElementById('messages-container');
  if (el) {
    el.scrollTop = el.scrollHeight;
  }
}

// ── Chat list management ───────────────────────────────────
// 当前激活的标签
let activeTag = '';

function setActiveTag(tag) {
  activeTag = tag;
  document.querySelectorAll('.tag-btn').forEach(b => b.classList.toggle('active', b.dataset.tag === tag));
  renderChatList(document.getElementById('chat-search')?.value || '');
}

function renderChatList(filter = '') {
  if (!chatListItems) return;

  // 批量操作工具栏
  let batchToolbar = document.getElementById('batch-toolbar');
  if (!batchToolbar) {
    batchToolbar = document.createElement('div');
    batchToolbar.id = 'batch-toolbar';
    batchToolbar.className = 'batch-toolbar';
    batchToolbar.style.display = 'none';
    document.getElementById('chat-list-items')?.before(batchToolbar);
  }

  if (batchMode) {
    batchToolbar.style.display = 'flex';
    batchToolbar.innerHTML = `
      <span style="color:var(--text-secondary);font-size:12px">已选 ${selectedChats.size} 项</span>
      <button class="batch-btn" onclick="document.querySelectorAll('.chat-item').forEach((_,i)=>{const id=state.chats[i]?.id;if(id)toggleChatSelect(id)})">全选</button>
      <button class="batch-btn" onclick="deleteSelectedChats()">🗑 删除</button>
      <button class="batch-btn" onclick="exportSelectedChats()">📥 导出</button>
      <button class="batch-btn" onclick="batchMode=false;selectedChats.clear();renderChatList()">✕ 退出</button>
    `;
    batchToolbar.querySelectorAll('.batch-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const text = btn.textContent;
        if (text.includes('全选')) {
          const allChats = getFilteredChats(filter);
          if (selectedChats.size === allChats.length) selectedChats.clear();
          else allChats.forEach(c => selectedChats.add(c.id));
          renderChatList(filter);
        } else if (text.includes('删除')) deleteSelectedChats();
        else if (text.includes('导出')) exportSelectedChats();
        else if (text.includes('退出')) { batchMode = false; selectedChats.clear(); renderChatList(); }
      });
    });
  } else {
    batchToolbar.style.display = 'none';
  }

  chatListItems.innerHTML = '';
  let chats = state.chats;

  // 标签筛选
  if (activeTag) {
    chats = chats.filter(c => (c.tags || []).includes(activeTag));
  }

  // 搜索筛选（标题 + 消息内容）
  if (filter) {
    const q = filter.toLowerCase();
    const titles = chats.filter(c => c.title.toLowerCase().includes(q));
    const contentMatches = chats.filter(c => {
      if (titles.includes(c)) return false;
      return c.messages?.some(m => typeof m.content === 'string' && m.content.toLowerCase().includes(q));
    });
    chats = [...titles, ...contentMatches];
  }

  if (!chats.length) {
    const empty = document.createElement('div');
    empty.style.cssText = 'padding: 24px 16px; text-align: center;';

    if (filter) {
      empty.innerHTML = `
        <div style="font-size:32px;margin-bottom:8px">🔍</div>
        <div style="color:var(--text-secondary);font-size:14px;font-weight:500;margin-bottom:4px">未找到匹配的对话</div>
        <div style="color:var(--text-tertiary);font-size:12px">试试不同的关键词</div>`;
    } else if (!state.chats.length) {
      empty.innerHTML = `
        <div style="font-size:40px;margin-bottom:12px">💬</div>
        <div style="color:var(--text-primary);font-size:16px;font-weight:600;margin-bottom:12px">开始你的第一个对话</div>
        <div style="display:flex;flex-direction:column;gap:8px;max-width:200px;margin:0 auto">
          <div style="background:var(--bg-tertiary);border-radius:8px;padding:10px;font-size:12px;color:var(--text-secondary)">💬 多模型支持<br><span style="color:var(--text-tertiary);font-size:11px">DeepSeek、OpenAI、通义等 8+ 模型</span></div>
          <div style="background:var(--bg-tertiary);border-radius:8px;padding:10px;font-size:12px;color:var(--text-secondary)">🔧 本地工具链<br><span style="color:var(--text-tertiary);font-size:11px">读写文件、执行命令、搜索网页、Git</span></div>
          <div style="background:var(--bg-tertiary);border-radius:8px;padding:10px;font-size:12px;color:var(--text-secondary)">🎤 语音交互<br><span style="color:var(--text-tertiary);font-size:11px">语音输入、TTS 朗读</span></div>
        </div>`;
    } else {
      empty.innerHTML = `
        <div style="font-size:32px;margin-bottom:8px">🔍</div>
        <div style="color:var(--text-secondary);font-size:14px;font-weight:500">未找到匹配的对话</div>
        <div style="color:var(--text-tertiary);font-size:12px;margin-top:4px">试试不同的关键词</div>`;
    }

    chatListItems.appendChild(empty);
    return;
  }

  // 置顶优先
  const pinned = chats.filter(c => c.pinned);
  const unpinned = chats.filter(c => !c.pinned);
  const sorted = [...pinned, ...unpinned];

  sorted.forEach(chat => {
    const isSelected = selectedChats.has(chat.id);
    const item = document.createElement('div');
    item.className = `chat-item${chat.id === state.currentChatId ? ' active' : ''}${chat.pinned ? ' pinned' : ''}${isSelected ? ' selected' : ''}`;
    item.dataset.chatId = chat.id;

    const tagBadges = (chat.tags || []).map(t => `<span class="chat-tag-badge">${t}</span>`).join('');

    item.innerHTML = `
      ${batchMode ? `<input type="checkbox" class="chat-select-cb" ${isSelected ? 'checked' : ''}>` : ''}
      <span class="chat-item-icon">${chat.pinned ? '📌' : '💬'}</span>
      <div class="chat-item-content">
        <div class="chat-item-title">${escapeHtml(chat.title)}</div>
        <div class="chat-item-date">${formatDate(chat.updatedAt)} ${tagBadges}</div>
      </div>
      <button class="chat-item-pin" title="${chat.pinned ? '取消置顶' : '置顶'}">${chat.pinned ? '★' : '☆'}</button>
      <button class="chat-item-delete" title="删除对话">✕</button>
    `;

    if (batchMode) {
      const cb = item.querySelector('.chat-select-cb');
      if (cb) cb.addEventListener('change', () => toggleChatSelect(chat.id));
    }

    item.addEventListener('click', (e) => {
      if (e.target.closest('.chat-item-delete')) return;
      switchChat(chat.id);
    });

    const deleteBtn = item.querySelector('.chat-item-delete');
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteChat(chat.id);
    });

    const pinBtn = item.querySelector('.chat-item-pin');
    if (pinBtn) {
      pinBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        chat.pinned = !chat.pinned;
        window.claudeDesktop.updateChat(chat);
        renderChatList(document.getElementById('chat-search')?.value || '');
      });
    }

    chatListItems.appendChild(item);
  });
}

// 批量操作辅助
function getFilteredChats(filter) {
  let chats = state.chats;
  if (activeTag) chats = chats.filter(c => (c.tags || []).includes(activeTag));
  if (filter) {
    const q = filter.toLowerCase();
    const titles = chats.filter(c => c.title.toLowerCase().includes(q));
    const contentMatches = chats.filter(c => !titles.includes(c) && c.messages?.some(m => typeof m.content === 'string' && m.content.toLowerCase().includes(q)));
    chats = [...titles, ...contentMatches];
  }
  return chats;
}

// Escape 退出批量模式
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && batchMode) { batchMode = false; selectedChats.clear(); renderChatList(); }
});

// 标签筛选点击
document.querySelectorAll('.tag-btn').forEach(btn => {
  btn.addEventListener('click', () => setActiveTag(btn.dataset.tag));
});

// 对话搜索（支持正则：/pattern/i 格式）
let searchRegex = null;
let searchText = '';

if (chatSearch) {
  chatSearch.addEventListener('input', () => {
    const val = chatSearch.value;
    searchText = val;
    // 检测正则模式：/pattern/flags
    if (val.startsWith('/') && val.lastIndexOf('/') > 0) {
      const lastSlash = val.lastIndexOf('/');
      const pattern = val.slice(1, lastSlash);
      const flags = val.slice(lastSlash + 1);
      try {
        searchRegex = new RegExp(pattern, flags.includes('i') ? 'gi' : 'g');
        // 正则合法：显示绿色提示
        chatSearch.style.borderColor = 'var(--accent)';
      } catch(_) {
        searchRegex = null;
        chatSearch.style.borderColor = '#ef4444'; // 非法：红色
      }
    } else {
      searchRegex = null;
      chatSearch.style.borderColor = '';
    }
    renderChatList(val);
  });
  chatSearch.addEventListener('blur', () => {
    if (!chatSearch.value) { searchRegex = null; searchText = ''; renderChatList(''); }
  });
}

// ── Chat operations ────────────────────────────────────────
async function newChat() {
  if (state.isStreaming) return;

  state.currentChatId = null;
  state.messages = [];
  state.streamingContent = '';
  state.pendingToolCalls = [];
  state.toolCallActive = false;
  fullRefreshMessages();

  chatListEl.querySelectorAll('.chat-item.active').forEach(el => el.classList.remove('active'));
  inputEl.focus();
}

async function switchChat(chatId) {
  if (state.isStreaming) return;

  state.currentChatId = chatId;
  const chat = state.chats.find(c => c.id === chatId);
  if (!chat) return;

  state.messages = chat.messages || [];
  state.pendingToolCalls = [];
  state.toolCallActive = false;
  fullRefreshMessages();
  renderChatList();
  inputEl.focus();
}

async function deleteChat(chatId) {
  if (state.isStreaming) return;

  await window.claudeDesktop.deleteChat(chatId);
  state.chats = state.chats.filter(c => c.id !== chatId);

  if (state.currentChatId === chatId) {
    state.currentChatId = null;
    state.messages = [];
    state.pendingToolCalls = [];
    fullRefreshMessages();
  }

  renderChatList();
}

function getCurrentChat() {
  return state.chats.find(c => c.id === state.currentChatId);
}

async function saveCurrentChat() {
  if (!state.messages.length) return;

  const firstUserMsg = state.messages.find(m => m.role === 'user');
  const title = firstUserMsg ? truncate(firstUserMsg.content, 60) : t('chat.new_conversation');
  const now = new Date().toISOString();

  let chat;
  if (state.currentChatId) {
    chat = getCurrentChat();
    if (chat) {
      chat.messages = state.messages;
      chat.title = title;
      chat.updatedAt = now;
    }
  }

  if (!chat) {
    chat = {
      id: generateId(),
      title,
      messages: state.messages,
      createdAt: now,
      updatedAt: now,
    };
    state.currentChatId = chat.id;
    state.chats.unshift(chat);
  }

  await window.claudeDesktop.updateChat(chat);
  renderChatList();
}

// ── Streaming API + Tool Calls ─────────────────────────────
async function streamResponse(userMessage) {
  if (state.isStreaming) return;

  const apiKey = state.apiKey;
  if (!apiKey) {
    showError(t('error.no_api_key'));
    return;
  }

  state.isStreaming = true;
  state.streamingContent = '';
  state.streamEnded = false;
  state.pendingToolCalls = [];
  state.toolCallActive = false;
  updateSendButton();

  // Add assistant placeholder
  const assistantMsg = { role: 'assistant', content: '', id: generateId() };
  state.messages.push(assistantMsg);
  displayMessages();

  // 截断过长的对话历史（保留前2条+最近10条，中间摘要）
  let messagesForApi = state.messages;
  if (state.messages.length > 30) {
    const head = state.messages.slice(0, 2);
    const tail = state.messages.slice(-10);
    const summary = { role: 'assistant', content: `[中间 ${state.messages.length - 12} 条消息已截断]` };
    messagesForApi = [...head, summary, ...tail];
  }

  // 注入 system prompt
  if (state.config.systemPrompt) {
    const hasSysPrompt = messagesForApi.some(m => m.role === 'system');
    if (!hasSysPrompt) {
      messagesForApi.unshift({ role: 'system', content: state.config.systemPrompt });
    }
  }

  // 多模态图片支持：检测最近的消息中是否有图片
  const model = modelSelect.value || 'deepseek-chat';
  const VISION_MODELS = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'claude-sonnet-4', 'claude-3-5-sonnet', 'claude-opus-4',
    'qwen-max', 'qwen-plus', 'qwen-turbo', 'glm-4v', 'gemini-2.0-flash', 'gemini-2.0-pro'];
  const supportsVision = VISION_MODELS.some(v => model.includes(v));

  // Prepare messages (排除空的助手占位和内部属性)
  const apiMessages = messagesForApi
    .filter(m => {
      if (m.role === 'assistant' && !m.content && !m.tool_calls) return false;
      return m.role === 'user' || m.role === 'assistant' || m.role === 'tool' || m.role === 'system';
    })
    .map(m => {
      const base = { role: m.role };
      // 多模态图片：有 _imageData 且模型支持 Vision
      if (m._imageData && supportsVision) {
        base.content = [
          { type: 'text', text: m._fileName ? `[图片: ${m._fileName}]` : '' },
          { type: 'image_url', image_url: { url: m._imageData } },
        ];
      } else {
        if (m.content) base.content = m.content;
      }
      if (m.tool_calls) base.tool_calls = m.tool_calls;
      if (m.tool_call_id) base.tool_call_id = m.tool_call_id;
      return base;
    });

  // ── Stream data (text chunks) ──
  window.claudeDesktop.onStreamData((text) => {
    state.streamingContent += text;
    const lastMsg = state.messages[state.messages.length - 1];
    if (lastMsg && lastMsg.role === 'assistant') {
      lastMsg.content = state.streamingContent;
    }
    displayMessages();
  });

  // ── Stream end (final text response) ──
  window.claudeDesktop.onStreamEnd(async (endData) => {
    if (state.streamEnded) return;
    state.streamEnded = true;
    state.isStreaming = false;
    state.toolCallActive = false;

    // Ensure the last assistant message has the final content
    const lastMsg = state.messages[state.messages.length - 1];
    if (lastMsg && lastMsg.role === 'assistant') {
      lastMsg.content = state.streamingContent || lastMsg.content;
    }
    state.streamingContent = '';

    // 检测是否被截断：finish_reason === 'length' 或内容不完整
    const fr = endData?.finishReason;
    const isTruncated = fr === 'length' || fr === 'max_rounds';
    if (isTruncated && lastMsg && lastMsg.role === 'assistant') {
      const content = lastMsg.content || '';
      // 检查不完整的 markdown 语法
      const unclosed = (content.match(/```/g) || []).length % 2 !== 0
        || (content.match(/\*\*/g) || []).length % 2 !== 0;
      if (unclosed || content.length > 0) {
        lastMsg.content += `\n\n<p style="color:var(--text-tertiary);font-style:italic;font-size:12px;margin-top:8px">*${t('chat.truncated_hint')}*</p>`;
        lastMsg.truncated = true;
        lastMsg.finishReason = fr;
      }
    }

    displayMessages();
    updateSendButton();

    await saveCurrentChat();

    // 语音模式：流结束，等待 TTS 播放后重置状态
    if (voiceState === 'speaking') {
      setTimeout(() => { if (voiceState === 'speaking') setVoiceState('idle', '点击并按住说话'); }, 3000);
    }

    // 自动命名：首轮对话后异步生成标题
    if (state.messages.filter(m => m.role === 'user').length === 1 && state.currentChatId) {
      autoRenameChat(state.currentChatId, state.messages[0]?.content || '');
    }
  });

  // ── Error ──
  window.claudeDesktop.onStreamError((error) => {
    if (state.streamEnded) return;
    state.streamEnded = true;
    state.isStreaming = false;
    state.toolCallActive = false;
    state.streamingContent = '';

    state.messages.pop(); // remove empty assistant message
    state.pendingToolCalls = [];
    displayMessages();
    showError(error || t('error.stream_error'));
    updateSendButton();
  });

  // ── Tool Start ──
  window.claudeDesktop.onToolStart((toolCalls) => {
    state.toolCallActive = true;

    // Save tool calls to the assistant message
    const lastMsg = state.messages[state.messages.length - 1];
    if (lastMsg && lastMsg.role === 'assistant') {
      lastMsg.content = state.streamingContent || null;
      lastMsg.tool_calls = toolCalls.map(tc => ({
        id: tc.id,
        type: 'function',
        function: { name: tc.name, arguments: tc.arguments },
      }));
    }

    // Add pending tool calls for UI display
    toolCalls.forEach(tc => {
      state.pendingToolCalls.push({
        id: tc.id,
        name: tc.name,
        arguments: tc.arguments,
        status: 'running',
      });
    });

    displayMessages();
  });

  // ── Tool Result ──
  window.claudeDesktop.onToolResult((data) => {
    // Update the matching pending tool call with result
    const tc = state.pendingToolCalls.find(p => p.id === data.id);
    if (tc) {
      tc.status = 'done';
      tc.result = data.result;
    }

    // Add a tool result message to the messages array (for persistence)
    state.messages.push({
      role: 'tool',
      id: generateId(),
      tool_call_id: data.id,
      content: JSON.stringify(data.result),
      _toolCall: { id: data.id, name: data.name, arguments: data.arguments, status: 'done' },
      _result: data.result,
    });

    displayMessages();
  });

  // ── Tool End (all tools in this round done) ──
  window.claudeDesktop.onToolEnd(() => {
    state.toolCallActive = false;
    state.pendingToolCalls = [];
    state.streamingContent = '';

    // Add a new assistant placeholder for the next round of text response
    const nextAssistantMsg = { role: 'assistant', content: '', id: generateId() };
    state.messages.push(nextAssistantMsg);

    displayMessages();
  });

  // ── 命令流式输出到终端面板 ──
  window.claudeDesktop.onCommandOutput((text) => {
    termPanel.classList.remove('hidden');
    termPanelOutput.insertAdjacentHTML('beforeend', parseANSI(text) || text.replace(/</g, '&lt;').replace(/>/g, '&gt;'));
    termPanelOutput.scrollTop = termPanelOutput.scrollHeight;
  });

  window.claudeDesktop.onCommandEnd(() => {
    termPanelOutput.insertAdjacentHTML('beforeend', '\n');
    termPanelOutput.scrollTop = termPanelOutput.scrollHeight;
  });

  // ── Token 用量统计 ──
  window.claudeDesktop.onTokenUsage((usageData) => {
    try {
      const u = typeof usageData === 'string' ? JSON.parse(usageData) : usageData;
      if (u && (u.total_tokens || (u.input_tokens && u.output_tokens))) {
        const total = u.total_tokens || (u.input_tokens + u.output_tokens);
        const input = u.input_tokens || u.prompt_tokens || 0;
        const output = u.output_tokens || u.completion_tokens || 0;
        termPanelOutput.insertAdjacentHTML('beforeend',
          `<div style="color:var(--text-tertiary);font-size:11px;border-top:1px solid var(--border-color);padding:4px 0;margin-top:4px">📊 本次: 输入 ${input} → 输出 ${output} = 共 ${total} tokens</div>\n`);
        termPanelOutput.scrollTop = termPanelOutput.scrollHeight;
      }
    } catch(_) {}
  });

  // Start the stream
  try {
    await window.claudeDesktop.streamMessage({
      messages: apiMessages,
      apiKey,
      model,
      apiEndpoint: state.apiEndpoint,
      apiProvider: state.apiProvider,
      searchProvider: state.config.searchProvider || 'html',
      searchApiKey: state.config.searchApiKey || '',
    });
  } catch (err) {
    if (!state.streamEnded) {
      state.streamEnded = true;
      state.isStreaming = false;
      state.toolCallActive = false;
      state.streamingContent = '';
      state.pendingToolCalls = [];
      state.messages.pop();
      displayMessages();
      showError(err.message || t('error.send_failed'));
      updateSendButton();
    }
  }
}

// ── Sending messages ───────────────────────────────────────
async function sendMessage() {
  try {
    const text = inputEl.value.trim();
    if (!text || state.isStreaming) return;

    const userMsg = { role: 'user', content: text, id: generateId() };
    state.messages.push(userMsg);

    inputEl.value = '';
    inputEl.style.height = 'auto';
    displayMessages();

    await saveCurrentChat();

    if (!state.apiKey) {
      showError(t('error.no_api_key_send'));
      return;
    }

    await streamResponse(text);
  } catch (err) {
    state.isStreaming = false;
    state.streamEnded = true;
    updateSendButton();
    showError('发送失败: ' + (err.message || err));
  }
}

function updateSendButton() {
  const hasText = inputEl.value.trim().length > 0;
  if (state.isStreaming) {
    sendBtn.classList.add('hidden');
    stopBtn.classList.remove('hidden');
    inputEl.disabled = true;
  } else {
    sendBtn.classList.remove('hidden');
    stopBtn.classList.add('hidden');
    inputEl.disabled = false;
    sendBtn.classList.toggle('active', hasText);
  }
}

// ── 停止生成 ──
stopBtn.addEventListener('click', () => {
  window.claudeDesktop.stopGeneration();
});

// ── 文件上传 ──
const fileInput = document.getElementById('file-input');

uploadBtn.addEventListener('click', () => {
  fileInput.click();
});

// ── 麦克风录音 ──
let mediaRecorder = null;
let audioChunks = [];

micBtn.addEventListener('click', async () => {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    // 停止录音
    mediaRecorder.stop();
    micBtn.classList.remove('recording');
    micBtn.textContent = '🎤';
    showError(t('chat.recording'));
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    audioChunks = [];

    mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);

    mediaRecorder.onstop = async () => {
      stream.getTracks().forEach(t => t.stop());
      const blob = new Blob(audioChunks, { type: 'audio/webm' });
      const buffer = await blob.arrayBuffer();
      micBtn.textContent = '⏳';
      const result = await window.claudeDesktop.transcribeAudioBlob(Array.from(new Uint8Array(buffer)));
      micBtn.textContent = '🎤';
      if (result.error) {
        showError(result.error.includes('whisper') ? t('chat.whisper_error') : result.error);
      } else if (result.text) {
        inputEl.value = inputEl.value + result.text + ' ';
        inputEl.dispatchEvent(new Event('input'));
        inputEl.focus();
      }
    };

    mediaRecorder.start();
    micBtn.classList.add('recording');
    micBtn.textContent = '🔴';
    showError(t('chat.recording'));
  } catch (err) {
    showError(t('chat.mic_error'));
  }
});

fileInput.addEventListener('change', async () => {
  const files = Array.from(fileInput.files);
  if (files.length === 0) return;

  const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
  const model = (modelSelect?.value || 'deepseek-chat').toLowerCase();
  const VISION_MODELS = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'claude-sonnet-4', 'claude-3-5-sonnet', 'claude-opus-4',
    'qwen-max', 'qwen-plus', 'qwen-turbo', 'glm-4v', 'glm-4', 'gemini-2.0-flash', 'gemini-2.0-pro'];
  const supportsVision = VISION_MODELS.some(v => model.includes(v));

  for (const file of files) {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    const isImage = IMAGE_EXTS.includes(ext);

    if (isImage && supportsVision) {
      // 图片 + 支持 Vision → 读取为 base64
      const base64 = await new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
      const imgMsg = { role: 'user', content: '', id: generateId(), _imageData: base64, _fileName: file.name };
      state.messages.push(imgMsg);
      displayMessages();
    } else if (isImage) {
      // 图片 + 不支持 Vision → 用 analyze_image 工具
      inputEl.value = inputEl.value + `[图片: ${file.name}] 当前模型不支持直接看图，发送后 AI 会调用分析工具\n`;
    } else {
      // 文本文件
      try {
        const text = await file.text();
        inputEl.value = inputEl.value + `[文件: ${file.name}]\n\`\`\`${ext}\n${text.slice(0, 5000)}${text.length > 5000 ? '\n... (文件过长已截断)' : ''}\n\`\`\`\n`;
      } catch (_) {
        inputEl.value = inputEl.value + `[文件: ${file.name}] (无法读取为文本)\n`;
      }
    }
  }
  fileInput.value = '';
  inputEl.dispatchEvent(new Event('input'));
  inputEl.focus();
});

function adjustTextareaHeight() {
  inputEl.style.height = 'auto';
  inputEl.style.height = Math.min(inputEl.scrollHeight, 200) + 'px';
}

// ══════════════════════════════════════════════════════════════
//  SIDEBAR TABS (Chats / Files)
// ══════════════════════════════════════════════════════════════

function switchSidebarTab(tabId) {
  sidebarTabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tabId));
  const panelMap = { chats: 'chat-list', search: 'search-panel', bookmarks: 'bookmarks-panel', files: 'file-tree' };
  const panelId = panelMap[tabId] || 'chat-list';
  document.querySelectorAll('.sidebar-panel').forEach(p => {
    p.classList.toggle('active', p.id === panelId);
  });
  // 加载收藏列表
  if (tabId === 'bookmarks') renderBookmarks();
}

// ══════════════════════════════════════════════════════════════
//  MAIN TABS (Chat / Terminal / Code / Settings)
// ══════════════════════════════════════════════════════════════

function switchMainView(viewId) {
  // 设置页面时隐藏顶部标签栏
  const headerTabs = document.querySelector('.header-right .main-tabs');
  if (headerTabs) {
    headerTabs.style.display = (viewId === 'settings') ? 'none' : 'flex';
  }

  mainTabs.forEach(t => t.classList.toggle('active', t.dataset.view === viewId));
  document.querySelectorAll('.main-view').forEach(v => {
    v.classList.toggle('active', v.id === `view-${viewId}`);
  });

  if (viewId === 'chat') inputEl.focus();

  if (viewId === 'terminal') {
    setTimeout(() => {
      const outputEl = document.querySelector('.term-output');
      if (outputEl) outputEl.scrollTop = outputEl.scrollHeight;
    }, 50);
  }
}

// ══════════════════════════════════════════════════════════════
//  FILE TREE
// ══════════════════════════════════════════════════════════════

async function loadFileTree(dirPath) {
  ftContainer.innerHTML = '<div class="ft-loading">加载中...</div>';
  state.fileTreePath = dirPath;

  const tree = await window.claudeDesktop.getDirectoryTree(dirPath, 2);
  state.fileTree = tree;

  if (tree.error) {
    ftContainer.innerHTML = `<div class="ft-loading">❌ ${tree.error}</div>`;
    return;
  }

  renderFileTree(tree);
}

function renderFileTree(node, container) {
  if (!container) {
    ftContainer.innerHTML = '';
    container = ftContainer;
  }

  if (node.type === 'more') {
    const div = document.createElement('div');
    div.className = 'ft-more';
    div.textContent = node.name;
    container.appendChild(div);
    return;
  }

  const nodeDiv = document.createElement('div');
  nodeDiv.className = 'ft-node';
  nodeDiv.dataset.path = node.path;

  const row = document.createElement('div');
  row.className = 'ft-node-row' + (node.path === state.selectedFilePath ? ' selected' : '');

  const isDir = node.type === 'directory';

  // Toggle arrow
  const toggle = document.createElement('span');
  toggle.className = 'ft-toggle' + (isDir ? '' : ' empty');
  toggle.textContent = isDir ? '▶' : '';
  row.appendChild(toggle);

  // Icon
  const icon = document.createElement('span');
  icon.className = 'ft-icon';
  if (isDir) icon.textContent = '📁';
  else icon.textContent = getFileIcon(node.ext || '');
  row.appendChild(icon);

  // Name
  const name = document.createElement('span');
  name.className = 'ft-name';
  name.textContent = node.name;
  row.appendChild(name);

  nodeDiv.appendChild(row);

  // Children container
  const childrenContainer = document.createElement('div');
  childrenContainer.className = 'ft-children';
  childrenContainer.style.display = 'none';
  nodeDiv.appendChild(childrenContainer);

  // Click handlers
  row.addEventListener('click', async (e) => {
    e.stopPropagation();

    if (isDir) {
      // Toggle expand
      const isOpen = childrenContainer.style.display === 'block';
      childrenContainer.style.display = isOpen ? 'none' : 'block';
      toggle.textContent = isOpen ? '▶' : '▼';

      // Lazy load children if empty and this is a directory
      if (!isOpen && childrenContainer.children.length === 0 && node.children) {
        if (node.children.length > 0 && typeof node.children[0] === 'object') {
          // Already have children from the tree
          node.children.forEach(child => renderFileTree(child, childrenContainer));
        } else {
          // Need to fetch deeper
          childrenContainer.innerHTML = '<div class="ft-loading">加载中...</div>';
          const deeper = await window.claudeDesktop.getDirectoryTree(node.path, 2);
          if (deeper.children) {
            childrenContainer.innerHTML = '';
            deeper.children.forEach(child => renderFileTree(child, childrenContainer));
          }
        }
      }
    } else {
      // Open file in code viewer
      openFileInViewer(node.path);
    }
  });

  container.appendChild(nodeDiv);

  // Auto-expand first level — 让用户能看到文件
  if (node.children && container === ftContainer) {
    childrenContainer.style.display = 'block';
    toggle.textContent = '▼';
    node.children.forEach(child => {
      if (child.type !== 'directory') {
        renderFileTree(child, childrenContainer);
      } else {
        // Directories stay collapsed by default
        const subDir = document.createElement('div');
        subDir.className = 'ft-node';
        subDir.dataset.path = child.path;

        const subRow = document.createElement('div');
        subRow.className = 'ft-node-row';
        subRow.innerHTML = `<span class="ft-toggle">▶</span><span class="ft-icon">📁</span><span class="ft-name">${escapeHtml(child.name)}</span>`;
        subDir.appendChild(subRow);

        const subChildren = document.createElement('div');
        subChildren.className = 'ft-children';
        subChildren.style.display = 'none';
        subDir.appendChild(subChildren);

        subRow.addEventListener('click', async (e) => {
          e.stopPropagation();
          const isOpen = subChildren.style.display === 'block';
          subChildren.style.display = isOpen ? 'none' : 'block';
          subRow.querySelector('.ft-toggle').textContent = isOpen ? '▶' : '▼';
          if (!isOpen && subChildren.children.length === 0) {
            subChildren.innerHTML = '<div class="ft-loading">加载中...</div>';
            const deeper = await window.claudeDesktop.getDirectoryTree(child.path, 2);
            if (deeper.children) {
              subChildren.innerHTML = '';
              deeper.children.forEach(c => renderFileTree(c, subChildren));
            }
          }
        });

        container.appendChild(subDir);
      }
    });
  }
}

function getFileIcon(ext) {
  const icons = {
    '.js': '🟨', '.ts': '🔵', '.jsx': '⚛️', '.tsx': '⚛️',
    '.py': '🐍', '.java': '☕', '.go': '🔷', '.rs': '🦀',
    '.html': '🌐', '.css': '🎨', '.scss': '🎨', '.less': '🎨',
    '.json': '📋', '.xml': '📋', '.yaml': '📋', '.yml': '📋',
    '.md': '📝', '.txt': '📄', '.csv': '📊',
    '.png': '🖼️', '.jpg': '🖼️', '.jpeg': '🖼️', '.svg': '🖼️',
    '.exe': '⚙️', '.dll': '⚙️', '.ps1': '🪟',
    '.gitignore': '🙈',
  };
  return icons[ext] || '📄';
}

// ══════════════════════════════════════════════════════════════
//  CODE VIEWER
// ══════════════════════════════════════════════════════════════

async function openFileInViewer(filePath) {
  state.selectedFilePath = filePath;

  // Highlight selected file in file tree
  document.querySelectorAll('.ft-node-row.selected').forEach(el => el.classList.remove('selected'));
  document.querySelector(`.ft-node-row[data-path="${filePath}"]`)?.classList.add('selected');

  // Show code view
  switchMainView('code');
  codePath.textContent = filePath;
  codeContent.innerHTML = '<code class="hljs">加载中...</code>';

  const result = await window.claudeDesktop.readFileContent(filePath);
  if (result.error) {
    codeContent.innerHTML = `<code>❌ ${escapeHtml(result.error)}</code>`;
    return;
  }

  // Detect language
  const ext = getExt(filePath);
  const langMap = {
    '.js': 'javascript', '.ts': 'typescript', '.jsx': 'javascript', '.tsx': 'typescriptreact',
    '.py': 'python', '.java': 'java', '.go': 'go', '.rs': 'rust',
    '.html': 'html', '.css': 'css', '.scss': 'scss',
    '.json': 'json', '.xml': 'xml', '.yaml': 'yaml', '.yml': 'yaml',
    '.md': 'markdown', '.txt': 'plaintext',
    '.ps1': 'powershell', '.bat': 'batch', '.sh': 'bash',
    '.sql': 'sql', '.c': 'c', '.cpp': 'cpp', '.h': 'c',
    '.rb': 'ruby', '.php': 'php', '.swift': 'swift',
  };
  const lang = langMap[ext] || 'plaintext';

  try {
    const highlighted = hljs.highlight(result.content, { language: lang }).value;
    codeContent.innerHTML = `<code class="hljs language-${lang}">${highlighted}</code>`;
  } catch (_) {
    codeContent.innerHTML = `<code class="hljs">${escapeHtml(result.content)}</code>`;
  }
}

// ══════════════════════════════════════════════════════════════
//  TERMINAL (自包含，无需 xterm.js)
// ══════════════════════════════════════════════════════════════

let termInputBuffer = '';

// ══════════════════════════════════════════════════════════════
//  ANSI → HTML 彩色解析器
// ══════════════════════════════════════════════════════════════

const ANSI_COLORS = {
  '0': '', '1': 'font-weight:bold', '3': 'font-style:italic', '4': 'text-decoration:underline',
  '30': 'color:#000', '31': 'color:#c41a16', '32': 'color:#1b8a1b', '33': 'color:#b5a01b',
  '34': 'color:#1a6fc4', '35': 'color:#8814aa', '36': 'color:#1a8a8a', '37': 'color:#d4d4d4',
  '90': 'color:#666', '91': 'color:#e8484a', '92': 'color:#5fb85f', '93': 'color:#e6c84a',
  '94': 'color:#4a8fe0', '95': 'color:#a84ac0', '96': 'color:#4ac0c0', '97': 'color:#fff',
  '40': 'background:#000', '41': 'background:#c41a16', '42': 'background:#1b8a1b',
  '43': 'background:#b5a01b', '44': 'background:#1a6fc4', '45': 'background:#8814aa',
  '46': 'background:#1a8a8a', '47': 'background:#d4d4d4',
};

function parseANSI(text) {
  let result = '';
  let i = 0;
  while (i < text.length) {
    if (text[i] === '\x1b' && text[i+1] === '[') {
      let j = i + 2;
      while (j < text.length && text[j] !== 'm' && text[j] !== 'J' && text[j] !== 'K') j++;
      const code = text.slice(i+2, j);
      const cmd = text[j] || '';
      if (cmd === 'm') {
        const styles = code.split(';').map(c => ANSI_COLORS[c.trim()] || '').filter(Boolean);
        if (code === '0' || code === '') {
          result += '</span><span class="ansi-reset">';
        } else if (styles.length > 0) {
          result += `</span><span style="${styles.join(';')}">`;
        }
      } else if (cmd === 'J' || cmd === 'K') {
        // Clear screen / line — handled by clearing the output div
        if (cmd === 'J' && code === '2') {
          result = ''; // clear entire screen
        }
      }
      i = j + 1;
    } else if (text[i] === '\r') {
      result += '\r';
      i++;
    } else if (text[i] === '\n') {
      result += '\n';
      i++;
    } else if (text[i] === '\t') {
      result += '  ';
      i++;
    } else {
      result += text[i].replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      i++;
    }
  }
  return result;
}

// ══════════════════════════════════════════════════════════════
//  终端功能：命令历史、Tab 补全、Ctrl+C、ANSI 彩色
// ══════════════════════════════════════════════════════════════

let termHistory = [];
let termHistoryIndex = -1;
let termCurrentInput = '';
let termBuffer = '';       // 未决输出缓存
let termRenderTimer = null;

function initTerminal() {
  if (state.terminalStarted) return;
  state.terminalStarted = true;

  termHistory = [];
  termHistoryIndex = -1;

  terminalContainer.innerHTML = '';
  terminalContainer.style.background = '#1a1a1a';
  terminalContainer.style.padding = '4px';

  let xterm, fitAddon;

  // 尝试使用 xterm.js
  if (window.xterm && window.xterm.Terminal) {
    try {
      xterm = new window.xterm.Terminal({
        cursorBlink: true,
        cursorStyle: 'bar',
        fontSize: 13,
        fontFamily: "'Consolas', 'Courier New', monospace",
        theme: { background: '#1a1a1a', foreground: '#d4d4d4', cursor: '#4f8cff' },
        cols: 80, rows: 20,
      });
      fitAddon = new window.xterm.FitAddon();
      xterm.loadAddon(fitAddon);
      xterm.open(terminalContainer);
      setTimeout(() => { try { fitAddon.fit(); } catch(_) {} }, 100);

      // 窗口缩放时自适应
      const resizeFn = () => { try { fitAddon.fit(); } catch(_) {} };
      window.addEventListener('resize', resizeFn);

      // xterm 输入 → 后端
      xterm.onData((data) => {
        window.claudeDesktop.terminalWrite(data);
      });

      // 启动后端
      window.claudeDesktop.terminalStart({ cols: 80, rows: 20 }).then(() => {
        terminalStatus.textContent = t('terminal.connected');
        xterm.focus();
      }).catch((err) => {
        terminalStatus.textContent = `❌ ${t('terminal.error')}`;
        xterm.write(`\r\n[${t('terminal.error')}] ${err || ''}\r\n`);
      });

      // 后端输出 → xterm
      window.claudeDesktop.onTerminalData((data) => {
        if (xterm) xterm.write(data);
      });

      window.claudeDesktop.onTerminalExit(() => {
        terminalStatus.textContent = t('terminal.disconnected');
        if (xterm) xterm.write(`\r\n[${t('terminal.exited')}]\r\n`);
        state.terminalStarted = false;
      });

      state._xtermResize = resizeFn;
      return;
    } catch(e) {
      // xterm 初始化失败，降级到简易终端
      if (xterm) { try { xterm.dispose(); } catch(_) {} }
    }
  }

  // 降级：简易终端（xterm 不可用时）
  terminalContainer.innerHTML = `
    <div style="padding:4px 8px;color:#888;font-size:11px;background:#111">⚠️ xterm.js 未加载，使用简易终端模式</div>
    <div class="term-output" id="term-output"></div>
    <div class="term-input-line">
      <span class="term-prompt">PS&nbsp;</span>
      <input type="text" class="term-input" id="term-input" autofocus spellcheck="false" autocomplete="off" />
    </div>
  `;

  const outputEl = document.getElementById('term-output');
  const inputEl_term = document.getElementById('term-input');

  window.claudeDesktop.terminalStart({}).then(() => {
    terminalStatus.textContent = t('terminal.connected');
    appendTerminalRaw('');
    inputEl_term.focus();
  }).catch((err) => {
    terminalStatus.textContent = `❌ ${t('terminal.error')}`;
    appendTerminalRaw(`[${t('terminal.error')}] ${err || ''}\n`);
  });

  window.claudeDesktop.onTerminalData((data) => {
    appendTerminalRaw(data);
  });

  window.claudeDesktop.onTerminalExit(() => {
    terminalStatus.textContent = t('terminal.disconnected');
    appendTerminalRaw(`\n[${t('terminal.exited')}]\n`);
    state.terminalStarted = false;
    inputEl_term.disabled = true;
  });

  // ── 键盘事件 ──
  inputEl_term.addEventListener('keydown', (e) => {
    if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) {
      // Ctrl+C: 中断
      window.claudeDesktop.terminalWrite('\x03');
      appendTerminalRaw('^C\n');
      inputEl_term.value = '';
      termHistoryIndex = -1;
      e.preventDefault();
      return;
    }

    if (e.ctrlKey && e.key === 'v') {
      // Ctrl+V: 粘贴
      e.preventDefault();
      navigator.clipboard.readText().then(text => {
        const pos = inputEl_term.selectionStart;
        const val = inputEl_term.value;
        inputEl_term.value = val.slice(0, pos) + text + val.slice(pos);
        inputEl_term.selectionStart = inputEl_term.selectionEnd = pos + text.length;
      }).catch(() => {});
      return;
    }

    if (e.key === 'Tab') {
      // Tab 补全：列出当前目录文件
      e.preventDefault();
      const val = inputEl_term.value;
      const lastWord = val.split(/[\s/\\]+/).pop() || '';
      if (lastWord.length > 0) {
        // 简单实现：发送 dir 命令并捕获输出
        // 更好的做法：用 IPC 查询文件系统
        window.claudeDesktop.terminalWrite('\n');
        // 用 PowerShell 获取补全建议
        const prefix = val.slice(0, val.lastIndexOf(lastWord));
        const listCmd = `Get-ChildItem -Name -Force "${lastWord}*" 2>$null | Select-Object -First 20\r\n`;
        window.claudeDesktop.terminalWrite(listCmd);
        setTimeout(() => {
          inputEl_term.value = val;
          inputEl_term.focus();
        }, 100);
      }
      return;
    }

    if (e.key === 'ArrowUp') {
      // 上：历史命令
      e.preventDefault();
      if (termHistory.length === 0) return;
      if (termHistoryIndex === -1) {
        termCurrentInput = inputEl_term.value;
        termHistoryIndex = termHistory.length - 1;
      } else if (termHistoryIndex > 0) {
        termHistoryIndex--;
      }
      inputEl_term.value = termHistory[termHistoryIndex];
      return;
    }

    if (e.key === 'ArrowDown') {
      // 下：历史命令
      e.preventDefault();
      if (termHistoryIndex === -1) return;
      termHistoryIndex++;
      if (termHistoryIndex >= termHistory.length) {
        termHistoryIndex = -1;
        inputEl_term.value = termCurrentInput;
      } else {
        inputEl_term.value = termHistory[termHistoryIndex];
      }
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = inputEl_term.value;
      if (cmd.trim()) {
        termHistory.push(cmd);
        if (termHistory.length > 500) termHistory.shift();
      }
      termHistoryIndex = -1;

      // 显示命令
      appendTerminalRaw(`PS> ${cmd}\n`);
      window.claudeDesktop.terminalWrite(cmd + '\n');
      inputEl_term.value = '';
      terminalStatus.textContent = t('terminal.running');
    }
  });
}

// 追加终端输出（带 ANSI 解析和节流渲染）
function appendTerminalRaw(text) {
  termBuffer += text;
  if (termRenderTimer) clearTimeout(termRenderTimer);
  termRenderTimer = setTimeout(() => flushTerminalBuffer(), 16); // ~60fps
}

function flushTerminalBuffer() {
  const outputEl = document.getElementById('term-output');
  if (!outputEl || !termBuffer) return;
  const parsed = parseANSI(termBuffer);
  termBuffer = '';

  // 处理清屏
  if (parsed === '') {
    outputEl.innerHTML = '';
    terminalStatus.textContent = t('terminal.ready');
    return;
  }

  // 处理 \r (回车不换行)
  let html = parsed;
  const lines = html.split('\n');
  if (lines.length > 1) {
    // 多行：每行独立包裹
    html = lines.map((line, i) => {
      // 处理行内 \r (回到行首覆盖)
      const parts = line.split('\r');
      const lastPart = parts[parts.length - 1];
      return `<div class="term-line">${lastPart || ' '}</div>`;
    }).join('');
  } else {
    html = `<div class="term-line">${html}</div>`;
  }

  outputEl.insertAdjacentHTML('beforeend', html);
  outputEl.scrollTop = outputEl.scrollHeight;
  terminalStatus.textContent = t('terminal.ready');
}

function restartTerminal() {
  window.claudeDesktop.terminalStop();
  state.terminalStarted = false;
  termBuffer = '';
  if (termRenderTimer) clearTimeout(termRenderTimer);
  terminalContainer.innerHTML = `<div class="term-starting">${t('terminal.starting')}</div>`;
  terminalStatus.textContent = t('terminal.restarting');
  setTimeout(() => initTerminal(), 500);
}

// ══════════════════════════════════════════════════════════════
//  ── Settings ────────────────────────────────────────────────
// ── API 厂商切换 ──────────────────────────────────────────
const API_PROVIDERS = {
  deepseek: { endpoint: 'https://api.deepseek.com/v1', keyUrl: 'https://platform.deepseek.com', label: 'DeepSeek' },
  openai: { endpoint: 'https://api.openai.com/v1', keyUrl: 'https://platform.openai.com/api-keys', label: 'OpenAI' },
  qwen: { endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1', keyUrl: 'https://bailian.console.aliyun.com/?apiKey=1', label: '通义千问' },
  zhipu: { endpoint: 'https://open.bigmodel.cn/api/paas/v4', keyUrl: 'https://open.bigmodel.cn/usercenter/apikeys', label: '智谱清言' },
  moonshot: { endpoint: 'https://api.moonshot.cn/v1', keyUrl: 'https://platform.moonshot.cn/console/api-keys', label: '月之暗面' },
  grok: { endpoint: 'https://api.x.ai/v1', keyUrl: 'https://x.ai/api', label: 'xAI Grok' },
  groq: { endpoint: 'https://api.groq.com/openai/v1', keyUrl: 'https://console.groq.com/keys', label: 'Groq' },
  anthropic: { endpoint: 'https://api.anthropic.com/v1', keyUrl: 'https://console.anthropic.com/', label: 'Anthropic Claude' },
  custom: { endpoint: '', keyUrl: '', label: '自定义' },
};

function updateProviderUI() {
  const provider = apiProvider.value;
  state.apiProvider = provider;

  // Show/hide endpoint field
  endpointGroup.style.display = provider === 'custom' ? 'block' : 'none';

  // Show correct provider link
  providerLinks.forEach(link => {
    link.style.display = link.dataset.provider === provider ? 'inline-flex' : 'none';
  });

  // Update endpoint
  if (provider !== 'custom') {
    apiEndpoint.value = API_PROVIDERS[provider].endpoint;
    state.apiEndpoint = API_PROVIDERS[provider].endpoint;
  }

  // Update model dropdown options based on provider
  const modelSelect = modelSelectSettings;
  modelSelect.innerHTML = '';
  const models = {
    deepseek: [
      ['deepseek-chat', 'DeepSeek V3'],
      ['deepseek-v4-flash', 'DeepSeek V4 Flash'],
      ['deepseek-v4-pro', 'DeepSeek V4 Pro'],
      ['deepseek-reasoner', 'DeepSeek R1'],
    ],
    openai: [
      ['gpt-4o', 'GPT-4o'],
      ['gpt-4o-mini', 'GPT-4o Mini'],
      ['gpt-4-turbo', 'GPT-4 Turbo'],
      ['gpt-3.5-turbo', 'GPT-3.5 Turbo'],
    ],
    qwen: [
      ['qwen-max', '通义千问 Max'],
      ['qwen-plus', '通义千问 Plus'],
      ['qwen-turbo', '通义千问 Turbo'],
    ],
    zhipu: [
      ['glm-4-plus', 'GLM-4 Plus'],
      ['glm-4', 'GLM-4'],
      ['glm-4-flash', 'GLM-4 Flash'],
    ],
    moonshot: [
      ['moonshot-v1-8k', 'Moonshot V1 8K'],
      ['moonshot-v1-32k', 'Moonshot V1 32K'],
      ['moonshot-v1-128k', 'Moonshot V1 128K'],
    ],
    grok: [
      ['grok-3', 'Grok 3'],
      ['grok-2', 'Grok 2'],
      ['grok-3-mini', 'Grok 3 Mini'],
    ],
    groq: [
      ['llama-3.3-70b-versatile', 'Llama 3.3 70B'],
      ['llama-3.1-8b-instant', 'Llama 3.1 8B'],
      ['mixtral-8x7b-32768', 'Mixtral 8x7B'],
      ['gemma2-9b-it', 'Gemma 2 9B'],
      ['deepseek-r1-distill-llama-70b', 'DeepSeek R1 70B'],
    ],
    anthropic: [
      ['claude-sonnet-4-20250514', 'Claude Sonnet 4'],
      ['claude-3-5-sonnet-20241022', 'Claude 3.5 Sonnet'],
      ['claude-3-5-haiku-20241022', 'Claude 3.5 Haiku'],
      ['claude-opus-4-20250514', 'Claude Opus 4'],
    ],
    custom: [
      ['deepseek-chat', 'DeepSeek V3'],
      ['gpt-4o', 'GPT-4o'],
      ['custom-model', '自定义模型'],
    ],
  };

  const modelList = models[provider] || models.custom;
  modelList.forEach(([val, label]) => {
    const opt = document.createElement('option');
    opt.value = val;
    opt.textContent = label;
    modelSelect.appendChild(opt);
  });

  // Try to restore saved model
  if (state.config.model) {
    const opt = modelSelect.querySelector(`option[value="${state.config.model}"]`);
    if (opt) opt.selected = true;
  }

  // Update hint text
  const providerNames = {
    deepseek: 'DeepSeek（深度求索）',
    openai: 'OpenAI',
    qwen: '通义千问（阿里云）',
    zhipu: '智谱清言（GLM）',
    moonshot: '月之暗面（Moonshot）',
    grok: 'xAI Grok',
    groq: 'Groq（免费）',
    anthropic: 'Anthropic Claude',
    custom: '自定义 API',
  };
  providerHint.textContent = `当前选择：${providerNames[provider] || provider}。所有密钥仅本地保存，仅用于调用对应API。`;
}

// ── TTS 朗读 ─────────────────────────────────────────────
async function toggleTts(msgId, text) {
  const provider = state.config.ttsProvider || 'off';

  // 停止当前朗读
  if (_currentTtsMsgId === msgId && _currentAudio) {
    _currentAudio.pause();
    _currentAudio = null;
    _currentTtsMsgId = null;
    document.querySelectorAll('.msg-tts-btn').forEach(b => b.classList.remove('playing'));
    return;
  }

  if (provider === 'off') {
    showError('请在设置中开启 TTS 并配置密钥');
    return;
  }

  if (!text) text = '';
  const speakText = text.replace(/<[^>]+>/g, '').replace(/```[\s\S]*?```/g, ' ').trim().slice(0, 500);
  if (!speakText) { showError('没有可朗读的文本'); return; }

  // 检查凭证
  if (provider === 'volc' && (!state.config.ttsAk || !state.config.ttsSk)) {
    showError('请在设置中配置火山引擎的 AK 和 SK');
    return;
  }
  if (provider === 'eleven' && !state.config.ttsElevenKey) {
    showError('请在设置中配置 ElevenLabs API Key');
    return;
  }

  document.querySelectorAll('.msg-tts-btn').forEach(b => b.classList.remove('playing'));
  const btn = document.querySelector(`.msg-tts-btn[data-msg-id="${msgId}"]`);
  if (btn) btn.classList.add('playing');

  const result = await window.claudeDesktop.ttsSpeak({
    text: speakText,
    provider,
    volcAk: state.config.ttsAk || '',
    volcSk: state.config.ttsSk || '',
    volcVoice: state.config.ttsVolcVoice || 'BV001_streaming',
    volcSpeed: state.config.ttsVolcSpeed || '1.0',
    elevenKey: state.config.ttsElevenKey || '',
    elevenVoice: state.config.ttsElevenVoice || '21m00Tcm4TlvDq8ikWAM',
    elevenSpeed: state.config.ttsElevenSpeed || '1.0',
  });

  if (result.error) {
    showError(result.error);
    if (btn) btn.classList.remove('playing');
    return;
  }

  try {
    const audioData = atob(result.audio);
    const arrayBuffer = new ArrayBuffer(audioData.length);
    const view = new Uint8Array(arrayBuffer);
    for (let i = 0; i < audioData.length; i++) view[i] = audioData.charCodeAt(i);
    const blob = new Blob([arrayBuffer], { type: 'audio/mp3' });
    const url = URL.createObjectURL(blob);

    _currentTtsMsgId = msgId;
    _currentAudio = new Audio(url);
    _currentAudio.onended = () => {
      _currentAudio = null;
      _currentTtsMsgId = null;
      if (btn) btn.classList.remove('playing');
      URL.revokeObjectURL(url);
      if (voiceState === 'speaking') setVoiceState('idle', '点击并按住说话');
    };
    _currentAudio.onerror = () => {
      showError('音频播放失败');
      _currentAudio = null;
      _currentTtsMsgId = null;
      if (btn) btn.classList.remove('playing');
    };
    _currentAudio.play().catch(() => {
      showError('音频播放失败，请检查浏览器权限');
      if (btn) btn.classList.remove('playing');
    });
  } catch (err) {
    showError(`音频解码失败: ${err.message}`);
    if (btn) btn.classList.remove('playing');
  }
}

// TTS 提供商切换
ttsProvider.addEventListener('change', () => {
  const val = ttsProvider.value;
  ttsVolcConfig.style.display = val === 'volc' ? 'block' : 'none';
  ttsElevenConfig.style.display = val === 'eleven' ? 'block' : 'none';
  state.config.ttsProvider = val;
});

// TTS 测试按钮
ttsTestBtn.addEventListener('click', () => {
  toggleTts('_test_', '你好，欢迎使用 DeepAgent。这是一段测试语音。');
});

// ── 应用界面语言 ──────────────────────────────────────────
function applyLanguage() {
  // 更新 data-i18n 元素的文本
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    el.textContent = t(key);
  });
  // 更新 data-i18n-placeholder 元素的 placeholder
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    el.placeholder = t(key);
  });
  // 更新 data-i18n-title 元素的 title
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.dataset.i18nTitle;
    el.title = t(key);
  });
  document.title = t('app.title');
  // 输入框提示
  const chatInput = document.getElementById('message-input');
  if (chatInput) chatInput.placeholder = t('chat.placeholder');
  const termInput = document.querySelector('.term-input');
  if (termInput) termInput.placeholder = t('terminal.placeholder');
}

async function openSettings() {
  apiKeyInput.value = state.apiKey || '';
  apiProvider.value = state.apiProvider || 'deepseek';
  apiEndpoint.value = state.apiEndpoint || API_PROVIDERS.deepseek.endpoint;
  themeSelect.value = state.config.theme || 'dark';
  langSelect.value = state.config.language || 'zh';
  sysPromptInput.value = state.config.systemPrompt || '';
  searchProvider.value = state.config.searchProvider || 'html';
  searchApiKey.value = state.config.searchApiKey || '';
  settingsStatus.textContent = '';
  // TTS 配置
  if (ttsProvider) {
    const p = state.config.ttsProvider || 'off';
    ttsProvider.value = p;
    ttsVolcConfig.style.display = p === 'volc' ? 'block' : 'none';
    ttsElevenConfig.style.display = p === 'eleven' ? 'block' : 'none';
  }
  if (ttsAk) ttsAk.value = state.config.ttsAk || '';
  if (ttsSk) ttsSk.value = state.config.ttsSk || '';
  if (ttsVolcVoice) ttsVolcVoice.value = state.config.ttsVolcVoice || 'BV001_streaming';
  if (ttsVolcSpeed) ttsVolcSpeed.value = state.config.ttsVolcSpeed || '1.0';
  if (ttsElevenKey) ttsElevenKey.value = state.config.ttsElevenKey || '';
  if (ttsElevenVoice) ttsElevenVoice.value = state.config.ttsElevenVoice || '21m00Tcm4TlvDq8ikWAM';
  if (ttsElevenSpeed) ttsElevenSpeed.value = state.config.ttsElevenSpeed || '1.0';

  updateProviderUI();
  applyLanguage();
  switchMainView('settings');
  loadMCPStatus(); loadWorkspaces(); loadKnowledge();
  // 同步配置 + 状态指示
  if (syncDot) {
    if (state.config.syncToken && state.config.lastSyncTime) syncDot.className = 'sync-dot synced';
    else if (state.config.syncToken) syncDot.className = 'sync-dot';
    else syncDot.className = 'sync-dot off';
  }
  if (syncToken) syncToken.value = state.config.syncToken || '';
  if (syncEnabled) syncEnabled.checked = !!state.config.syncEnabled;
  const inheritCb = document.getElementById('inherit-context-cb');
  if (inheritCb) inheritCb.checked = !!state.config.inheritEnabled;
  if (syncStatus) {
    const lastSync = state.config.lastSyncTime;
    syncStatus.textContent = lastSync ? '上次同步: ' + new Date(lastSync).toLocaleString() : '从未同步';
  }
}

async function saveSettingsHandler() {
  const key = apiKeyInput.value.trim();
  const provider = apiProvider.value;
  const endpoint = apiEndpoint.value.trim();
  const model = modelSelectSettings.value;
  const theme = themeSelect.value;
  const lang = langSelect.value;

  state.apiKey = key;
  state.apiProvider = provider;
  state.apiEndpoint = endpoint || API_PROVIDERS[provider]?.endpoint || 'https://api.deepseek.com/v1';
  state.language = lang;

  state.config.apiKey = key;
  state.config.apiProvider = provider;
  state.config.apiEndpoint = state.apiEndpoint;
  state.config.theme = theme;
  state.config.language = lang;
  state.config.model = model;
  state.config.systemPrompt = sysPromptInput.value.trim();
  state.config.searchProvider = searchProvider.value;
  state.config.searchApiKey = searchApiKey.value.trim();

  setLanguage(lang);
  applyLanguage();
  // 保存 TTS 配置
  if (ttsProvider) state.config.ttsProvider = ttsProvider.value;
  if (ttsAk) state.config.ttsAk = ttsAk.value.trim();
  if (ttsSk) state.config.ttsSk = ttsSk.value.trim();
  if (ttsVolcVoice) state.config.ttsVolcVoice = ttsVolcVoice.value;
  if (ttsVolcSpeed) state.config.ttsVolcSpeed = ttsVolcSpeed.value;
  if (ttsElevenKey) state.config.ttsElevenKey = ttsElevenKey.value.trim();
  if (ttsElevenVoice) state.config.ttsElevenVoice = ttsElevenVoice.value;
  if (ttsElevenSpeed) state.config.ttsElevenSpeed = ttsElevenSpeed.value;

  applyTheme(theme);
  window.claudeDesktop.setMenuLanguage(lang);
  fullRefreshMessages();

  // Sync model to header if it exists there
  const headerModel = document.getElementById('model-select');
  if (headerModel) {
    const opt = headerModel.querySelector(`option[value="${model}"]`);
    if (opt) {
      headerModel.value = model;
    } else {
      // Add custom option
      const newOpt = document.createElement('option');
      newOpt.value = model;
      newOpt.textContent = model;
      headerModel.appendChild(newOpt);
      headerModel.value = model;
    }
  }

  await window.claudeDesktop.saveConfig({
    apiKey: key, theme, model,
    language: lang,
    apiProvider: provider,
    apiEndpoint: state.apiEndpoint,
    systemPrompt: state.config.systemPrompt,
    searchProvider: state.config.searchProvider,
    searchApiKey: state.config.searchApiKey,
    ttsProvider: state.config.ttsProvider,
    ttsAk: state.config.ttsAk,
    ttsSk: state.config.ttsSk,
    ttsVolcVoice: state.config.ttsVolcVoice,
    ttsVolcSpeed: state.config.ttsVolcSpeed,
    ttsElevenKey: state.config.ttsElevenKey,
    ttsElevenVoice: state.config.ttsElevenVoice,
    ttsElevenSpeed: state.config.ttsElevenSpeed,
    syncToken: state.config.syncToken,
    syncEnabled: state.config.syncEnabled,
  });

  // 保存同步配置
  if (syncToken) state.config.syncToken = syncToken.value.trim();
  if (syncEnabled) state.config.syncEnabled = syncEnabled.checked;
  const inheritCb = document.getElementById('inherit-context-cb');
  if (inheritCb) state.config.inheritEnabled = inheritCb.checked;

  settingsStatus.textContent = '✅ 设置已保存';
  setTimeout(() => switchMainView('chat'), 1000);
}

// Provider change handler
apiProvider.addEventListener('change', updateProviderUI);

// Endpoint input updates state on change
apiEndpoint.addEventListener('input', () => {
  state.apiEndpoint = apiEndpoint.value.trim();
});

settingsBack.addEventListener('click', () => switchMainView('chat'));

// ── Keyboard shortcuts ─────────────────────────────────────
inputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

inputEl.addEventListener('input', () => {
  updateSendButton();
  adjustTextareaHeight();
});

// ── Event listeners ────────────────────────────────────────
sendBtn.addEventListener('click', sendMessage);
newChatBtn.addEventListener('click', newChat);

// Sidebar tabs
sidebarTabs.forEach(tab => {
  tab.addEventListener('click', () => switchSidebarTab(tab.dataset.tab));
});

// Main tabs
mainTabs.forEach(tab => {
  tab.addEventListener('click', () => switchMainView(tab.dataset.view));
});

// File tree
ftRefresh.addEventListener('click', () => {
  if (state.fileTreePath) loadFileTree(state.fileTreePath);
});

// Code viewer close
codeClose.addEventListener('click', () => {
  switchMainView('chat');
});

// Terminal restart
terminalRestartBtn.addEventListener('click', restartTerminal);

// Init terminal when switching to terminal view
document.querySelector('.main-tab[data-view="terminal"]')?.addEventListener('click', () => {
  setTimeout(() => initTerminal(), 100);
});

// ── Permission System ──────────────────────────────────────────
window.claudeDesktop.onPermissionShow((data) => {
  pendingPermId = data.id;
  permToolName.textContent = data.tool;

  // Format the arguments nicely
  try {
    const args = JSON.parse(data.args || '{}');
    const formatted = Object.entries(args)
      .map(([k, v]) => `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`)
      .join('\n');
    permArgs.textContent = formatted || '(无参数)';
  } catch (_) {
    permArgs.textContent = data.args || '(无参数)';
  }

  permOverlay.classList.remove('hidden');
});

permAllow.addEventListener('click', () => {
  if (pendingPermId) {
    window.claudeDesktop.respondPermission({ id: pendingPermId, allowed: true });
    pendingPermId = null;
    permOverlay.classList.add('hidden');
  }
});

permDeny.addEventListener('click', () => {
  if (pendingPermId) {
    window.claudeDesktop.respondPermission({ id: pendingPermId, allowed: false });
    pendingPermId = null;
    permOverlay.classList.add('hidden');
  }
});

// ── 代码查看器编辑 ──
codeEditBtn.addEventListener('click', () => {
  codeContent.contentEditable = 'true';
  codeContent.focus();
  codeEditBtn.style.display = 'none';
  codeSaveBtn.style.display = 'inline-flex';
  codeContent.classList.add('code-editing');
});

codeSaveBtn.addEventListener('click', async () => {
  const newContent = codeContent.textContent || '';
  codeContent.contentEditable = 'false';
  codeSaveBtn.style.display = 'none';
  codeEditBtn.style.display = 'inline-flex';
  codeContent.classList.remove('code-editing');
  const filePath = state.selectedFilePath;
  if (filePath) {
    await window.claudeDesktop.saveConfig({ _temp: true }); // dummy
    window.claudeDesktop.terminalWrite(`Set-Content -Path "${filePath}" -Value @'\n${newContent.replace(/'/g, "''")}\n'@\n`);
  }
});

// ── 消息收藏 ──
function toggleBookmark(starId, msg) {
  if (!state.config.bookmarks) state.config.bookmarks = [];
  const idx = state.config.bookmarks.findIndex(b => b.id === starId);
  if (idx >= 0) {
    state.config.bookmarks.splice(idx, 1);
  } else {
    state.config.bookmarks.push({
      id: starId, chatId: state.currentChatId, msgId: msg.id,
      text: (msg.content || '').slice(0, 200), timestamp: Date.now(),
    });
  }
  window.claudeDesktop.saveConfig(state.config);
  displayMessages();
}

// ── 导出为图片 ──
async function exportChatAsImage() {
  if (!state.messages.length) return;
  try {
    const container = document.getElementById('messages');
    // 临时移除高度限制
    container.style.maxHeight = 'none';
    const canvas = await html2canvas(container, { useCORS: true, scale: 2, backgroundColor: getComputedStyle(document.body).backgroundColor });
    container.style.maxHeight = '';
    canvas.toBlob(blob => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `chat-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    });
  } catch(e) {
    showError('导出图片失败: ' + (e.message || '请确保 html2canvas 已加载'));
  }
}

// ── 批量操作 ──
let batchMode = false;
let selectedChats = new Set();

function toggleBatchMode() {
  batchMode = !batchMode;
  if (!batchMode) selectedChats.clear();
  renderChatList(chatSearch?.value || '');
}

function toggleChatSelect(chatId) {
  if (selectedChats.has(chatId)) selectedChats.delete(chatId);
  else selectedChats.add(chatId);
  renderChatList(chatSearch?.value || '');
}

function deleteSelectedChats() {
  if (!selectedChats.size) return;
  if (!confirm(`确定删除选中的 ${selectedChats.size} 个对话？`)) return;
  selectedChats.forEach(id => deleteChat(id));
  selectedChats.clear();
  batchMode = false;
  renderChatList();
}

function exportSelectedChats() {
  if (!selectedChats.size) return;
  let md = '# DeepAgent 导出对话\n\n';
  selectedChats.forEach(id => {
    const chat = state.chats.find(c => c.id === id);
    if (chat) {
      md += `## ${chat.title}\n\n`;
      (chat.messages || []).forEach(m => {
        if (m.role === 'user') md += `**用户**: ${(m.content || '').slice(0, 300)}\n\n`;
        else if (m.role === 'assistant') md += `**AI**: ${(m.content || '').slice(0, 300)}\n\n`;
      });
    }
  });
  const blob = new Blob([md], { type: 'text/markdown' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `deepagent-export-${Date.now()}.md`;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ── 图片查看器 ──
function openImageViewer(src, title) {
  const overlay = document.createElement('div');
  overlay.className = 'image-viewer-overlay';
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

  const img = document.createElement('img');
  img.src = src; img.alt = title || '';
  let scale = 1, rotation = 0;

  const closeBtn = document.createElement('button');
  closeBtn.className = 'image-viewer-close';
  closeBtn.textContent = '✕';
  closeBtn.onclick = () => overlay.remove();

  const toolbar = document.createElement('div');
  toolbar.className = 'image-viewer-toolbar';
  toolbar.onclick = (e) => e.stopPropagation();

  const zoomIn = document.createElement('button');
  zoomIn.textContent = '🔍+'; zoomIn.onclick = () => { scale = Math.min(3, scale + 0.25); img.style.transform = `scale(${scale}) rotate(${rotation}deg)`; };
  const zoomOut = document.createElement('button');
  zoomOut.textContent = '🔍-'; zoomOut.onclick = () => { scale = Math.max(0.25, scale - 0.25); img.style.transform = `scale(${scale}) rotate(${rotation}deg)`; };
  const rotateBtn = document.createElement('button');
  rotateBtn.textContent = '↻'; rotateBtn.onclick = () => { rotation += 90; img.style.transform = `scale(${scale}) rotate(${rotation}deg)`; };
  const resetBtn = document.createElement('button');
  resetBtn.textContent = '↺ 重置'; resetBtn.onclick = () => { scale = 1; rotation = 0; img.style.transform = ''; };

  const slider = document.createElement('input');
  slider.type = 'range'; slider.min = 50; slider.max = 200; slider.value = 100;
  slider.oninput = () => { scale = slider.value / 100; img.style.transform = `scale(${scale}) rotate(${rotation}deg)`; };

  const pct = document.createElement('span');
  pct.style.cssText = 'color:#fff;font-size:12px;min-width:36px';
  pct.textContent = '100%';
  slider.oninput = () => { scale = slider.value / 100; img.style.transform = `scale(${scale}) rotate(${rotation}deg)`; pct.textContent = `${slider.value}%`; };

  toolbar.append(zoomOut, slider, pct, zoomIn, rotateBtn, resetBtn);

  // 滚轮缩放
  overlay.addEventListener('wheel', (e) => {
    e.preventDefault();
    scale = Math.max(0.25, Math.min(3, scale + (e.deltaY > 0 ? -0.1 : 0.1)));
    img.style.transform = `scale(${scale}) rotate(${rotation}deg)`;
    slider.value = scale * 100;
    pct.textContent = `${Math.round(scale * 100)}%`;
  }, { passive: false });

  // Escape 关闭
  const keyHandler = (e) => { if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', keyHandler); } };
  document.addEventListener('keydown', keyHandler);

  overlay.append(img, closeBtn, toolbar);
  document.body.appendChild(overlay);
}

// 图片消息点击查看
document.addEventListener('click', (e) => {
  const img = e.target.closest('.msg-image img');
  if (img) openImageViewer(img.src, img.alt);
});

// ── 消息编辑/撤回 ──
function recallMessage(msgId) {
  if (!confirm('撤回后该消息及其回复将被删除，确定？')) return;
  const idx = state.messages.findIndex(m => m.id === msgId);
  if (idx === -1) return;
  state.messages.splice(idx);
  displayMessages(); saveCurrentChat();
}

function editMessage(msgId) {
  const idx = state.messages.findIndex(m => m.id === msgId);
  if (idx === -1) return;
  const msg = state.messages[idx];
  const el = document.querySelector(`[data-msg-id="${msgId}"]`);
  if (!el) return;
  const contentDiv = el.querySelector('.message-content');
  if (!contentDiv) return;

  // 替换为编辑框
  const orig = msg.content;
  contentDiv.innerHTML = `<div class="msg-edit-container"><textarea class="msg-edit-textarea">${escapeHtml(orig)}</textarea><div class="msg-edit-actions"><button class="msg-edit-save" style="background:var(--accent);color:#fff">保存</button><button class="msg-edit-cancel" style="background:var(--bg-tertiary);color:var(--text-primary)">取消</button></div></div>`;
  const textarea = contentDiv.querySelector('textarea');
  textarea.focus(); textarea.selectionStart = textarea.value.length;

  contentDiv.querySelector('.msg-edit-save').onclick = async () => {
    const newText = textarea.value.trim();
    if (!newText) return;
    msg.content = newText;
    // 删除该消息之后的所有消息
    const msgIdx = state.messages.findIndex(m => m.id === msgId);
    if (msgIdx >= 0) state.messages.splice(msgIdx + 1);
    displayMessages(); await saveCurrentChat();
    // 重新发送
    inputEl.value = newText; inputEl.dispatchEvent(new Event('input'));
    await sendMessage();
  };
  contentDiv.querySelector('.msg-edit-cancel').onclick = () => { contentDiv.innerHTML = `<p>${escapeHtml(orig)}</p>`; };
}

// ── 自动命名 ──
async function autoRenameChat(chatId, firstMsg) {
  if (!chatId || !firstMsg || !state.apiKey) return;
  try {
    const resp = await fetch(`${state.apiEndpoint}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${state.apiKey}` },
      body: JSON.stringify({
        model: state.config.model || 'deepseek-chat',
        max_tokens: 30,
        messages: [
          { role: 'system', content: '请用不超过15个字概括这段对话的主题，直接输出标题，不要任何解释。' },
          { role: 'user', content: firstMsg.slice(0, 500) }
        ],
      }),
    });
    const data = await resp.json();
    const title = data?.choices?.[0]?.message?.content?.trim();
    if (title && title.length <= 30) {
      window.claudeDesktop.renameChat({ chatId, title });
    }
  } catch (_) {}
}
window.claudeDesktop.onChatRenamed(({ chatId, title }) => {
  const chat = state.chats.find(c => c.id === chatId);
  if (chat) { chat.title = title; renderChatList(); }
});

// ── 代码审查 ──
let reviewAbort = null;

reviewBtn?.addEventListener('click', () => {
  reviewOverlay.classList.remove('hidden');
  reviewResult.style.display = 'none';
  reviewResult.innerHTML = '';
  reviewStatus.textContent = '';
});

reviewClose.addEventListener('click', () => {
  reviewOverlay.classList.add('hidden');
  if (reviewAbort) { reviewAbort.abort(); reviewAbort = null; }
});

reviewStartBtn.addEventListener('click', async () => {
  reviewResult.style.display = 'block';
  reviewResult.innerHTML = '';
  reviewStatus.textContent = '获取 Git 变更...';

  const repoPath = reviewPath.value.trim() || state.config.workspacePath || '';
  const diffResult = await window.claudeDesktop.codeReviewDiff({ repoPath });

  if (diffResult.error) { reviewStatus.textContent = diffResult.error; return; }
  if (!diffResult.diff || diffResult.diff === '无变更') { reviewStatus.textContent = '✅ 无代码变更'; reviewResult.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text-tertiary)">当前没有未提交的代码变更</div>'; return; }

  const apiMessages = [
    { role: 'system', content: '你是一个资深代码审查专家。请审查以下代码变更，按这个格式输出：\n\n## 文件: xxx\n\n### 🔴 严重问题（N个）\n- 行XX: 问题描述\n\n### 🟡 建议改进（N个）\n- 行XX: 建议描述\n\n### ✅ 好的实践\n- 做得好的地方' },
    { role: 'user', content: `请审查以下代码 diff：\n\`\`\`diff\n${diffResult.diff.slice(0, 30000)}\n\`\`\`` },
  ];

  reviewStatus.textContent = '🔍 AI 审查中...';
  reviewAbort = new AbortController();

  try {
    const resp = await fetch(`${state.apiEndpoint}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${state.apiKey}` },
      body: JSON.stringify({ model: state.config.model || 'deepseek-chat', max_tokens: 4096, stream: true, messages: apiMessages }),
      signal: reviewAbort.signal,
    });

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '', mdBuffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const json = line.slice(6).trim();
        if (json === '[DONE]') continue;
        try {
          const parsed = JSON.parse(json);
          const content = parsed.choices?.[0]?.delta?.content || '';
          if (content) { mdBuffer += content; reviewResult.innerHTML = renderMarkdown(mdBuffer) + '<span class="streaming-cursor"></span>'; reviewResult.scrollTop = reviewResult.scrollHeight; }
        } catch(_) {}
      }
    }
    reviewResult.innerHTML = renderMarkdown(mdBuffer);
    reviewStatus.textContent = '✅ 审查完成';
    reviewAbort = null;
  } catch (err) {
    if (err.name !== 'AbortError') reviewStatus.textContent = `❌ 审查失败: ${err.message}`;
  }
});

// ── 全局搜索 ──
globalSearchInput?.addEventListener('input', async () => {
  const q = globalSearchInput.value.trim().toLowerCase();
  if (!q) { globalSearchResults.innerHTML = ''; return; }
  const results = [];
  for (const chat of state.chats) {
    const msgs = chat.messages || [];
    for (const m of msgs) {
      if (typeof m.content === 'string' && m.content.toLowerCase().includes(q)) {
        results.push({ chatTitle: chat.title, chatId: chat.id, text: m.content.slice(0, 200), role: m.role });
        if (results.length >= 30) break;
      }
    }
    if (results.length >= 30) break;
  }
  globalSearchResults.innerHTML = results.length ? results.map(r =>
    `<div class="chat-item" style="cursor:pointer" onclick="switchChat('${r.chatId}')">
      <div class="chat-item-content"><div class="chat-item-title">${r.chatTitle}</div>
      <div style="font-size:11px;color:var(--text-tertiary)">${r.role === 'user' ? '用户' : 'AI'}: ${escapeHtml(r.text)}</div></div>
    </div>`
  ).join('') : '<div style="text-align:center;padding:16px;color:var(--text-tertiary);font-size:12px">无匹配结果</div>';
});

// ── 收藏列表 ──
function renderBookmarks() {
  if (!bookmarksList) return;
  const bm = state.config.bookmarks || [];
  bookmarksList.innerHTML = bm.length ? bm.map(b =>
    `<div class="chat-item" style="cursor:pointer;font-size:12px">
      <div class="chat-item-content">
        <div class="chat-item-title" style="font-size:12px">⭐ ${b.text.slice(0,80)}</div>
        <div style="font-size:10px;color:var(--text-tertiary)">${new Date(b.timestamp).toLocaleString()}</div>
      </div>
      <button class="chat-item-delete" style="font-size:10px;opacity:1" onclick="(()=>{
        const bms=state.config.bookmarks||[];const i=bms.findIndex(x=>x.id==='${b.id}');
        if(i>=0){bms.splice(i,1);state.config.bookmarks=bms;window.claudeDesktop.saveConfig(state.config);renderBookmarks();}
      })()">✕</button>
    </div>`
  ).join('') : '<div style="text-align:center;padding:24px;color:var(--text-tertiary);font-size:13px">⭐ 点击消息的星标按钮收藏重要消息</div>';
}

// ── Prompt 预设 ──
function renderPresets() {
  if (!presetsList) return;
  const presets = state.config.promptPresets || [];
  presetsList.innerHTML = presets.length ? presets.map((p, i) =>
    `<div class="dep-item"><span class="dep-name">${escapeHtml(p.name)}</span><span style="font-size:11px;color:var(--text-tertiary)">${escapeHtml(p.prompt.slice(0,50))}...</span><button class="dep-install-btn" onclick="applyPreset(${i})" style="margin-right:4px">应用</button><button class="dep-install-btn" style="background:transparent;color:var(--text-tertiary);border:1px solid var(--border-color)" onclick="deletePreset(${i})">✕</button></div>`
  ).join('') : '<div style="color:var(--text-tertiary);font-size:12px;text-align:center;padding:16px" data-i18n="prompt.empty">暂无预设</div>';
}
window.applyPreset = (i) => {
  const presets = state.config.promptPresets || [];
  if (presets[i]) { sysPromptInput.value = presets[i].prompt; presetsOverlay.classList.add('hidden'); }
};
window.deletePreset = (i) => {
  if (!confirm('删除此预设？')) return;
  const presets = state.config.promptPresets || [];
  presets.splice(i, 1); state.config.promptPresets = presets;
  window.claudeDesktop.saveConfig(state.config); renderPresets();
};
managePresetsLink.addEventListener('click', (e) => { e.preventDefault(); presetsOverlay.classList.remove('hidden'); renderPresets(); });
presetsClose.addEventListener('click', () => presetsOverlay.classList.add('hidden'));
presetNewBtn.addEventListener('click', () => { presetsNewArea.style.display = presetsNewArea.style.display === 'none' ? 'block' : 'none'; });
presetSaveBtn.addEventListener('click', () => {
  const name = presetNameInput.value.trim(); const prompt = presetContentInput.value.trim();
  if (!name || !prompt) return;
  if (!state.config.promptPresets) state.config.promptPresets = [];
  state.config.promptPresets.push({ name, prompt });
  window.claudeDesktop.saveConfig(state.config);
  presetNameInput.value = ''; presetContentInput.value = ''; presetsNewArea.style.display = 'none';
  renderPresets();
});

// ── 角色预设 ──
function getRoles() { return state.config.roles && state.config.roles.length ? state.config.roles : DEFAULT_ROLES; }

function applyRole(role) {
  state.config.activeRole = role;
  // 切换 system prompt
  if (sysPromptInput) sysPromptInput.value = role.prompt || '';
  state.config.systemPrompt = role.prompt || '';
  // 切换模型（如果有指定）
  if (role.model && modelSelect) { modelSelect.value = role.model; state.config.model = role.model; }
  // 切换工具启用
  state.config.roleToolsEnabled = role.tools;
  window.claudeDesktop.saveConfig(state.config);
  // 更新侧边栏指示
  currentRoleBadge.textContent = `${role.emoji} ${role.name}`;
  currentRoleBadge.style.display = 'inline-flex';
}

function renderRoles() {
  if (!roleList) return;
  const roles = getRoles();
  const active = state.config.activeRole;
  roleList.innerHTML = roles.map((r, i) =>
    `<div class="role-item${active?.id === r.id ? ' active' : ''}" data-idx="${i}" style="cursor:pointer;padding:6px 8px;border-radius:6px;margin-bottom:2px;font-size:13px;display:flex;align-items:center;gap:4px">
      <span>${r.emoji}</span><span style="flex:1">${r.name}</span>
      ${i >= DEFAULT_ROLES.length ? `<button class="role-del-btn" data-idx="${i}" style="background:none;border:none;color:var(--text-tertiary);cursor:pointer;font-size:11px">✕</button>` : ''}
    </div>`
  ).join('');

  roleList.querySelectorAll('.role-item').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.dataset.idx);
      const roles = getRoles();
      if (idx >= 0 && idx < roles.length) showRoleDetail(roles[idx], idx);
    });
  });
  roleList.querySelectorAll('.role-del-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.idx);
      const roles = getRoles();
      if (idx >= DEFAULT_ROLES.length && idx < roles.length && confirm('删除此角色？')) {
        roles.splice(idx, 1); state.config.roles = roles;
        window.claudeDesktop.saveConfig(state.config); renderRoles();
      }
    });
  });
}

function showRoleDetail(role, idx) {
  roleDetail.innerHTML = `
    <div style="font-size:18px;margin-bottom:8px">${role.emoji} ${role.name}</div>
    <div style="margin-bottom:10px"><label style="font-size:12px;font-weight:500;color:var(--text-secondary)">System Prompt</label>
    <textarea class="form-input form-textarea" id="role-edit-prompt" rows="4">${escapeHtml(role.prompt || '')}</textarea></div>
    <div style="display:flex;gap:8px;margin-bottom:10px">
      <div style="flex:1"><label style="font-size:12px;font-weight:500;color:var(--text-secondary)">模型（可选）</label>
      <select id="role-edit-model" class="form-input"><option value="">默认</option>${Array.from(modelSelect?.options||[]).map(o => `<option value="${o.value}" ${o.value === role.model ? 'selected' : ''}>${o.textContent}</option>`).join('')}</select></div>
      <div style="width:80px"><label style="font-size:12px;font-weight:500;color:var(--text-secondary)">温度</label>
      <input type="number" id="role-edit-temp" class="form-input" value="${role.temperature || 0.7}" min="0" max="2" step="0.1"></div>
    </div>
    <label style="display:flex;align-items:center;gap:6px;font-size:13px;margin-bottom:12px">
      <input type="checkbox" id="role-edit-tools" ${role.tools !== false ? 'checked' : ''}> <span>启用工具调用</span>
    </label>
    <div style="display:flex;gap:8px">
      <button id="role-apply-btn" class="btn-primary" style="font-size:12px">✅ 应用</button>
      <button id="role-save-btn" class="btn-secondary" style="font-size:12px">💾 保存修改</button>
    </div>`;
  document.getElementById('role-apply-btn').onclick = () => {
    const prompt = document.getElementById('role-edit-prompt').value.trim();
    const updatedRole = { ...role, prompt, model: document.getElementById('role-edit-model').value || null, temperature: parseFloat(document.getElementById('role-edit-temp').value), tools: document.getElementById('role-edit-tools').checked };
    const roles = getRoles();
    if (idx >= 0 && idx < roles.length) { roles[idx] = updatedRole; state.config.roles = roles; }
    applyRole(updatedRole);
    window.claudeDesktop.saveConfig(state.config);
    renderRoles(); roleOverlay.classList.add('hidden');
  };
  document.getElementById('role-save-btn').onclick = () => {
    const prompt = document.getElementById('role-edit-prompt').value.trim();
    const updatedRole = { ...role, prompt, model: document.getElementById('role-edit-model').value || null, temperature: parseFloat(document.getElementById('role-edit-temp').value), tools: document.getElementById('role-edit-tools').checked };
    const roles = getRoles();
    if (idx >= 0 && idx < roles.length) { roles[idx] = updatedRole; state.config.roles = roles; }
    window.claudeDesktop.saveConfig(state.config);
    renderRoles();
  };
}

// 角色按钮
const roleBtn = document.createElement('button');
roleBtn.className = 'sidebar-footer-btn'; roleBtn.innerHTML = '<span class="icon">🎭</span><span>角色</span>';
roleBtn.title = 'AI 角色预设';
document.querySelector('.sidebar-footer')?.prepend(roleBtn);
roleBtn.addEventListener('click', () => { roleOverlay.classList.remove('hidden'); renderRoles(); showRoleDetail(getRoles()[0] || DEFAULT_ROLES[0], 0); });
roleClose.addEventListener('click', () => roleOverlay.classList.add('hidden'));
roleAddBtn.addEventListener('click', () => {
  const roles = getRoles();
  const newRole = { name: '新角色', emoji: '🤖', prompt: '', model: null, temperature: 0.7, tools: true, id: 'custom_' + Date.now() };
  roles.push(newRole); state.config.roles = roles;
  window.claudeDesktop.saveConfig(state.config);
  renderRoles(); showRoleDetail(newRole, roles.length - 1);
});

// ── 对话分支 ──
async function createBranch() {
  if (!state.messages.length) return;
  const name = prompt('分支名称:', `${getCurrentChat()?.title || '对话'} - 分支 ${(state.chats.filter(c => (c.tags||[]).includes('branch')).length + 1)}`);
  if (!name) return;
  const newChat = {
    id: generateId(), title: name,
    messages: JSON.parse(JSON.stringify(state.messages)),
    tags: ['branch'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
  state.chats.unshift(newChat); state.currentChatId = newChat.id;
  await window.claudeDesktop.saveChats(state.chats);
  renderChatList(); fullRefreshMessages();
}
// 在侧边栏添加分支按钮
const branchBtn = document.createElement('button');
branchBtn.className = 'sidebar-footer-btn'; branchBtn.innerHTML = '<span class="icon">🔀</span><span>分支</span>';
branchBtn.title = '创建对话分支'; branchBtn.style.cssText = 'order:-1';
document.querySelector('.sidebar-footer')?.prepend(branchBtn);
branchBtn.addEventListener('click', createBranch);

// ── 上下文继承 ──
function inheritContext() {
  if (!state.messages.length) return;
  const lastMsgs = state.messages.slice(-4);
  const context = lastMsgs.map(m => `${m.role === 'user' ? '用户' : 'AI'}: ${(m.content || '').slice(0, 200)}`).join('\n');
  state.config.inheritedContext = `[继承上下文 - 从上一个对话]\n${context}`;
  window.claudeDesktop.saveConfig(state.config);
}
// 新建对话时自动注入继承的上下文
const _origNewChat = newChat;
newChat = async function() {
  await _origNewChat.call(this);
  if (state.config.inheritedContext && state.config.inheritEnabled) {
    const ctx = state.config.inheritedContext;
    state.messages.push({ role: 'system', content: ctx, id: generateId() });
    state.config.inheritedContext = ''; // 用完即清
    fullRefreshMessages();
  }
};

// ── 截图粘贴（Ctrl+V 检测剪贴板图片）──
inputEl.addEventListener('keydown', async (e) => {
  if ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V')) {
    try {
      const items = await navigator.clipboard.read().catch(() => null);
      if (!items) return;
      for (const item of items) {
        const imgType = item.types.find(t => t.startsWith('image/'));
        if (imgType) {
          e.preventDefault();
          const blob = await item.getType(imgType);
          const base64 = await new Promise(resolve => { const r = new FileReader(); r.onload = () => resolve(r.result); r.readAsDataURL(blob); });
          const model = (modelSelect?.value || '').toLowerCase();
          const v = ['gpt-4o', 'claude-sonnet-4', 'qwen-max', 'glm-4', 'gemini'];
          if (v.some(x => model.includes(x))) {
            state.messages.push({ role: 'user', content: '', id: generateId(), _imageData: base64, _fileName: '剪贴板图片' });
            displayMessages();
          } else {
            inputEl.value = '[剪贴板图片] 当前模型不支持直接看图\n';
          }
          break;
        }
      }
    } catch(_) {}
  }
});

// ── 紧凑模式 ──
function applyDensity(mode) {
  const root = document.documentElement;
  if (mode === 'compact') {
    root.style.setProperty('--msg-gap', '4px');
    root.style.setProperty('--sidebar-width', '220px');
    root.style.setProperty('--font-size-base', '12px');
  } else {
    root.style.setProperty('--msg-gap', '16px');
    root.style.setProperty('--sidebar-width', '280px');
    root.style.setProperty('--font-size-base', '14px');
  }
}
densitySelect.addEventListener('change', () => applyDensity(densitySelect.value));

// ── 自定义主题 ──
function saveCustomTheme() {
  const ct = {
    primary: themePrimary.value, bg: themeBg.value,
    text: themeText.value, border: themeBorder.value,
  };
  state.config.customTheme = ct;
  window.claudeDesktop.saveConfig(state.config);
  document.documentElement.style.setProperty('--accent', ct.primary);
  document.documentElement.style.setProperty('--bg-primary', ct.bg);
  document.documentElement.style.setProperty('--text-primary', ct.text);
  document.documentElement.style.setProperty('--border-color', ct.border);
}
[themePrimary, themeBg, themeText, themeBorder].forEach(el => {
  if (el) el.addEventListener('input', saveCustomTheme);
});
if (themeResetBtn) {
  themeResetBtn.addEventListener('click', () => {
    const defaults = { primary: '#4f8cff', bg: '#121212', text: '#e8e8e8', border: '#333' };
    if (themePrimary) themePrimary.value = defaults.primary;
    if (themeBg) themeBg.value = defaults.bg;
    if (themeText) themeText.value = defaults.text;
    if (themeBorder) themeBorder.value = defaults.border;
    state.config.customTheme = defaults;
    window.claudeDesktop.saveConfig(state.config);
    ['--accent', defaults.primary, '--bg-primary', defaults.bg, '--text-primary', defaults.text, '--border-color', defaults.border].forEach((v, i, a) => { if (i % 2 === 0) document.documentElement.style.setProperty(v, a[i+1]); });
  });
}

// ── 对话分享（btoa 压缩）──
shareBtn?.addEventListener('click', () => {
  if (!state.messages.length) return;
  const data = { title: getCurrentChat()?.title || '对话', date: new Date().toISOString(), messages: state.messages.map(m => ({ role: m.role, content: typeof m.content === 'string' ? m.content.slice(0, 1000) : '' })) };
  const encoded = btoa(encodeURIComponent(JSON.stringify(data)));
  const shareUrl = `deepseek-chat://share#${encoded}`;
  navigator.clipboard.writeText(shareUrl).then(() => {
    showError('✅ 分享链接已复制到剪贴板');
  }).catch(() => {
    // 后备方案
    const ta = document.createElement('textarea');
    ta.value = shareUrl; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
    showError('✅ 分享链接已复制');
  });
});

// ── 设置页搜索 ──
const settingsSearch = document.getElementById('settings-search');
if (settingsSearch) {
  settingsSearch.addEventListener('input', () => {
    const q = settingsSearch.value.trim().toLowerCase();
    document.querySelectorAll('.settings-page-body .form-group').forEach(g => {
      const label = g.querySelector('label')?.textContent || '';
      const hint = g.querySelector('.form-hint')?.textContent || '';
      const ph = g.querySelector('input')?.placeholder || '';
      g.style.display = (!q || label.toLowerCase().includes(q) || hint.toLowerCase().includes(q) || ph.toLowerCase().includes(q)) ? 'block' : 'none';
    });
  });
}

// ── MCP 加载状态 ──
async function loadMCPStatus() {
  if (!mcpStatusList) return;
  try {
    const status = await window.claudeDesktop.getMCPStatus();
    if (!status || status.length === 0) {
      mcpStatusList.innerHTML = `<div style="color:var(--text-tertiary);font-size:12px">未配置 MCP 服务器（~/.deepagent/mcp.json）</div>`;
      return;
    }
    mcpStatusList.innerHTML = status.map(s => `
      <div class="dep-item">
        <span class="dep-status ${s.started ? 'dep-ok' : 'dep-missing'}">${s.started ? '✅' : '❌'}</span>
        <span class="dep-name">${s.name}</span>
        <span style="font-size:11px;color:var(--text-tertiary)">${s.tools} 个工具</span>
        ${s.error ? `<span style="font-size:11px;color:#e8484a;margin-left:8px">${s.error}</span>` : ''}
      </div>
    `).join('');
  } catch(_) {
    mcpStatusList.innerHTML = `<div style="color:#e8484a;font-size:12px">加载失败</div>`;
  }
}

mcpReloadBtn.addEventListener('click', async () => {
  mcpReloadBtn.disabled = true;
  mcpReloadBtn.textContent = '加载中...';
  if (window.claudeDesktop.reloadMCP) await window.claudeDesktop.reloadMCP();
  await loadMCPStatus();
  mcpReloadBtn.disabled = false;
  mcpReloadBtn.textContent = '重新加载';

  // 加载内置 MCP 开关状态
  try {
    const status = await window.claudeDesktop.getMCPStatus();
    document.querySelectorAll('.mcp-toggle').forEach(cb => {
      cb.checked = status.some(s => s.name === cb.dataset.plugin);
    });
  } catch(_) {}
});

// 内置 MCP 开关
document.addEventListener('change', async (e) => {
  if (e.target.classList.contains('mcp-toggle')) {
    const plugin = e.target.dataset.plugin;
    await window.claudeDesktop.toggleBuiltinMCP({ plugin, enabled: e.target.checked });
    // 提示重新加载
    showError('已更新 MCP 配置，请点击「重新加载」使生效');
  }
});

// ── 云同步 ──
function updateSyncStatus(text, isError) {
  syncStatus.textContent = text;
  syncStatus.style.color = isError ? '#e8484a' : 'var(--text-tertiary)';
}

async function doSyncUpload() {
  syncUploadBtn.disabled = true; syncUploadBtn.textContent = '⏳ 上传中...';
  const res = await window.claudeDesktop.syncUpload();
  syncUploadBtn.disabled = false; syncUploadBtn.textContent = '☁️ 上传到云端';
  if (res.success) updateSyncStatus('✅ 同步成功 ' + new Date(res.time).toLocaleTimeString());
  else updateSyncStatus('❌ 同步失败: ' + (res.error || '未知错误'), true);
}

async function doSyncDownload() {
  syncDownloadBtn.disabled = true; syncDownloadBtn.textContent = '⏳ 下载中...';
  const res = await window.claudeDesktop.syncDownload();
  syncDownloadBtn.disabled = false; syncDownloadBtn.textContent = '☁️ 从云端下载';
  if (res.success) {
    updateSyncStatus('✅ 下载成功 ' + new Date(res.time).toLocaleTimeString());
    // 重新加载聊天列表
    state.chats = await window.claudeDesktop.getChats();
    renderChatList();
  } else updateSyncStatus('❌ 下载失败: ' + (res.error || '未知错误'), true);
}

syncUploadBtn.addEventListener('click', doSyncUpload);
syncDownloadBtn.addEventListener('click', doSyncDownload);

// 自动同步开关
syncEnabled.addEventListener('change', () => {
  state.config.syncEnabled = syncEnabled.checked;
  window.claudeDesktop.saveConfig(state.config);
});

// ── 工作区 ──
async function loadWorkspaces() {
  if (!workspaceSelect) return;
  const data = await window.claudeDesktop.getWorkspaces();
  workspaceSelect.innerHTML = data.workspaces.map((w, i) =>
    `<option value="${i}" ${i === data.active ? 'selected' : ''}>${w.name} (${w.path})</option>`
  ).join('');
}
workspaceAddBtn.addEventListener('click', async () => {
  const name = prompt('工作区名称:');
  const path = prompt('工作区路径:');
  if (name && path) { await window.claudeDesktop.addWorkspace({ name, path }); loadWorkspaces(); }
});
workspaceRemoveBtn.addEventListener('click', async () => {
  const idx = parseInt(workspaceSelect.value);
  if (idx >= 0 && confirm('删除此工作区？')) { await window.claudeDesktop.removeWorkspace(idx); loadWorkspaces(); }
});
workspaceSelect.addEventListener('change', async () => {
  const idx = parseInt(workspaceSelect.value);
  await window.claudeDesktop.setActiveWorkspace(idx);
});

// ── 知识库 ──
async function loadKnowledge() {
  if (!knowledgeList) return;
  const docs = await window.claudeDesktop.listKnowledge();
  knowledgeList.innerHTML = docs.length ? docs.map(d =>
    `<div class="dep-item"><span class="dep-name">${d.name}</span><span style="font-size:11px;color:var(--text-tertiary)">${(d.size/1024).toFixed(1)}KB</span><button class="dep-install-btn" onclick="(()=>{window.claudeDesktop.deleteKnowledge('${d.name}').then(loadKnowledge)})()">删除</button></div>`
  ).join('') : '<div style="text-align:center;padding:16px"><div style="font-size:32px;margin-bottom:8px">📚</div><div style="color:var(--text-secondary);font-size:13px">拖拽文档到这里开始构建知识库</div><div style="color:var(--text-tertiary);font-size:11px;margin-top:4px">支持 txt/md/pdf/docx 格式</div></div>';
}
knowledgeDropZone.addEventListener('click', () => {
  const input = document.createElement('input'); input.type = 'file'; input.accept = '.txt,.md,.pdf,.docx';
  input.onchange = async () => {
    const file = input.files[0]; if (!file) return;
    const result = await window.claudeDesktop.uploadKnowledge(file.path || file.name);
    if (result.success) loadKnowledge(); else showError(result.error || '上传失败');
  };
  input.click();
});
knowledgeDropZone.addEventListener('dragover', (e) => { e.preventDefault(); knowledgeDropZone.style.borderColor = 'var(--accent)'; });
knowledgeDropZone.addEventListener('dragleave', () => { knowledgeDropZone.style.borderColor = ''; });
knowledgeDropZone.addEventListener('drop', async (e) => {
  e.preventDefault(); knowledgeDropZone.style.borderColor = '';
  for (const f of Array.from(e.dataTransfer.files)) {
    const result = await window.claudeDesktop.uploadKnowledge(f.path || f.name);
    if (result.success) loadKnowledge();
  }
});
knowledgeSearch.addEventListener('input', async () => {
  const q = knowledgeSearch.value.trim();
  if (!q) { knowledgeSearchResults.innerHTML = ''; return; }
  const results = await window.claudeDesktop.searchKnowledge(q);
  knowledgeSearchResults.innerHTML = results.length ? results.map(r =>
    `<div class="dep-item" style="font-size:12px"><span class="dep-name">${r.file}:${r.line}</span><span style="color:var(--text-tertiary)">${r.text}</span></div>`
  ).join('') : '<div style="color:var(--text-tertiary);font-size:12px">无匹配结果</div>';
});

// ── 对话回放 ──
let playbackState = { active: false, messages: [], idx: 0, timer: null, speed: 1, paused: false };

function exitPlayback() {
  if (playbackState.timer) clearTimeout(playbackState.timer);
  playbackState.active = false; playbackControls.style.display = 'none';
  displayMessages();
}

playbackBtn.addEventListener('click', () => {
  if (!state.messages.length) return;
  exitPlayback();
  playbackState = { active: true, messages: [...state.messages], idx: 0, timer: null, speed: parseFloat(playbackSpeed.value), paused: false };
  playbackControls.style.display = 'flex';
  playbackProgress.max = playbackState.messages.length;
  playbackPos.textContent = `0 / ${playbackState.messages.length}`;
  messagesEl.innerHTML = '';
  playNextMessage();
});

function playNextMessage() {
  if (!playbackState.active || playbackState.paused) return;
  if (playbackState.idx >= playbackState.messages.length) { exitPlayback(); return; }
  const msg = playbackState.messages[playbackState.idx];
  const el = renderMessage(msg);
  messagesEl.appendChild(el);
  playbackState.idx++;
  playbackProgress.value = playbackState.idx;
  playbackPos.textContent = `${playbackState.idx} / ${playbackState.messages.length}`;
  scrollToBottom();

  const delay = msg.role === 'assistant' ? Math.max(300, Math.min(2000, (msg.content || '').length * 30 / playbackState.speed)) : 800;
  playbackState.timer = setTimeout(playNextMessage, delay / playbackState.speed);
}

playbackPlayBtn.addEventListener('click', () => {
  playbackState.paused = !playbackState.paused;
  playbackPlayBtn.textContent = playbackState.paused ? '▶' : '⏸';
  if (!playbackState.paused) playNextMessage();
});
playbackSpeed.addEventListener('change', () => { playbackState.speed = parseFloat(playbackSpeed.value); });
playbackExitBtn.addEventListener('click', exitPlayback);

// ── 依赖检查 ──
depCheckBtn.addEventListener('click', async () => {
  depCheckBtn.disabled = true;
  depCheckBtn.textContent = '检测中...';
  depCheckResult.innerHTML = '';
  try {
    const deps = await window.claudeDesktop.checkDependencies();
    depCheckResult.innerHTML = deps.map(d => `
      <div class="dep-item">
        <span class="dep-status ${d.installed ? 'dep-ok' : 'dep-missing'}">${d.installed ? '✅' : '❌'}</span>
        <span class="dep-name">${d.label}</span>
        ${!d.installed ? `<button class="dep-install-btn" data-dep="${d.key}">安装</button>` : ''}
      </div>
    `).join('');

    // 安装按钮点击
    depCheckResult.querySelectorAll('.dep-install-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const name = btn.dataset.dep;
        btn.disabled = true;
        btn.textContent = '安装中...';
        window.claudeDesktop.onDepInstallOutput((output) => {
          depCheckResult.insertAdjacentHTML('beforeend', `<div class="dep-output">${output.replace(/</g,'&lt;')}</div>`);
        });
        const result = await window.claudeDesktop.installDependency(name);
        btn.textContent = result.success ? '✅ 已安装' : '❌ 失败';
        if (!result.success) depCheckResult.insertAdjacentHTML('beforeend', `<div class="dep-output" style="color:#e8484a">${result.output}</div>`);
        // 重新检测
        setTimeout(async () => {
          const deps2 = await window.claudeDesktop.checkDependencies();
          document.querySelectorAll('.dep-status').forEach((el, i) => {
            el.textContent = deps2[i]?.installed ? '✅' : '❌';
            el.className = `dep-status ${deps2[i]?.installed ? 'dep-ok' : 'dep-missing'}`;
          });
        }, 1000);
      });
    });
  } catch(err) {
    depCheckResult.innerHTML = `<div class="dep-output" style="color:#e8484a">检查失败: ${err}</div>`;
  }
  depCheckBtn.disabled = false;
  depCheckBtn.textContent = '检测缺失依赖';
});

// ── 自动更新 ──
checkUpdateBtn.addEventListener('click', () => {
  if (!window.claudeDesktop.checkForUpdates) {
    updateStatusText.textContent = '更新功能不可用（electron-updater 未安装）';
    updateOverlay.classList.remove('hidden');
    return;
  }
  updateOverlay.classList.remove('hidden');
  updateStatusText.textContent = '正在检查更新...';
  updateVersionInfo.style.display = 'none';
  updateReleaseNotes.style.display = 'none';
  updateProgressContainer.style.display = 'none';
  updateDownloadBtn.style.display = 'none';
  updateInstallBtn.style.display = 'none';
  updateLaterBtn.style.display = 'none';
  window.claudeDesktop.checkForUpdates();
});

window.claudeDesktop.onUpdateStatus((data) => {
  const status = data.status;
  updateStatusText.textContent = '';

  if (status === 'checking') {
    updateStatusText.textContent = '正在检查更新...';
  } else if (status === 'available') {
    updateStatusText.textContent = `发现新版本 ${data.version}`;
    updateVersionInfo.style.display = 'block';
    updateCurrentVer.textContent = data.currentVersion;
    updateNewVer.textContent = data.version;
    if (data.releaseNotes) {
      updateReleaseNotes.style.display = 'block';
      updateReleaseNotes.textContent = data.releaseNotes.slice(0, 2000);
    }
    updateDownloadBtn.style.display = 'inline-flex';
    updateLaterBtn.style.display = 'inline-flex';
  } else if (status === 'not-available') {
    updateStatusText.textContent = '已是最新版本';
    setTimeout(() => updateOverlay.classList.add('hidden'), 2000);
  } else if (status === 'downloading') {
    updateStatusText.textContent = `正在下载... ${Math.round(data.percent)}%`;
    updateProgressContainer.style.display = 'flex';
    updateProgressFill.style.width = `${data.percent}%`;
    updateProgressText.textContent = `${Math.round(data.percent)}%`;
  } else if (status === 'downloaded') {
    updateStatusText.textContent = '更新已下载，是否重启安装？';
    updateProgressContainer.style.display = 'none';
    updateDownloadBtn.style.display = 'none';
    updateInstallBtn.style.display = 'inline-flex';
    updateLaterBtn.style.display = 'inline-flex';
  } else if (status === 'error') {
    updateStatusText.textContent = `检查更新失败: ${data.message || ''}`;
    setTimeout(() => updateOverlay.classList.add('hidden'), 3000);
  }
});

updateDownloadBtn.addEventListener('click', () => {
  window.claudeDesktop.downloadUpdate();
});

updateInstallBtn.addEventListener('click', () => {
  window.claudeDesktop.installUpdate();
});

updateLaterBtn.addEventListener('click', () => {
  updateOverlay.classList.add('hidden');
});

updateCloseBtn.addEventListener('click', () => {
  updateOverlay.classList.add('hidden');
});

// ── 语音对话模式 ──
let voiceRecorder = null;
let voiceChunks = [];
let voiceState = 'idle'; // idle | recording | processing | speaking

function setVoiceState(state, statusText) {
  voiceState = state;
  voiceBtn.className = `voice-btn${state === 'recording' ? ' active' : ''}${state === 'speaking' ? ' speaking' : ''}`;
  voiceBtn.textContent = state === 'recording' ? '🔴' : state === 'speaking' ? '🔊' : state === 'processing' ? '⏳' : '🎤';
  if (statusText && voiceStatusText) voiceStatusText.textContent = statusText;
}

// 鼠标按下开始录音
voiceBtn.addEventListener('mousedown', async () => {
  if (voiceState === 'speaking' || voiceState === 'processing') return;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    voiceRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    voiceChunks = [];
    voiceRecorder.ondataavailable = (e) => voiceChunks.push(e.data);
    voiceRecorder.start();
    setVoiceState('recording', '聆听中...');
  } catch (_) { showError('无法访问麦克风'); }
});

// 鼠标松开停止录音 + 发送
voiceBtn.addEventListener('mouseup', async () => {
  if (voiceState !== 'recording' || !voiceRecorder) return;
  setVoiceState('processing', '处理中...');

  voiceRecorder.stop();
  voiceRecorder.stream.getTracks().forEach(t => t.stop());

  const blob = new Blob(voiceChunks, { type: 'audio/webm' });
  const buffer = await blob.arrayBuffer();

  // Whisper 转写
  const result = await window.claudeDesktop.transcribeAudioBlob(Array.from(new Uint8Array(buffer)));
  const text = result?.text?.trim();
  if (!text) { setVoiceState('idle', '点击并按住说话'); return; }

  // 将语音文本填入输入框并发送
  inputEl.value = text;
  inputEl.dispatchEvent(new Event('input'));
  await sendMessage();
  setVoiceState('speaking', '回复中...');
});

// 支持空格键按住说话（输入框未聚焦时）
document.addEventListener('keydown', (e) => {
  if (e.key === ' ' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA' && !e.repeat) {
    e.preventDefault();
    voiceBtn.dispatchEvent(new MouseEvent('mousedown'));
  }
});
document.addEventListener('keyup', (e) => {
  if (e.key === ' ') {
    e.preventDefault();
    voiceBtn.dispatchEvent(new MouseEvent('mouseup'));
  }
});

// ── 批量操作切换 ──
batchToggleBtn?.addEventListener('click', () => toggleBatchMode());

// ── 导出增强（含图片） ──
exportBtn?.addEventListener('click', () => {
  if (!state.messages.length) return;
  const fmt = prompt('导出格式: md / txt / json / png', 'md') || 'md';
  if (fmt === 'png') { exportChatAsImage(); return; }
  const date = new Date().toISOString().slice(0, 10);
  let content = '';
  if (fmt === 'json') {
    content = JSON.stringify({ title: getCurrentChat()?.title || '对话', date, messages: state.messages }, null, 2);
  } else if (fmt === 'txt') {
    content = state.messages.map(m => `[${m.role}] ${typeof m.content === 'string' ? m.content.slice(0, 500) : '(图片/工具)'}`).join('\n\n---\n\n');
  } else {
    content = `# 对话导出\n\n${state.messages.map(m => {
      if (m.role === 'user') return `## 用户\n${m.content || '(图片)'}`;
      if (m.role === 'assistant') return `## AI\n${m.content || ''}`;
      return '';
    }).filter(Boolean).join('\n\n')}`;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type: 'text/plain' }));
  a.download = `chat-${date}.${fmt}`;
  a.click();
  URL.revokeObjectURL(a.href);
});

// ── 菜单动作 ──
window.claudeDesktop.onMenuAction((action) => {
  switch (action) {
    case 'new-chat': newChat(); break;
    case 'open-settings': openSettings(); break;
    case 'view-chat': switchMainView('chat'); break;
    case 'view-terminal': switchMainView('terminal'); initTerminal(); break;
  }
});

themeToggle.addEventListener('click', () => {
  const newTheme = state.config.theme === 'dark' ? 'light' : 'dark';
  state.config.theme = newTheme;
  applyTheme(newTheme);
  window.claudeDesktop.saveConfig({ ...state.config, theme: newTheme });
  themeSelect.value = newTheme;
  // Mermaid 主题联动
  if (typeof mermaid !== 'undefined') {
    try { mermaid.initialize({ theme: newTheme === 'dark' ? 'dark' : 'default' }); } catch(_) {}
  }
});

settingsBtn.addEventListener('click', openSettings);
saveSettings.addEventListener('click', saveSettingsHandler);

// ── 终端面板控制器（带历史/Ctrl+C/Tab）──
let termPanelHistory = [];
let termPanelHistIdx = -1;
let _currentTtsMsgId = null;
let _currentAudio = null;
let termPanelSavedInput = '';

termPanelClear.addEventListener('click', () => {
  termPanelOutput.innerHTML = '';
});

termPanelInput.addEventListener('keydown', (e) => {
  if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) {
    // Ctrl+C 中断
    window.claudeDesktop.terminalWrite('\x03');
    termPanelOutput.insertAdjacentHTML('beforeend', '<span style="color:#e8484a">^C</span>\n');
    termPanelInput.value = '';
    termPanelHistIdx = -1;
    e.preventDefault();
    return;
  }

  if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (termPanelHistory.length === 0) return;
    if (termPanelHistIdx === -1) {
      termPanelSavedInput = termPanelInput.value;
      termPanelHistIdx = termPanelHistory.length - 1;
    } else if (termPanelHistIdx > 0) {
      termPanelHistIdx--;
    }
    termPanelInput.value = termPanelHistory[termPanelHistIdx];
    return;
  }

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (termPanelHistIdx === -1) return;
    termPanelHistIdx++;
    if (termPanelHistIdx >= termPanelHistory.length) {
      termPanelHistIdx = -1;
      termPanelInput.value = termPanelSavedInput;
    } else {
      termPanelInput.value = termPanelHistory[termPanelHistIdx];
    }
    return;
  }

  if (e.key === 'Tab') {
    e.preventDefault();
    const val = termPanelInput.value;
    const lastWord = val.split(/[\\/ ]+/).pop() || '';
    if (lastWord.length > 0) {
      const prefix = val.slice(0, val.length - lastWord.length);
      window.claudeDesktop.terminalWrite(`Get-ChildItem -Name "${lastWord}*" 2>$null | Select-Object -First 10\r\n`);
      setTimeout(() => { termPanelInput.value = val; termPanelInput.focus(); }, 100);
    }
    return;
  }

  if (e.key === 'Enter') {
    const cmd = termPanelInput.value.trim();
    if (!cmd) return;
    if (cmd.trim()) {
      termPanelHistory.push(cmd);
      if (termPanelHistory.length > 200) termPanelHistory.shift();
    }
    termPanelHistIdx = -1;
    termPanelOutput.insertAdjacentHTML('beforeend', `<span style="color:var(--accent)">❯ ${cmd.replace(/</g, '&lt;')}</span>\n`);
    termPanelOutput.scrollTop = termPanelOutput.scrollHeight;
    termPanelInput.value = '';
    window.claudeDesktop.terminalWrite(cmd + '\n');
  }
});

// ── 欢迎页英文修复 ──
// (applyLanguage 已经覆盖 data-i18n，但 JS 动态生成的欢迎页需要刷新)
// 在语言切换时重新创建欢迎页

apiKeyInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    saveSettingsHandler();
  }
});

// ── Init ────────────────────────────────────────────────────
async function init() {
  state.config = await window.claudeDesktop.getConfig();
  state.apiKey = state.config.apiKey || '';
  state.config.theme = state.config.theme || 'dark';
  state.config.model = state.config.model || 'deepseek-chat';
  state.config.language = state.config.language || 'zh';
  state.config.apiProvider = state.config.apiProvider || 'deepseek';
  state.config.apiEndpoint = state.config.apiEndpoint || 'https://api.deepseek.com/v1';

  state.apiProvider = state.config.apiProvider;
  state.apiEndpoint = state.config.apiEndpoint;
  state.language = state.config.language;
  setLanguage(state.language);
  applyTheme(state.config.theme);
  themeSelect.value = state.config.theme;
  langSelect.value = state.language;

  if (state.config.model) {
    modelSelect.value = state.config.model;
  }
  modelSelect.addEventListener('change', () => {
    state.config.model = modelSelect.value;
    window.claudeDesktop.saveConfig(state.config);
    if (chatModelSelect) chatModelSelect.value = modelSelect.value;
  });

  // 输入框模型选择器
  if (chatModelSelect && modelSelect) {
    Array.from(modelSelect.options).forEach(opt => {
      chatModelSelect.appendChild(new Option(opt.textContent, opt.value));
    });
    chatModelSelect.value = state.config.model || 'deepseek-chat';
    chatModelSelect.addEventListener('change', () => {
      state.config.model = chatModelSelect.value;
      modelSelect.value = chatModelSelect.value;
      window.claudeDesktop.saveConfig(state.config);
    });
  }

  // 自定义主题
  function applyCustomTheme(colors) {
    const root = document.documentElement;
    if (colors?.primary) root.style.setProperty('--accent', colors.primary);
    if (colors?.bg) root.style.setProperty('--bg-primary', colors.bg);
    if (colors?.text) root.style.setProperty('--text-primary', colors.text);
    if (colors?.border) root.style.setProperty('--border-color', colors.border);
  }
  if (state.config.customTheme) applyCustomTheme(state.config.customTheme);
  if (themePrimary) themePrimary.value = state.config.customTheme?.primary || '#4f8cff';
  if (themeBg) themeBg.value = state.config.customTheme?.bg || '#121212';
  if (themeText) themeText.value = state.config.customTheme?.text || '#e8e8e8';
  if (themeBorder) themeBorder.value = state.config.customTheme?.border || '#333333';
  // 初始化角色
  if (state.config.activeRole && state.config.activeRole.id) {
    applyRole(state.config.activeRole);
  }
  // 初始化 Mermaid
  if (typeof mermaid !== 'undefined') {
    try {
      mermaid.initialize({ startOnLoad: false, theme: state.config.theme === 'dark' ? 'dark' : 'default', securityLevel: 'loose' });
    } catch(_) {}
  }

  state.chats = await window.claudeDesktop.getChats();
  renderChatList();

  fullRefreshMessages();
  inputEl.focus();

  // Load drives and file tree
  try {
    const homeDir = await window.claudeDesktop.getHomeDir();
    const drives = await window.claudeDesktop.getDrives();

    // Populate drive selector
    ftDriveSelect.innerHTML = '';
    drives.forEach(d => {
      const opt = document.createElement('option');
      opt.value = d + '\\';
      opt.textContent = d === homeDir.slice(0, 2) ? d + ' (系统)' : d;
      ftDriveSelect.appendChild(opt);
    });

    // Select current drive
    const currentDrive = homeDir.slice(0, 2) + '\\';
    if (drives.some(d => (d + '\\') === currentDrive)) {
      ftDriveSelect.value = currentDrive;
    }

    loadFileTree(homeDir);
  } catch (_) {}

  // Drive change handler
  ftDriveSelect.addEventListener('change', () => {
    loadFileTree(ftDriveSelect.value);
  });

  // Drag-and-drop file upload
  inputWrapper.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropOverlay.classList.remove('hidden');
  });
  inputWrapper.addEventListener('dragleave', () => {
    dropOverlay.classList.add('hidden');
  });
  inputWrapper.addEventListener('drop', async (e) => {
    e.preventDefault();
    dropOverlay.classList.add('hidden');
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
    const model = (modelSelect?.value || 'deepseek-chat').toLowerCase();
    const VISION_MODELS = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'claude-sonnet-4', 'claude-3-5-sonnet', 'claude-opus-4',
      'qwen-max', 'qwen-plus', 'qwen-turbo', 'glm-4v', 'glm-4', 'gemini-2.0-flash', 'gemini-2.0-pro'];
    const supportsVision = VISION_MODELS.some(v => model.includes(v));

    for (const file of files) {
      const ext = (file.name.split('.').pop() || '').toLowerCase();
      const isImage = IMAGE_EXTS.includes(ext);

      if (isImage && supportsVision) {
        const base64 = await new Promise(resolve => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });
        const imgMsg = { role: 'user', content: '', id: generateId(), _imageData: base64, _fileName: file.name };
        state.messages.push(imgMsg);
        displayMessages();
      } else if (isImage) {
        inputEl.value = `[图片: ${file.name}] 当前模型不支持直接看图，发送后 AI 会调用分析工具\n` + inputEl.value;
      } else {
        const text = await file.text().catch(() => '');
        if (text) {
          inputEl.value = `[文件: ${file.name}]\n\`\`\`${ext}\n${text.slice(0, 5000)}\n\`\`\`\n` + inputEl.value;
        }
      }
    }
    inputEl.dispatchEvent(new Event('input'));
    inputEl.focus();
  });

  if (!state.apiKey) {
    // 新手引导弹窗
    setTimeout(() => showOnboarding(), 500);
  }
} // <-- end init

// ── 新手引导 ──
function showOnboarding() {
  const overlay = document.createElement('div');
  overlay.className = 'perm-overlay';
  overlay.innerHTML = `
    <div class="perm-dialog" style="width:520px">
      <div class="perm-header">
        <span class="perm-icon">🐋</span>
        <span class="perm-title">🎉 欢迎使用 DeepAgent</span>
      </div>
      <div class="perm-body">
        <p style="font-size:14px;color:var(--text-secondary);margin-bottom:16px">DeepAgent 是一个强大的桌面 AI 智能体，支持多种 AI 模型和本地工具链。</p>
        <div style="margin-bottom:12px">
          <label style="font-size:13px;font-weight:500;display:block;margin-bottom:4px">步骤1：选择 AI 提供商</label>
          <select id="onboarding-provider" class="form-input">
            <option value="deepseek">DeepSeek</option>
            <option value="openai">OpenAI</option>
            <option value="qwen">通义千问（阿里云）</option>
            <option value="zhipu">智谱清言</option>
            <option value="moonshot">月之暗面</option>
            <option value="anthropic">Anthropic Claude</option>
            <option value="grok">xAI Grok</option>
            <option value="groq">Groq（免费）</option>
          </select>
        </div>
        <div style="margin-bottom:16px">
          <label style="font-size:13px;font-weight:500;display:block;margin-bottom:4px">步骤2：输入 API Key</label>
          <input type="password" id="onboarding-key" class="form-input" placeholder="sk-...">
        </div>
      </div>
      <div class="perm-actions" style="justify-content:space-between">
        <button id="onboarding-skip" class="btn-secondary" style="background:none;border:none;color:var(--text-tertiary);padding:8px 0">稍后配置</button>
        <button id="onboarding-start" class="btn-primary">开始使用</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById('onboarding-start').addEventListener('click', () => {
    const provider = document.getElementById('onboarding-provider').value;
    const key = document.getElementById('onboarding-key').value.trim();
    if (key) {
      state.apiKey = key;
      state.apiProvider = provider;
      state.config.apiKey = key;
      state.config.apiProvider = provider;
      const endpoint = API_PROVIDERS[provider]?.endpoint || 'https://api.deepseek.com/v1';
      state.apiEndpoint = endpoint;
      state.config.apiEndpoint = endpoint;
      window.claudeDesktop.saveConfig(state.config);
    }
    overlay.remove();
    fullRefreshMessages();
  });

  document.getElementById('onboarding-skip').addEventListener('click', () => {
    overlay.remove();
    fullRefreshMessages();
  });
}

// Helper: get file extension (since path module isn't available in renderer)
function getExt(filePath) {
  const idx = filePath.lastIndexOf('.');
  if (idx === -1) return '';
  const slash = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'));
  if (slash > idx) return '';
  return filePath.slice(idx).toLowerCase();
}

// ── Start ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
