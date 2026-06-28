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
const sysPromptInput = $('#sys-prompt');
const searchProvider = $('#search-provider');
const searchApiKey = $('#search-api-key');
const densitySelect = $('#density-select');
const depCheckBtn = $('#dep-check-btn');
const depCheckResult = $('#dep-check-result');
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
    const validLang = hljs.getLanguage(language) ? language : 'plaintext';
    let highlighted;
    try {
      highlighted = hljs.highlight(codeText, { language: validLang }).value;
    } catch (_) {
      highlighted = escapeHtml(codeText);
    }

    return `<div class="code-block">
      <div class="code-header">
        <span class="code-lang">${escapeHtml(language)}</span>
        <button class="copy-btn" onclick="copyCode(this)">📋 复制</button>
      </div>
      <pre><code class="hljs language-${escapeHtml(validLang)}">${highlighted}</code></pre>
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

  if (msg.role === 'user') {
    if (msg._imageData) {
      // 图片消息显示缩略图
      const label = msg._fileName ? escapeHtml(msg._fileName) : '图片';
      content.innerHTML = `<div class="msg-image"><img src="${msg._imageData}" alt="${label}" title="${label}"><p>${label}</p></div>`;
    } else {
      content.innerHTML = `<p>${escapeHtml(msg.content)}</p>`;
    }
  } else {
    content.innerHTML = renderMarkdown(msg.content);
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
function showError(message) {
  const existing = document.querySelector('.error-banner');
  if (existing) existing.remove();

  const banner = document.createElement('div');
  banner.className = 'error-banner';
  banner.innerHTML = `<span class="error-icon">⚠️</span> ${escapeHtml(message)}`;
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
    empty.style.cssText = 'padding: 20px; text-align: center; color: var(--text-tertiary); font-size: 13px;';
    empty.textContent = filter ? '无匹配对话' : t('sidebar.no_chats');
    chatListItems.appendChild(empty);
    return;
  }

  // 置顶优先
  const pinned = chats.filter(c => c.pinned);
  const unpinned = chats.filter(c => !c.pinned);
  const sorted = [...pinned, ...unpinned];

  sorted.forEach(chat => {
    const item = document.createElement('div');
    item.className = `chat-item${chat.id === state.currentChatId ? ' active' : ''}${chat.pinned ? ' pinned' : ''}`;
    item.dataset.chatId = chat.id;

    const tagBadges = (chat.tags || []).map(t => `<span class="chat-tag-badge">${t}</span>`).join('');

    item.innerHTML = `
      <span class="chat-item-icon">${chat.pinned ? '📌' : '💬'}</span>
      <div class="chat-item-content">
        <div class="chat-item-title">${escapeHtml(chat.title)}</div>
        <div class="chat-item-date">${formatDate(chat.updatedAt)} ${tagBadges}</div>
      </div>
      <button class="chat-item-pin" title="${chat.pinned ? '取消置顶' : '置顶'}">${chat.pinned ? '★' : '☆'}</button>
      <button class="chat-item-delete" title="删除对话">✕</button>
    `;

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

// 标签筛选点击
document.querySelectorAll('.tag-btn').forEach(btn => {
  btn.addEventListener('click', () => setActiveTag(btn.dataset.tag));
});

// 对话搜索
if (chatSearch) {
  chatSearch.addEventListener('input', () => {
    renderChatList(chatSearch.value);
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

  const model = modelSelect.value || 'deepseek-chat';

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
  window.claudeDesktop.onStreamEnd(async () => {
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

    displayMessages();
    updateSendButton();

    await saveCurrentChat();
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
  const panelId = tabId === 'chats' ? 'chat-list' : 'file-tree';
  document.querySelectorAll('.sidebar-panel').forEach(p => {
    p.classList.toggle('active', p.id === panelId);
  });
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
  updateProviderUI();
  applyLanguage();
  switchMainView('settings');
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
  applyTheme(theme);
  window.claudeDesktop.setMenuLanguage(lang);
  fullRefreshMessages(); // 刷新欢迎页等动态内容

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
  });

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

// ── 对话导出增强 ──
exportBtn.addEventListener('click', () => {
  if (!state.messages.length) return;
  const fmt = prompt('导出格式: md / txt / json', 'md') || 'md';
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

// ── 对话分享（btoa 压缩）──
shareBtn.addEventListener('click', () => {
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
});

settingsBtn.addEventListener('click', openSettings);
saveSettings.addEventListener('click', saveSettingsHandler);

// ── 终端面板控制器（带历史/Ctrl+C/Tab）──
let termPanelHistory = [];
let termPanelHistIdx = -1;
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
  });

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
    // 首次启动引导
    setTimeout(async () => {
      const firstMsg = {
        role: 'assistant',
        content: `# 🐋 欢迎使用 DeepAgent！\n\n在开始之前，需要配置 API 密钥。\n\n点击下方的 **⚙ 设置** 可以配置：\n- AI 服务商（DeepSeek/OpenAI/通义千问等）\n- API 密钥\n- 界面语言（中文/English）\n- 主题（深色/浅色）\n\n配置完成后就可以开始对话了！`,
        id: generateId(),
      };
      state.messages.push(firstMsg);
      fullRefreshMessages();
      setTimeout(() => openSettings(), 1000);
    }, 300);
  }
} // <-- end init

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
