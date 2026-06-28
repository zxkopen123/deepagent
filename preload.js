const { contextBridge, ipcRenderer } = require('electron');

// 加载 xterm.js（已安装在 node_modules 中）
try {
  const { Terminal } = require('@xterm/xterm');
  const { FitAddon } = require('@xterm/addon-fit');
  contextBridge.exposeInMainWorld('xterm', { Terminal, FitAddon });
} catch (_) {
  // xterm 未安装，终端会降级显示
}

contextBridge.exposeInMainWorld('claudeDesktop', {
  // ── Config ──
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),

  // ── Chats ──
  getChats: () => ipcRenderer.invoke('get-chats'),
  saveChats: (chats) => ipcRenderer.invoke('save-chats', chats),
  deleteChat: (id) => ipcRenderer.invoke('delete-chat', id),
  updateChat: (chat) => ipcRenderer.invoke('update-chat', chat),

  // ── Streaming ──
  streamMessage: (params) => ipcRenderer.invoke('stream-message', params),
  stopGeneration: () => ipcRenderer.invoke('stop-generation'),

  onStreamData: (callback) => {
    ipcRenderer.removeAllListeners('stream-data');
    ipcRenderer.on('stream-data', (_event, data) => callback(data));
  },
  onStreamEnd: (callback) => {
    ipcRenderer.removeAllListeners('stream-end');
    ipcRenderer.on('stream-end', (_event, data) => callback(data));
  },
  onStreamError: (callback) => {
    ipcRenderer.removeAllListeners('stream-error');
    ipcRenderer.on('stream-error', (_event, error) => callback(error));
  },

  // ── Tool Calls ──
  onToolStart: (callback) => {
    ipcRenderer.removeAllListeners('tool-start');
    ipcRenderer.on('tool-start', (_event, calls) => callback(calls));
  },
  onToolResult: (callback) => {
    ipcRenderer.removeAllListeners('tool-result');
    ipcRenderer.on('tool-result', (_event, data) => callback(data));
  },
  onToolEnd: (callback) => {
    ipcRenderer.removeAllListeners('tool-end');
    ipcRenderer.on('tool-end', () => callback());
  },

  // ── File Tree & Code Viewer ──
  getHomeDir: () => ipcRenderer.invoke('get-home-dir'),
  getDrives: () => ipcRenderer.invoke('get-drives'),
  getDirectoryTree: (dirPath, depth) => ipcRenderer.invoke('get-directory-tree', dirPath, depth),
  readFileContent: (filePath) => ipcRenderer.invoke('read-file-content', filePath),

  // ── Terminal ──
  terminalStart: (options) => ipcRenderer.invoke('terminal-start', options),
  terminalWrite: (data) => ipcRenderer.invoke('terminal-write', data),
  terminalResize: (opts) => ipcRenderer.invoke('terminal-resize', opts),
  terminalStop: () => ipcRenderer.invoke('terminal-stop'),

  onTerminalData: (callback) => {
    ipcRenderer.removeAllListeners('terminal-data');
    ipcRenderer.on('terminal-data', (_event, data) => callback(data));
  },
  onTerminalExit: (callback) => {
    ipcRenderer.removeAllListeners('terminal-exit');
    ipcRenderer.on('terminal-exit', () => callback());
  },

  // ── Token 用量 ──
  onTokenUsage: (callback) => {
    ipcRenderer.removeAllListeners('token-usage');
    ipcRenderer.on('token-usage', (_event, data) => callback(data));
  },

  // ── Command Stream (AI 执行命令时实时输出) ──
  onCommandOutput: (callback) => {
    ipcRenderer.removeAllListeners('command-output');
    ipcRenderer.on('command-output', (_event, data) => callback(data));
  },
  onCommandEnd: (callback) => {
    ipcRenderer.removeAllListeners('command-end');
    ipcRenderer.on('command-end', () => callback());
  },

  // ── Chat Rename ──
  renameChat: (data) => ipcRenderer.invoke('rename-chat', data),
  onChatRenamed: (callback) => {
    ipcRenderer.removeAllListeners('chat-renamed');
    ipcRenderer.on('chat-renamed', (_event, data) => callback(data));
  },

  // ── Permission System ──
  respondPermission: (data) => ipcRenderer.invoke('permission-respond', data),

  onPermissionShow: (callback) => {
    ipcRenderer.removeAllListeners('permission-show');
    ipcRenderer.on('permission-show', (_event, data) => callback(data));
  },

  // ── Microphone Recording ──
  transcribeAudioBlob: (buffer) => ipcRenderer.invoke('transcribe-audio-blob', { buffer }),

  // ── Browser & Desktop Automation ──
  browserOpen: (url) => ipcRenderer.invoke('browser-open', url),
  browserAct: (params) => ipcRenderer.invoke('browser-act', params),
  desktopAct: (params) => ipcRenderer.invoke('desktop-act', params),

  // ── TTS ──
  ttsSpeak: (params) => ipcRenderer.invoke('tts-speak', params),
  ttsStop: () => ipcRenderer.invoke('tts-stop'),

  // ── RAG Knowledge ──
  listKnowledge: () => ipcRenderer.invoke('list-knowledge'),
  uploadKnowledge: (path) => ipcRenderer.invoke('upload-knowledge', path),
  deleteKnowledge: (name) => ipcRenderer.invoke('delete-knowledge', name),
  searchKnowledge: (keyword) => ipcRenderer.invoke('search-knowledge', keyword),

  // ── Code Review ──
  codeReviewDiff: (opts) => ipcRenderer.invoke('code-review-diff', opts),

  // ── Workspace ──
  getWorkspaces: () => ipcRenderer.invoke('get-workspaces'),
  addWorkspace: (data) => ipcRenderer.invoke('add-workspace', data),
  removeWorkspace: (idx) => ipcRenderer.invoke('remove-workspace', idx),
  setActiveWorkspace: (idx) => ipcRenderer.invoke('set-active-workspace', idx),

  // ── Cloud Sync ──
  syncUpload: () => ipcRenderer.invoke('sync-upload'),
  syncDownload: () => ipcRenderer.invoke('sync-download'),

  // ── MCP ──
  getMCPStatus: () => ipcRenderer.invoke('get-mcp-status'),
  toggleBuiltinMCP: (data) => ipcRenderer.invoke('toggle-builtin-mcp', data),
  reloadMCP: () => ipcRenderer.invoke('reload-mcp'),

  // ── Dependency Check ──
  checkDependencies: () => ipcRenderer.invoke('check-dependencies'),
  installDependency: (name) => ipcRenderer.invoke('install-dependency', name),
  onDepInstallOutput: (callback) => {
    ipcRenderer.removeAllListeners('dep-install-output');
    ipcRenderer.on('dep-install-output', (_event, data) => callback(data));
  },

  // ── Auto Update ──
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  onUpdateStatus: (callback) => {
    ipcRenderer.removeAllListeners('update-status');
    ipcRenderer.on('update-status', (_event, data) => callback(data));
  },

  // ── Menu ──
  setMenuLanguage: (lang) => ipcRenderer.invoke('set-menu-language', lang),
  onMenuAction: (callback) => {
    ipcRenderer.removeAllListeners('menu-action');
    ipcRenderer.on('menu-action', (_event, action) => callback(action));
  },
});
