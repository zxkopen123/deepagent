const { app, BrowserWindow, ipcMain, nativeTheme, Menu, Notification } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { exec } = require('child_process');

// 容器/API 模式支持：通过 PORT 环境变量启动 HTTP 服务
const PORT = process.env.PORT || null;
if (PORT) {
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ name: 'DeepAgent', version: '1.0.0', status: 'running', port: PORT }));
  });
  server.listen(PORT, () => {
    console.log(`[DeepAgent] API server running on port ${PORT}`);
  });
}

let mainWindow;

// ── Data paths ──────────────────────────────────────────────
const userDataPath = app.getPath('userData');
const CONFIG_PATH = path.join(userDataPath, 'config.json');
const CHATS_PATH = path.join(userDataPath, 'chats.json');
const MEMORY_PATH = path.join(userDataPath, 'memory.md');
const SYNC_GIST_ID_PATH = path.join(userDataPath, '.sync-gist-id');

// ── 记忆系统初始化 ──
function getMemory() {
  try {
    if (fs.existsSync(MEMORY_PATH)) return fs.readFileSync(MEMORY_PATH, 'utf-8');
  } catch(_) {}
  return '';
}

function initMemory() {
  if (!fs.existsSync(MEMORY_PATH)) {
    const content = `# DeepAgent — 长期记忆\n\n> 最后更新: ${new Date().toISOString().slice(0, 10)}\n\n这是我的长期记忆文件。我可以在这里记录用户的重要信息、偏好、项目上下文。\n\n`;
    fs.writeFileSync(MEMORY_PATH, content, 'utf-8');
  }
}

// ── Persistence helpers ─────────────────────────────────────
function loadJSON(filePath, fallback = {}) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch (_) { /* corrupted file -> fallback */ }
  return fallback;
}

function saveJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function loadConfig() {
  const cfg = loadJSON(CONFIG_PATH, { theme: 'dark', apiKey: 'sk-752f8c134b3c4d38ac455b7b5de86e50', model: 'deepseek-chat', language: 'zh' });
  if (!cfg.theme || !['dark', 'light'].includes(cfg.theme)) cfg.theme = 'dark';
  return cfg;
}

function saveConfig(config) {
  saveJSON(CONFIG_PATH, config);
}

function loadChats() {
  return loadJSON(CHATS_PATH, []);
}

function saveChats(chats) {
  saveJSON(CHATS_PATH, chats);
}

// ── Window creation ─────────────────────────────────────────
function createWindow() {
  const config = loadConfig();
  nativeTheme.themeSource = config.theme === 'dark' ? 'dark' : 'light';

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: config.theme === 'dark' ? '#1a1a1a' : '#ffffff',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    show: false,
  });

  // 启动闪屏：先显示 splash，加载完成后切换主界面
  mainWindow.loadFile(path.join(__dirname, 'splash.html'));

  mainWindow.once('ready-to-show', () => {
    setTimeout(() => {
      mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));
      mainWindow.show();
    }, 800); // 闪屏显示 0.8 秒
  });

  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }
}

// ── 多语言菜单 ──────────────────────────────────────────────
const MENU_LABELS = {
  zh: { file: '文件', edit: '编辑', view: '视图', help: '帮助',
    newChat: '新建对话', settings: '设置', quit: '退出',
    undo: '撤销', redo: '重做', cut: '剪切', copy: '复制', paste: '粘贴', selectAll: '全选',
    chatView: '对话视图', terminalView: '终端视图', devTools: '开发者工具', reload: '重新加载',
    zoomIn: '放大', zoomOut: '缩小', resetZoom: '重置缩放', fullscreen: '全屏',
    about: '关于 DeepAgent', aboutTitle: '关于', aboutDetail: 'AI 驱动的桌面助手' },
  en: { file: 'File', edit: 'Edit', view: 'View', help: 'Help',
    newChat: 'New Chat', settings: 'Settings', quit: 'Quit',
    undo: 'Undo', redo: 'Redo', cut: 'Cut', copy: 'Copy', paste: 'Paste', selectAll: 'Select All',
    chatView: 'Chat View', terminalView: 'Terminal View', devTools: 'Developer Tools', reload: 'Reload',
    zoomIn: 'Zoom In', zoomOut: 'Zoom Out', resetZoom: 'Reset Zoom', fullscreen: 'Full Screen',
    about: 'About DeepAgent', aboutTitle: 'About', aboutDetail: 'AI-powered Desktop Assistant' },
};

function setMenu(lang) {
  const L = MENU_LABELS[lang] || MENU_LABELS.zh;
  const menuTemplate = [
    {
      label: L.file,
      submenu: [
        { label: L.newChat, accelerator: 'CmdOrCtrl+N', click: () => { if (mainWindow) mainWindow.webContents.send('menu-action', 'new-chat'); } },
        { label: L.settings, accelerator: 'CmdOrCtrl+,', click: () => { if (mainWindow) mainWindow.webContents.send('menu-action', 'open-settings'); } },
        { type: 'separator' },
        { label: L.quit, accelerator: 'CmdOrCtrl+Q', role: 'quit' },
      ],
    },
    {
      label: L.edit,
      submenu: [
        { role: 'undo', label: L.undo },
        { role: 'redo', label: L.redo },
        { type: 'separator' },
        { role: 'cut', label: L.cut },
        { role: 'copy', label: L.copy },
        { role: 'paste', label: L.paste },
        { role: 'selectAll', label: L.selectAll },
      ],
    },
    {
      label: L.view,
      submenu: [
        { label: L.chatView, click: () => { if (mainWindow) mainWindow.webContents.send('menu-action', 'view-chat'); } },
        { label: L.terminalView, click: () => { if (mainWindow) mainWindow.webContents.send('menu-action', 'view-terminal'); } },
        { type: 'separator' },
        { role: 'toggleDevTools', label: L.devTools },
        { role: 'reload', label: L.reload },
        { type: 'separator' },
        { role: 'zoomIn', label: L.zoomIn },
        { role: 'zoomOut', label: L.zoomOut },
        { role: 'resetZoom', label: L.resetZoom },
        { type: 'separator' },
        { role: 'togglefullscreen', label: L.fullscreen },
      ],
    },
    {
      label: L.help,
      submenu: [
        { label: L.about, click: () => {
          require('electron').dialog.showMessageBox({ type: 'info', title: L.aboutTitle, message: 'DeepAgent v1.0', detail: L.aboutDetail });
        }},
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
}

ipcMain.handle('set-menu-language', (_, lang) => {
  setMenu(lang);
  return true;
});

ipcMain.handle('rename-chat', (_, { chatId, title }) => {
  const chats = loadChats();
  const chat = chats.find(c => c.id === chatId);
  if (chat) {
    chat.title = title;
    saveChats(chats);
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('chat-renamed', { chatId, title });
  }
  return true;
});

// ── Auto Update ─────────────────────────────────────────────
let _updateInfo = null;
let _autoUpdater = null;

try {
  _autoUpdater = require('electron-updater').autoUpdater;
  _autoUpdater.autoDownload = false;
  _autoUpdater.setFeedURL({ provider: 'github', owner: 'zxkopen123', repo: 'deepagent' });
} catch (_) { /* electron-updater 未安装，更新功能不可用 */ }

function initAutoUpdater() {
  if (!_autoUpdater) return;

  _autoUpdater.on('checking-for-update', () => {
    if (mainWindow && !mainWindow.isDestroyed())
      mainWindow.webContents.send('update-status', { status: 'checking', message: '正在检查更新...' });
  });

  _autoUpdater.on('update-available', (info) => {
    _updateInfo = info;
    if (mainWindow && !mainWindow.isDestroyed())
      mainWindow.webContents.send('update-status', { status: 'available', version: info.version, releaseNotes: info.releaseNotes || '', currentVersion: app.getVersion() });
  });

  _autoUpdater.on('update-not-available', () => {
    if (mainWindow && !mainWindow.isDestroyed())
      mainWindow.webContents.send('update-status', { status: 'not-available', message: '已是最新版本' });
  });

  _autoUpdater.on('download-progress', (progress) => {
    if (mainWindow && !mainWindow.isDestroyed())
      mainWindow.webContents.send('update-status', { status: 'downloading', percent: progress.percent, bytesPerSecond: progress.bytesPerSecond, total: progress.total, transferred: progress.transferred });
  });

  _autoUpdater.on('update-downloaded', (info) => {
    if (mainWindow && !mainWindow.isDestroyed())
      mainWindow.webContents.send('update-status', { status: 'downloaded', version: info.version });
  });

  _autoUpdater.on('error', (err) => {
    if (mainWindow && !mainWindow.isDestroyed())
      mainWindow.webContents.send('update-status', { status: 'error', message: err.message });
  });
}

ipcMain.handle('check-for-updates', () => {
  if (!_autoUpdater) return { available: false, error: '更新功能不可用（electron-updater 未安装）' };
  _autoUpdater.checkForUpdates();
  return { available: false, checking: true };
});

ipcMain.handle('download-update', () => {
  if (!_autoUpdater || !_updateInfo) return { error: '没有可下载的更新' };
  _autoUpdater.downloadUpdate();
  return { downloading: true };
});

ipcMain.handle('install-update', () => {
  if (!_autoUpdater) return { error: '更新功能不可用' };
  setImmediate(() => _autoUpdater.quitAndInstall());
  return { installing: true };
});

// ══════════════════════════════════════════════════════════════
//  MCP 协议插件系统
// ══════════════════════════════════════════════════════════════

const MCP_CONFIG_PATH = path.join(require('os').homedir(), '.deepagent', 'mcp.json');

class MCPServer {
  constructor(name, command, args, env) {
    this.name = name;
    this.command = command;
    this.args = args || [];
    this.env = env || {};
    this.tools = [];
    this.child = null;
    this.pending = new Map();
    this._seq = 0;
    this.started = false;
    this.error = null;
  }

  async start() {
    return new Promise((resolve) => {
      try {
        this.child = require('child_process').spawn(this.command, this.args, {
          stdio: ['pipe', 'pipe', 'pipe'],
          env: { ...process.env, ...this.env },
        });

        let buffer = '';
        this.child.stdout.on('data', (data) => {
          buffer += data.toString();
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const msg = JSON.parse(line);
              const pending = this.pending.get(msg.id);
              if (pending) { clearTimeout(pending.timer); this.pending.delete(msg.id); pending.resolve(msg); }
            } catch(_) {}
          }
        });

        this.child.stderr.on('data', (data) => {
          if (!this.started) this.error = data.toString().slice(0, 200);
        });

        this.child.on('error', (err) => { this.error = err.message; this.started = true; resolve(); });
        this.child.on('exit', () => { this.started = false; });

        // 发送 tools/list 获取工具列表
        this._request('tools/list', {}).then((msg) => {
          if (msg && msg.result && msg.result.tools) {
            this.tools = msg.result.tools;
          }
          this.started = true;
          resolve();
        }).catch(() => { this.started = true; resolve(); });

        // 超时处理
        setTimeout(() => { if (!this.started) { this.started = true; resolve(); } }, 5000);
      } catch (err) {
        this.error = err.message;
        this.started = true;
        resolve();
      }
    });
  }

  async callTool(name, args) {
    const result = await this._request('tools/call', { name, arguments: args });
    return result?.result || { error: '无响应' };
  }

  _request(method, params) {
    return new Promise((resolve, reject) => {
      const id = ++this._seq;
      const msg = JSON.stringify({ jsonrpc: '2.0', method, params, id }) + '\n';
      const timer = setTimeout(() => { this.pending.delete(id); resolve(null); }, 30000);
      this.pending.set(id, { resolve, timer });
      try { this.child.stdin.write(msg); } catch(_) { clearTimeout(timer); this.pending.delete(id); resolve(null); }
    });
  }

  stop() {
    if (this.child) { try { this.child.kill(); } catch(_) {} this.child = null; }
  }
}

let mcpServers = [];

async function loadMCPServers() {
  // 停止旧服务器
  mcpServers.forEach(s => s.stop());
  mcpServers = [];

  if (!fs.existsSync(MCP_CONFIG_PATH)) return [];
  try {
    const config = JSON.parse(fs.readFileSync(MCP_CONFIG_PATH, 'utf-8'));
    for (const [name, cfg] of Object.entries(config.servers || {})) {
      const server = new MCPServer(name, cfg.command, cfg.args || [], cfg.env || {});
      await server.start();
      mcpServers.push(server);
    }
  } catch (err) {
    console.error('[MCP] 加载失败:', err.message);
  }
  return mcpServers;
}

function getAllMCPTools() {
  const tools = [];
  mcpServers.forEach(server => {
    server.tools.forEach(t => {
      tools.push({
        ...t,
        _mcpServer: server.name,
        type: 'function',
        function: {
          name: t.name,
          description: t.description || `${server.name} 提供的外部工具`,
          parameters: t.inputSchema || { type: 'object', properties: {} },
        },
      });
    });
  });
  return tools;
}

// MCP IPC
ipcMain.handle('get-mcp-status', () => {
  return mcpServers.map(s => ({ name: s.name, tools: s.tools.length, started: s.started, error: s.error }));
});

ipcMain.handle('reload-mcp', async () => {
  await loadMCPServers();
  return mcpServers.map(s => ({ name: s.name, tools: s.tools.length, started: s.started, error: s.error }));
});

ipcMain.handle('toggle-builtin-mcp', async (_, { plugin, enabled }) => {
  try {
    const mcpPath = path.join(require('os').homedir(), '.deepagent', 'mcp.json');
    let config = { servers: {} };
    if (fs.existsSync(mcpPath)) config = JSON.parse(fs.readFileSync(mcpPath, 'utf-8'));

    if (enabled) {
      config.servers[plugin] = { command: 'node', args: [path.join(__dirname, 'mcp-plugins', `${plugin}-mcp.js`)] };
    } else {
      delete config.servers[plugin];
    }
    fs.writeFileSync(mcpPath, JSON.stringify(config, null, 2));
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ══════════════════════════════════════════════════════════════
//  CODE REVIEW
// ══════════════════════════════════════════════════════════════

ipcMain.handle('code-review-diff', async (_, { repoPath } = {}) => {
  try {
    const cwd = repoPath || process.cwd();
    const { execSync } = require('child_process');
    const status = execSync('git status --short', { cwd, encoding: 'utf-8', maxBuffer: 1024 * 1024 }).toString();
    if (!status.trim()) return { diff: '', status: '无变更' };
    const diff = execSync('git diff --unified=5', { cwd, encoding: 'utf-8', maxBuffer: 1024 * 1024 }).toString();
    return { diff: diff || '无变更', status: status.trim(), files: status.split('\n').filter(Boolean).length };
  } catch (err) {
    return { error: `Git 操作失败: ${err.message.slice(0, 200)}。请确保在 Git 仓库中执行。` };
  }
});

// ══════════════════════════════════════════════════════════════
//  CLOUD SYNC — GitHub Gist
// ══════════════════════════════════════════════════════════════

function getSyncGistId() {
  try { return fs.readFileSync(SYNC_GIST_ID_PATH, 'utf-8').trim(); } catch(_) { return ''; }
}
function saveSyncGistId(id) { fs.writeFileSync(SYNC_GIST_ID_PATH, id, 'utf-8'); }

function githubApi(token, methodPath, body) {
  return new Promise((resolve) => {
    const [method, path] = methodPath.split(' ');
    const opts = {
      hostname: 'api.github.com', path, method,
      headers: { 'Authorization': `Bearer ${token}`, 'User-Agent': 'deepagent', 'Content-Type': 'application/json' },
    };
    const req = require('https').request(opts, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch(_) { resolve({ _raw: data }); } });
    });
    req.on('error', (err) => resolve({ error: err.message }));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

ipcMain.handle('sync-upload', async () => {
  try {
    const config = loadConfig();
    const token = config.syncToken;
    if (!token) return { success: false, error: '未配置 Token' };

    const safeConfig = { ...config };
    delete safeConfig.apiKey; delete safeConfig.syncToken; delete safeConfig.ttsAk; delete safeConfig.ttsSk;
    delete safeConfig.ttsElevenKey; delete safeConfig.searchApiKey;

    const files = {
      'chats.json': { content: fs.existsSync(CHATS_PATH) ? fs.readFileSync(CHATS_PATH, 'utf-8') : '[]' },
      'config.json': { content: JSON.stringify(safeConfig, null, 2) },
      'memory.md': { content: fs.existsSync(MEMORY_PATH) ? fs.readFileSync(MEMORY_PATH, 'utf-8') : '' },
    };

    let gistId = getSyncGistId();
    if (gistId) {
      const res = await githubApi(token, `PATCH /gists/${gistId}`, { files });
      if (res.error) return { success: false, error: res.error };
    } else {
      const res = await githubApi(token, 'POST /gists', { description: 'DeepAgent Sync', files, public: false });
      if (res.error) return { success: false, error: res.error };
      if (res.id) saveSyncGistId(res.id);
    }
    return { success: true, time: Date.now() };
  } catch (err) { return { success: false, error: err.message }; }
});

ipcMain.handle('sync-download', async () => {
  try {
    const config = loadConfig();
    const token = config.syncToken;
    if (!token) return { success: false, error: '未配置 Token' };

    let gistId = getSyncGistId();
    if (!gistId) return { success: false, error: '未找到同步数据，请先上传' };

    const res = await githubApi(token, `GET /gists/${gistId}`);
    if (res.error) return { success: false, error: res.error };

    const files = res.files || {};
    if (files['chats.json']?.content) fs.writeFileSync(CHATS_PATH, files['chats.json'].content, 'utf-8');
    if (files['memory.md']?.content) fs.writeFileSync(MEMORY_PATH, files['memory.md'].content, 'utf-8');

    return { success: true, time: Date.now() };
  } catch (err) { return { success: false, error: err.message }; }
});

// ══════════════════════════════════════════════════════════════
//  RAG 知识库
// ══════════════════════════════════════════════════════════════

const RAG_PATH = path.join(require('os').homedir(), '.deepagent', 'knowledge');
if (!fs.existsSync(RAG_PATH)) fs.mkdirSync(RAG_PATH, { recursive: true });

ipcMain.handle('list-knowledge', () => {
  try {
    return fs.readdirSync(RAG_PATH).map(f => {
      const stat = fs.statSync(path.join(RAG_PATH, f));
      return { id: f, name: f, size: stat.size, date: stat.mtime.toISOString() };
    }).sort((a, b) => b.date.localeCompare(a.date));
  } catch (_) { return []; }
});

ipcMain.handle('upload-knowledge', async (_, filePath) => {
  try {
    const srcPath = path.resolve(filePath);
    const name = path.basename(srcPath);
    const dest = path.join(RAG_PATH, name);
    fs.copyFileSync(srcPath, dest);
    return { success: true, name };
  } catch (err) { return { error: err.message }; }
});

ipcMain.handle('delete-knowledge', (_, name) => {
  try { fs.unlinkSync(path.join(RAG_PATH, name)); return { success: true }; }
  catch (err) { return { error: err.message }; }
});

ipcMain.handle('search-knowledge', (_, keyword) => {
  if (!keyword) return [];
  const results = [];
  try {
    const files = fs.readdirSync(RAG_PATH);
    for (const file of files) {
      const fullPath = path.join(RAG_PATH, file);
      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (results.length >= 10) break;
          if (lines[i].toLowerCase().includes(keyword.toLowerCase())) {
            results.push({ file, line: i + 1, text: lines[i].trim().slice(0, 200) });
          }
        }
      } catch(_) {}
      if (results.length >= 10) break;
    }
  } catch(_) {}
  return results;
});

// ══════════════════════════════════════════════════════════════
//  WORKSPACE 管理
// ══════════════════════════════════════════════════════════════

const WORKSPACE_PATH = path.join(require('os').homedir(), '.deepagent', 'workspaces.json');

function loadWorkspaces() {
  try { return JSON.parse(fs.readFileSync(WORKSPACE_PATH, 'utf-8')); }
  catch(_) { return { workspaces: [{ name: 'Home', path: require('os').homedir() }], active: 0 }; }
}

function saveWorkspaces(data) { fs.writeFileSync(WORKSPACE_PATH, JSON.stringify(data, null, 2), 'utf-8'); }

ipcMain.handle('get-workspaces', () => loadWorkspaces());

ipcMain.handle('add-workspace', (_, { name, path: wsPath }) => {
  const data = loadWorkspaces();
  data.workspaces.push({ name, path: path.resolve(wsPath) });
  saveWorkspaces(data);
  return data;
});

ipcMain.handle('remove-workspace', (_, idx) => {
  const data = loadWorkspaces();
  if (idx >= 0 && idx < data.workspaces.length) {
    data.workspaces.splice(idx, 1);
    if (data.active >= data.workspaces.length) data.active = 0;
    saveWorkspaces(data);
  }
  return data;
});

ipcMain.handle('set-active-workspace', (_, idx) => {
  const data = loadWorkspaces();
  if (idx >= 0 && idx < data.workspaces.length) { data.active = idx; saveWorkspaces(data); }
  return data;
});

// macOS 菜单适配
if (process.platform === 'darwin') {
  try {
    const macTemplate = [
      { role: 'appMenu', label: 'DeepAgent' },
      { role: 'fileMenu' }, { role: 'editMenu' },
      { role: 'viewMenu' }, { role: 'windowMenu' },
    ];
    Menu.setApplicationMenu(Menu.buildFromTemplate(macTemplate));
  } catch(_) {}
}

app.whenReady().then(() => {
  initMemory();
  setMenu('zh');
  initAutoUpdater();
  loadMCPServers(); // 异步加载 MCP
  createWindow();
  initAutoUpdater();
  createWindow();
  // 启动后延迟3秒检查更新
  if (_autoUpdater) {
    setTimeout(() => {
      try { _autoUpdater.checkForUpdates(); } catch(_) {}
    }, 3000);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('will-quit', () => {
  mcpServers.forEach(s => s.stop());
  if (terminalProcess) { terminalProcess.kill(); terminalProcess = null; }
});

// ── IPC: Config & Chats ─────────────────────────────────────
ipcMain.handle('get-config', () => loadConfig());
ipcMain.handle('save-config', (_, config) => {
  saveConfig(config);
  if (config.theme) nativeTheme.themeSource = config.theme === 'dark' ? 'dark' : 'light';
  return true;
});
ipcMain.handle('get-chats', () => loadChats());
ipcMain.handle('save-chats', (_, chats) => { saveChats(chats); return true; });
ipcMain.handle('delete-chat', (_, id) => {
  const chats = loadChats();
  saveChats(chats.filter(c => c.id !== id));
  return true;
});
ipcMain.handle('update-chat', (_, updatedChat) => {
  const chats = loadChats();
  const idx = chats.findIndex(c => c.id === updatedChat.id);
  if (idx >= 0) { chats[idx] = updatedChat; }
  else { chats.unshift(updatedChat); }
  saveChats(chats);
  return true;
});

// ══════════════════════════════════════════════════════════════
//  TOOL DEFINITIONS & HANDLERS
// ══════════════════════════════════════════════════════════════

const TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: '读取指定文件的完整内容。适用于查看源代码、配置文件、日志等文本文件。',
      parameters: {
        type: 'object',
        properties: { path: { type: 'string', description: '要读取的文件路径（绝对路径或相对工作目录）' } },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'write_file',
      description: '创建新文件或覆盖已有文件。如果文件已存在且不为空，优先使用 edit_file。',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: '文件路径' },
          content: { type: 'string', description: '要写入的文件内容' },
        },
        required: ['path', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'edit_file',
      description: '在已有文件中查找精确字符串并替换为新字符串。适用于修改文件中的特定部分。注意：old_string 必须在文件中精确唯一匹配。',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: '文件路径' },
          old_string: { type: 'string', description: '要被替换的精确文本（必须唯一匹配）' },
          new_string: { type: 'string', description: '替换后的新文本' },
        },
        required: ['path', 'old_string', 'new_string'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'run_command',
      description: '在 Windows PowerShell 终端中执行命令。适用于运行脚本、编译代码、启动服务、安装依赖等。命令在项目目录下执行。超时30秒。',
      parameters: {
        type: 'object',
        properties: {
          command: { type: 'string', description: '要执行的 PowerShell 命令' },
          cwd: { type: 'string', description: '工作目录（可选，默认为用户目录）' },
        },
        required: ['command'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'glob_files',
      description: '按 glob 模式搜索文件名。例如 "**/*.js" 查找所有 JS 文件，"src/**/*.ts" 查找 src 下所有 TS 文件。',
      parameters: {
        type: 'object',
        properties: {
          pattern: { type: 'string', description: 'Glob 搜索模式，如 "**/*.py"' },
          path: { type: 'string', description: '搜索起始目录（可选，默认用户目录）' },
        },
        required: ['pattern'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'grep_search',
      description: '在文件内容中搜索匹配的文本。使用正则表达式搜索，支持按文件类型过滤。',
      parameters: {
        type: 'object',
        properties: {
          pattern: { type: 'string', description: '搜索的正则表达式模式' },
          glob: { type: 'string', description: '文件过滤模式，如 "*.js" 只搜索 JS 文件' },
          path: { type: 'string', description: '搜索目录（可选，默认用户目录）' },
        },
        required: ['pattern'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'web_fetch',
      description: '获取网页内容并转为纯文本。适用于阅读文档、查看网页信息等。返回文本摘要。',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: '要获取的网页 URL' },
        },
        required: ['url'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'download_media',
      description: '从 TikTok/YouTube/Bilibili 等网站下载视频并提取音频（MP3）。使用 yt-dlp 工具。首次使用会自动安装 yt-dlp。',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: '视频链接（支持 TikTok, YouTube, Bilibili 等数百个网站）' },
          extract_audio: { type: 'boolean', description: '是否提取音频（默认 true）' },
        },
        required: ['url'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'analyze_image',
      description: '分析图片内容。支持 PNG/JPG/WEBP 格式。可以识别截图、照片、图表、设计稿等。',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: '图片文件的本地路径' },
          question: { type: 'string', description: '针对图片提出的问题，如"这张截图里的错误信息是什么"' },
        },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'query_database',
      description: '对 SQLite 数据库执行 SQL 查询。适用于查询数据、分析结果、生成报表等。',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'SQLite 数据库文件的路径' },
          query: { type: 'string', description: '要执行的 SQL 查询语句（如 SELECT * FROM users）' },
        },
        required: ['path', 'query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'read_memory',
      description: '读取长期记忆文件的内容。记忆文件记录了用户的重要信息、偏好和之前的项目上下文。每次对话开始时 AI 会自动读取记忆。',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'write_memory',
      description: '覆写长期记忆文件。当你了解到用户的新的重要信息、偏好变化或需要记录的项目上下文时，更新记忆文件。注意：这是完全覆写，不要丢失已有内容。',
      parameters: {
        type: 'object',
        properties: { content: { type: 'string', description: '完整的记忆文件新内容（包含原有内容+新增内容）' } },
        required: ['content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_knowledge',
      description: '在本地知识库中搜索关键词，返回相关的文档片段。知识库包含用户上传的 TXT/MD/PDF/DOCX 文档。',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string', description: '搜索关键词，如"安装步骤"、"配置方法"' } },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'browser_open',
      description: '在无头浏览器中打开网页，返回页面截图。可用于访问网页、查看登录页面等',
      parameters: { type: 'object', properties: { url: { type: 'string', description: '网页地址' } }, required: ['url'] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'browser_act',
      description: '在已打开的页面中操作：点击、输入、截图、执行JS等',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['click', 'type', 'screenshot', 'evaluate', 'close'] },
          selector: { type: 'string', description: 'CSS 选择器（click/type 需要）' },
          value: { type: 'string', description: '输入的文字（type 需要）' },
          script: { type: 'string', description: '要执行的 JS 代码（evaluate 需要）' },
        },
        required: ['action'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'desktop_act',
      description: '操作桌面：移动鼠标、点击、键盘输入、截取屏幕。可以控制任何桌面应用。仅 Windows 可用。',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['click', 'doubleclick', 'rightclick', 'type', 'keypress', 'mousemove', 'screenshot'] },
          x: { type: 'number', description: '屏幕 x 坐标' },
          y: { type: 'number', description: '屏幕 y 坐标' },
          text: { type: 'string', description: '要输入的文字' },
          key: { type: 'string', description: '按下的按键（如 Enter, Escape, Tab）' },
        },
        required: ['action'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'transcribe_audio',
      description: '将音频文件（MP3/WAV）转为文字。使用 Whisper 进行语音识别。支持中文、英文等数十种语言。',
      parameters: {
        type: 'object',
        properties: {
          audio_path: { type: 'string', description: '音频文件的本地路径' },
          language: { type: 'string', description: '音频语言（可选，如 "zh" 中文、"en" 英文，留空自动检测）' },
        },
        required: ['audio_path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'web_search',
      description: '在互联网上搜索信息。返回搜索结果列表（标题+链接+摘要）。可以搜索最新新闻、文档、教程等任何公开信息。',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: '搜索关键词，支持中文（如 "Python教程 2025"）' },
          max_results: { type: 'number', description: '返回结果数量，默认 8，最多 15' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'git_status',
      description: '显示当前 Git 仓库的工作区状态。查看哪些文件被修改、暂存或未跟踪。需要在 Git 仓库目录下执行。',
      parameters: {
        type: 'object',
        properties: { path: { type: 'string', description: 'Git 仓库路径（可选，默认当前工作目录）' } },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'git_diff',
      description: '显示 Git 工作区与暂存区/HEAD 的差异。查看具体改动了哪些代码。',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Git 仓库路径（可选）' },
          staged: { type: 'boolean', description: '是否显示已暂存的变更（默认 false）' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'git_log',
      description: '查看 Git 提交历史。显示最近的提交记录，包括作者、日期和提交信息。',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Git 仓库路径（可选）' },
          max_count: { type: 'number', description: '显示的提交数量，默认 10，最多 50' },
          author: { type: 'string', description: '按作者筛选（可选）' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'git_commit',
      description: '暂存所有变更并创建新的 Git 提交。自动 stage 所有修改和新增文件，然后提交。注意：不会提交未跟踪的新文件，需要先用 git_add 添加。',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Git 仓库路径（可选）' },
          message: { type: 'string', description: '提交信息。使用中文描述改动了什么以及为什么改动' },
          files: { type: 'string', description: '要暂存的文件路径（空格分隔），留空则暂存所有已修改文件' },
        },
        required: ['message'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'git_push',
      description: '将本地提交推送到远程仓库。默认推送到当前分支的 upstream 分支。',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Git 仓库路径（可选）' },
          remote: { type: 'string', description: '远程仓库名（可选，默认 origin）' },
          branch: { type: 'string', description: '分支名（可选，默认当前分支）' },
          force: { type: 'boolean', description: '是否强制推送（默认 false，谨慎使用）' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'git_pull',
      description: '从远程仓库拉取最新变更并合并到当前分支。',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Git 仓库路径（可选）' },
          remote: { type: 'string', description: '远程仓库名（可选，默认 origin）' },
          branch: { type: 'string', description: '分支名（可选，默认当前分支）' },
          rebase: { type: 'boolean', description: '是否使用 rebase 替代 merge（默认 false）' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'git_branch',
      description: '列出/创建/切换 Git 分支。不传 branch_name 时列出所有分支。',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Git 仓库路径（可选）' },
          branch_name: { type: 'string', description: '分支名。传此参数会创建并切换到新分支' },
          delete: { type: 'boolean', description: '是否删除指定分支（默认 false）' },
        },
      },
    },
  },
];

// ── Tool Handlers ───────────────────────────────────────────

const toolHandlers = {
  async read_file({ path: filePath }) {
    const resolved = path.resolve(filePath);
    if (!fs.existsSync(resolved)) return { error: `文件不存在: ${resolved}` };
    const stat = fs.statSync(resolved);
    if (stat.size > 1024 * 1024) return { error: '文件超过 1MB，无法读取' };
    const content = fs.readFileSync(resolved, 'utf-8');
    return { content, lines: content.split('\n').length };
  },

  async write_file({ path: filePath, content }) {
    const resolved = path.resolve(filePath);
    const dir = path.dirname(resolved);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(resolved, content, 'utf-8');
    const stat = fs.statSync(resolved);
    return { success: true, size: stat.size, path: resolved };
  },

  async edit_file({ path: filePath, old_string, new_string }) {
    const resolved = path.resolve(filePath);
    if (!fs.existsSync(resolved)) return { error: `文件不存在: ${resolved}` };
    const content = fs.readFileSync(resolved, 'utf-8');
    if (!content.includes(old_string)) return { error: '未找到匹配的 old_string，请确保精确匹配' };
    // 替换所有匹配（全局替换）
    const newContent = content.split(old_string).join(new_string);
    const count = (content.match(new RegExp(old_string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    fs.writeFileSync(resolved, newContent, 'utf-8');
    return { success: true, replaced: old_string.length, occurrences: count, path: resolved };
  },

  async run_command({ command, cwd }) {
    // 这个 handler 会被 conversationLoop 调用,
    // 如果 event.sender 可用则流式输出到 terminal-panel
    const execCmd = command;
    return new Promise((resolve) => {
      const options = {
        cwd: cwd ? path.resolve(cwd) : detectProjectRoot(process.cwd()),
        timeout: 60000,
        maxBuffer: 1024 * 1024,
        env: { ...process.env, TERM: 'xterm-256color' },
      };
      // Use spawn for streaming output
      const child = require('child_process').spawn(
        process.env.COMSPEC || 'powershell.exe',
        ['-NoLogo', '-Command', execCmd],
        { ...options, shell: false }
      );

      let stdout = '', stderr = '';

      child.stdout.on('data', (data) => {
        const chunk = data.toString();
        stdout += chunk;
        if (globalStreamSender) {
          globalStreamSender('command-output', chunk);
        }
      });

      child.stderr.on('data', (data) => {
        const chunk = data.toString();
        stderr += chunk;
        if (globalStreamSender) {
          globalStreamSender('command-output', chunk);
        }
      });

      const timeout = command.includes('npm install') || command.includes('pip install') || command.includes('yarn install') ? 300000 : 60000;
      let timer = setTimeout(() => {
        try { child.kill(); } catch(_) {}
        resolve({ exitCode: -1, error: `命令执行超时（${timeout/1000}秒）`, stdout, stderr: stderr.slice(0, 5000) });
      }, timeout);

      child.on('error', (err) => {
        clearTimeout(timer);
        resolve({ exitCode: 1, error: err.message.slice(0, 500), stdout, stderr: stderr.slice(0, 5000) });
      });

      child.on('close', (code) => {
        clearTimeout(timer);
        notifyUser('DeepAgent', `命令已${code === 0 ? '完成' : '退出 (代码: '+code+')'}：${command.slice(0, 50)}`);
        resolve({ exitCode: code || 0, stdout: stdout.slice(0, 50000), stderr: stderr.slice(0, 5000) });
      });
    });
  },

  async glob_files({ pattern, path: searchPath }) {
    const searchDir = searchPath ? path.resolve(searchPath) : process.cwd();
    // 使用 Node.js 递归遍历（比 PowerShell 管道可靠）
    const results = [];
    const isMatch = (name) => {
      // 简单 glob 匹配: * 匹配任意, ? 匹配单个
      const reStr = '^' + pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$';
      try { return new RegExp(reStr, 'i').test(name); } catch(_) { return name.includes(pattern.replace(/\*/g, '')); }
    };
    const walk = (dir) => {
      if (results.length >= 500) return;
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const e of entries) {
          if (e.name.startsWith('.') || e.name === 'node_modules') continue;
          const full = path.join(dir, e.name);
          if (e.isDirectory()) walk(full);
          else if (e.isFile() && isMatch(e.name)) results.push(full);
          if (results.length >= 500) break;
        }
      } catch(_) {}
    };
    try { walk(searchDir); } catch(_) {}
    return { files: results.slice(0, 500), count: results.length, directory: searchDir };
  },

  async grep_search({ pattern, glob: fileGlob, path: searchPath }) {
    const searchDir = searchPath ? path.resolve(searchPath) : process.cwd();
    const results = [];
    let regex;
    try { regex = new RegExp(pattern, 'gi'); } catch(_) { regex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'); }

    const walk = (dir) => {
      if (results.length >= 100) return;
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const e of entries) {
          if (e.name.startsWith('.') || e.name === 'node_modules') continue;
          const full = path.join(dir, e.name);
          if (e.isDirectory()) { walk(full); continue; }
          if (fileGlob) {
            const gRe = new RegExp('^' + fileGlob.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$', 'i');
            if (!gRe.test(e.name)) continue;
          }
          try {
            const content = fs.readFileSync(full, 'utf-8');
            const lines = content.split('\n');
            for (let i = 0; i < lines.length && results.length < 100; i++) {
              if (regex.test(lines[i])) {
                const line = lines[i].trim().slice(0, 200);
                results.push({ file: full, line: i + 1, text: line });
              }
            }
          } catch(_) {}
        }
      } catch(_) {}
    };
    try { walk(searchDir); } catch(_) {}
    return { results: results.slice(0, 100), count: results.length, pattern };
  },

  async web_fetch({ url }) {
    const MAX_RETRIES = 2;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
        const text = await response.text();
        const titleMatch = text.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim() : '';

        // SPA 页面内容提取：尝试常见的嵌入式数据模式
        let spaContent = '';
        const patterns = [
          /window\.__NUXT__\s*=\s*({[\s\S]*?});/,
          /window\.__NEXT_DATA__\s*=\s*({[\s\S]*?});/,
          /window\.__INITIAL_STATE__\s*=\s*({[\s\S]*?});/,
          /window\.__PRELOADED_STATE__\s*=\s*({[\s\S]*?});/,
          /window\.__APOLLO_STATE__\s*=\s*({[\s\S]*?});/,
          /<script id="__NEXT_DATA__"[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/,
          /<script id="__NUXT_DATA__"[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/,
          /<script id="__INITIAL_STATE__"[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/,
        ];
        for (const re of patterns) {
          const m = text.match(re);
          if (m) {
            try {
              const data = JSON.parse(m[1]);
              const extractText = (obj) => {
                if (!obj) return '';
                if (typeof obj === 'string') return obj + ' ';
                if (Array.isArray(obj)) return obj.map(extractText).join(' ');
                if (typeof obj === 'object') return Object.values(obj).map(extractText).join(' ');
                return '';
              };
              spaContent = extractText(data).slice(0, 5000);
            } catch(_) {}
            break;
          }
        }

        // 提取正文
        let body = text
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
          .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
          .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&[a-z]+;/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        // 如果 SPA 内容比 HTML 正文更丰富，优先使用 SPA 内容
        if (spaContent && spaContent.length > body.length * 0.5) {
          body = spaContent;
        }

        // 提取可见链接
        const links = [];
        const linkRe = /<a[^>]*href="(https?:\/\/[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
        let m;
        const textSansNoise = text
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
          .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
          .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '');
        while ((m = linkRe.exec(textSansNoise)) !== null && links.length < 20) {
          links.push({ url: m[1], text: m[2].replace(/<[^>]+>/g, '').trim().slice(0, 100) });
        }

        return { content: body.slice(0, 10000), title, links: links.slice(0, 10), chars: body.length, url, spa: !!spaContent };
      } catch (err) {
        if (attempt < MAX_RETRIES) continue;
        return { error: `获取失败: ${err.message}` };
      }
    }
  },

  async web_search({ query, max_results }) {
    const limit = Math.min(max_results || 8, 15);
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0';

    // 优先使用配置的搜索 API key
    if (globalSearchProvider === 'serpapi' && globalSearchApiKey) {
      try {
        const url = `https://serpapi.com/search?q=${encodeURIComponent(query)}&api_key=${globalSearchApiKey}&engine=google`;
        const resp = await fetch(url, { signal: AbortSignal.timeout(10000) });
        const data = await resp.json();
        if (data.organic_results) {
          return { results: data.organic_results.slice(0, limit).map(r => ({ title: r.title, url: r.link, snippet: r.snippet })), source: 'serpapi' };
        }
      } catch(_) {}
    }
    if (globalSearchProvider === 'bing' && globalSearchApiKey) {
      try {
        const url = `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}&count=${limit}`;
        const resp = await fetch(url, { signal: AbortSignal.timeout(10000), headers: { 'Ocp-Apim-Subscription-Key': globalSearchApiKey } });
        const data = await resp.json();
        if (data.webPages?.value) {
          return { results: data.webPages.value.slice(0, limit).map(r => ({ title: r.name, url: r.url, snippet: r.snippet })), source: 'bing-api' };
        }
      } catch(_) {}
    }

    // 降级：HTML 解析

    async function tryBing() {
      const url = `https://www.bing.com/search?q=${encodeURIComponent(query)}&setlang=zh-Hans`;
      const resp = await fetch(url, { signal: AbortSignal.timeout(10000), headers: { 'User-Agent': ua } });
      const html = await resp.text();
      const results = [];
      // Bing 新版/旧版两种结构都试
      const patterns = [
        /<h2>[^]*?<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/gi,
        /<li class="b_algo">[\s\S]*?<h2><a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/gi,
      ];
      for (const re of patterns) {
        let m; results.length = 0;
        while ((m = re.exec(html)) !== null && results.length < limit) {
          results.push({ title: m[2].replace(/<[^>]+>/g, '').trim(), url: m[1], snippet: (m[3]||'').replace(/<[^>]+>/g, '').trim() });
        }
        if (results.length > 0) break;
      }
      // 再试备用解析：从搜索结果 div 提取
      if (results.length === 0) {
        const backupRe = /<a[^>]*href="(https?:\/\/[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
        let m;
        while ((m = backupRe.exec(html)) !== null && results.length < limit) {
          if (m[1].includes('bing.com') || m[1].includes('microsoft.com')) continue;
          results.push({ title: m[2].replace(/<[^>]+>/g, '').trim(), url: m[1], snippet: '' });
        }
      }
      return results.length > 0 ? { results, source: 'bing' } : null;
    }

    async function tryDuckDuckGo() {
      const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`;
      const resp = await fetch(url, { signal: AbortSignal.timeout(10000) });
      const data = await resp.json();
      const results = [];
      if (data.AbstractText) results.push({ title: data.Heading || query, url: data.AbstractURL || '', snippet: data.AbstractText });
      if (data.RelatedTopics) {
        for (const t of data.RelatedTopics) {
          if (t.Text && results.length < limit) results.push({ title: t.Text.split(' - ')[0] || query, url: t.FirstURL || '', snippet: t.Text });
          if (t.Topics) t.Topics.forEach(st => { if (st.Text && results.length < limit) results.push({ title: st.Text.split(' - ')[0] || query, url: st.FirstURL || '', snippet: st.Text }); });
        }
      }
      return results.length > 0 ? { results, source: 'duckduckgo' } : null;
    }

    // 先 Bing 再 DuckDuckGo
    let result = await tryBing().catch(() => null);
    if (!result) result = await tryDuckDuckGo().catch(() => null);
    return result || { results: [], note: '未找到结果，可尝试调整搜索词' };
  },

  async git_status({ path: repoPath }) {
    const cwd = repoPath ? path.resolve(repoPath) : process.cwd();
    return runGitCommand(['status', '--short', '--branch'], cwd);
  },

  async git_diff({ path: repoPath, staged }) {
    const cwd = repoPath ? path.resolve(repoPath) : process.cwd();
    const args = ['diff'];
    if (staged) args.push('--staged');
    return runGitCommand(args, cwd);
  },

  async git_log({ path: repoPath, max_count, author }) {
    const cwd = repoPath ? path.resolve(repoPath) : process.cwd();
    const count = Math.min(max_count || 10, 50);
    const args = ['log', `--max-count=${count}`, '--format=%H|%an|%ad|%s', '--date=short'];
    if (author) args.push(`--author=${author}`);
    const result = await runGitCommand(args, cwd);
    if (result.stdout) {
      const commits = result.stdout.split('\n').filter(Boolean).map(line => {
        const [hash, author, date, ...msgParts] = line.split('|');
        return { hash: hash?.slice(0, 8), author, date, message: msgParts.join('|') };
      });
      return { commits, count: commits.length };
    }
    return result;
  },

  async git_commit({ path: repoPath, message, files }) {
    const cwd = repoPath ? path.resolve(repoPath) : process.cwd();
    // Stage files or all
    if (files) {
      const files_list = files.split(/\s+/).filter(Boolean);
      for (const f of files_list) {
        await runGitCommand(['add', f], cwd);
      }
    } else {
      await runGitCommand(['add', '-u'], cwd);
    }
    // Check if there's anything to commit
    const status = await runGitCommand(['status', '--short'], cwd);
    if (!status.stdout?.trim()) {
      return { error: '没有需要提交的变更', note: '文件没有修改或已全部提交' };
    }
    return runGitCommand(['commit', '-m', message], cwd);
  },

  async git_push({ path: repoPath, remote, branch, force }) {
    const cwd = repoPath ? path.resolve(repoPath) : process.cwd();
    const args = ['push'];
    if (remote) args.push(remote);
    if (branch) args.push(branch);
    if (force) args.push('--force');
    return runGitCommand(args, cwd);
  },

  async git_pull({ path: repoPath, remote, branch, rebase }) {
    const cwd = repoPath ? path.resolve(repoPath) : process.cwd();
    const args = ['pull'];
    if (rebase) args.push('--rebase');
    if (remote) args.push(remote);
    if (branch) args.push(branch);
    return runGitCommand(args, cwd);
  },

  async git_branch({ path: repoPath, branch_name, delete: del }) {
    const cwd = repoPath ? path.resolve(repoPath) : process.cwd();
    if (branch_name && del) {
      return runGitCommand(['branch', '-D', branch_name], cwd);
    } else if (branch_name) {
      // Create and switch to new branch
      const result = await runGitCommand(['checkout', '-b', branch_name], cwd);
      return result;
    } else {
      // List branches
      const result = await runGitCommand(['branch', '-a'], cwd);
      if (result.stdout) {
        const branches = result.stdout.split('\n').filter(Boolean).map(b => b.trim());
        return { branches, current: branches.find(b => b.startsWith('*'))?.replace('* ', '') || '' };
      }
      return result;
    }
  },

  async download_media({ url, extract_audio }) {
    const mediaDir = path.join(userDataPath, 'media');
    if (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir, { recursive: true });

    // Check if yt-dlp is available
    const ytDlpPath = path.join(mediaDir, 'yt-dlp.exe');
    let hasYtDlp = fs.existsSync(ytDlpPath);

    if (!hasYtDlp) {
      // Try PATH first
      const which = require('child_process').execSync('where yt-dlp 2>nul || echo notfound', { timeout: 3000 }).toString().trim();
      hasYtDlp = which && which !== 'notfound' && which.length > 0;
    }

    if (!hasYtDlp) {
      return new Promise((resolve) => {
        // Download yt-dlp.exe automatically
        exec(`powershell -Command "Invoke-WebRequest -Uri 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe' -OutFile '${ytDlpPath}'"`, { timeout: 60000 }, (err) => {
          if (err) {
            resolve({ error: `yt-dlp 下载失败: ${err.message}。请手动下载 https://github.com/yt-dlp/yt-dlp/releases 放到 ${mediaDir}` });
            return;
          }
          resolve(downloadWithYtDlp(ytDlpPath, url, mediaDir, extract_audio !== false));
        });
      });
    }

    return downloadWithYtDlp(hasYtDlp === true ? ytDlpPath : 'yt-dlp', url, mediaDir, extract_audio !== false);
  },

  async search_knowledge({ query }) {
    const results = [];
    try {
      if (!fs.existsSync(RAG_PATH)) return { results: [] };
      const files = fs.readdirSync(RAG_PATH);
      for (const file of files) {
        const fullPath = path.join(RAG_PATH, file);
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const lines = content.split('\n');
          for (let i = 0; i < lines.length; i++) {
            if (results.length >= 10) break;
            if (lines[i].toLowerCase().includes(query.toLowerCase())) {
              results.push({ file, line: i + 1, text: lines[i].trim().slice(0, 300) });
            }
          }
        } catch(_) {}
      }
    } catch(_) {}
    return { results, count: results.length, query };
  },

  async browser_open({ url }) {
    try {
      const { chromium } = require('playwright-core');
      if (!global._browser) global._browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
      if (!global._page) global._page = await global._browser.newPage({ viewport: { width: 1280, height: 720 } });
      await global._page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await global._page.waitForTimeout(1000);
      const screenshot = await global._page.screenshot({ type: 'png', fullPage: false });
      return { screenshot: screenshot.toString('base64'), url, note: '浏览器已打开，可使用 browser_act 继续操作' };
    } catch (err) {
      if (err.code === 'MODULE_NOT_FOUND') return { error: 'Playwright 未安装。请执行: npm install playwright-core && npx playwright install chromium' };
      return { error: `浏览器操作失败: ${err.message.slice(0, 200)}` };
    }
  },

  async browser_act({ action, selector, value, script }) {
    try {
      const pw = require('playwright-core');
      if (!global._page) return { error: '请先使用 browser_open 打开页面' };
      const page = global._page;
      switch (action) {
        case 'click': await page.click(selector, { timeout: 5000 }); break;
        case 'type': await page.fill(selector, value || ''); break;
        case 'screenshot': break;
        case 'evaluate': await page.evaluate(new Function(script || '')); break;
        case 'close': if (global._browser) { await global._browser.close(); global._browser = null; global._page = null; } return { success: true, note: '浏览器已关闭' };
        default: return { error: `未知操作: ${action}` };
      }
      await page.waitForTimeout(500);
      const screenshot = await page.screenshot({ type: 'png', fullPage: false });
      return { screenshot: screenshot.toString('base64'), action, note: '操作已完成' };
    } catch (err) {
      if (err.code === 'MODULE_NOT_FOUND') return { error: 'Playwright 未安装。请执行: npm install playwright-core && npx playwright install chromium' };
      return { error: `${action} 失败: ${err.message.slice(0, 200)}` };
    }
  },

  async desktop_act({ action, x, y, text, key }) {
    try {
      const { execSync } = require('child_process');
      const runPs = (cmd) => execSync(`powershell -NoProfile -Command "${cmd.replace(/"/g, '\\"')}"`, { timeout: 10000, encoding: 'utf-8' });

      switch (action) {
        case 'mousemove':
          runPs(`Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(${x || 0},${y || 0})`);
          return { success: true, note: `鼠标移动到 (${x}, ${y})` };
        case 'click':
          runPs(`Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(${x || 0},${y || 0}); [System.Windows.Forms.SendKeys]::SendWait('{ENTER}')`);
          return { success: true };
        case 'doubleclick':
          runPs(`Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(${x || 0},${y || 0}); 1..2 | % { [System.Windows.Forms.SendKeys]::SendWait('{ENTER}') }`);
          return { success: true };
        case 'rightclick':
          runPs(`Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(${x || 0},${y || 0}); [System.Windows.Forms.SendKeys]::SendWait('+{F10}')`);
          return { success: true };
        case 'type':
          if (text) runPs(`Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('${text.replace(/'/g, "''")}')`);
          return { success: true, note: `输入: ${text}` };
        case 'keypress':
          const keyMap = { enter: '{ENTER}', escape: '{ESC}', tab: '{TAB}', backspace: '{BACKSPACE}', delete: '{DELETE}', up: '{UP}', down: '{DOWN}', left: '{LEFT}', right: '{RIGHT}', home: '{HOME}', end: '{END}', space: ' ' };
          runPs(`Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('${keyMap[(key||'').toLowerCase()] || key}')`);
          return { success: true, note: `按键: ${key}` };
        case 'screenshot':
          const psScript = 'Add-Type -AssemblyName System.Windows.Forms; Add-Type -AssemblyName System.Drawing; $bmp = New-Object System.Drawing.Bitmap([System.Windows.Forms.Screen]::PrimaryScreen.Bounds.Width, [System.Windows.Forms.Screen]::PrimaryScreen.Bounds.Height); $g = [System.Drawing.Graphics]::FromImage($bmp); $g.CopyFromScreen(0, 0, 0, 0, $bmp.Size); $ms = New-Object System.IO.MemoryStream; $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png); Write-Output ([System.Convert]::ToBase64String($ms.ToArray())); $g.Dispose(); $bmp.Dispose(); $ms.Dispose()';
          const b64 = execSync(`powershell -NoProfile -Command "${psScript}"`, { timeout: 30000, maxBuffer: 50*1024*1024, encoding: 'utf-8' }).toString().trim();
          const screenshotLines = b64.split('\n').filter(l => l.length > 100);
          return { screenshot: screenshotLines[0] || '', note: '屏幕截图完成' };
        default:
          return { error: `未知桌面操作: ${action}` };
      }
    } catch (err) {
      return { error: `桌面操作失败: ${err.message.slice(0, 200)}`, note: '桌面自动化仅支持 Windows' };
    }
  },

  async read_memory() {
    return { content: getMemory(), path: MEMORY_PATH };
  },

  async write_memory({ content }) {
    try {
      fs.writeFileSync(MEMORY_PATH, content, 'utf-8');
      const result = { success: true, path: MEMORY_PATH, chars: content.length };
      if (content.length > 3000) {
        result.warning = '记忆文件已超过3000字符，建议让 AI 整理摘要以节省空间';
      }
      return result;
    } catch (err) {
      return { error: `写入记忆失败: ${err.message}` };
    }
  },

  async query_database({ path: dbPath, query }) {
    const resolved = path.resolve(dbPath);
    if (!fs.existsSync(resolved)) return { error: `数据库不存在: ${resolved}` };
    try {
      const sqlite3 = require('sqlite3');
      return new Promise((resolve) => {
        const db = new sqlite3.Database(resolved, sqlite3.OPEN_READONLY, (err) => {
          if (err) return resolve({ error: `打开数据库失败: ${err.message}` });
          db.all(query, [], (err, rows) => {
            db.close();
            if (err) return resolve({ error: `SQL 错误: ${err.message}`, note: '请检查 SQL 语句语法' });
            resolve({ rows: rows.slice(0, 100), count: rows.length, columns: rows.length > 0 ? Object.keys(rows[0]) : [] });
          });
        });
      });
    } catch (err) {
      return { error: `数据库模块未安装。请执行: npm install sqlite3`, detail: err.message };
    }
  },

  async analyze_image({ path: imgPath, question }) {
    // 支持 URL 和本地路径
    if (imgPath.match(/^https?:\/\//)) {
      try {
        const response = await fetch(imgPath, { signal: AbortSignal.timeout(15000) });
        const buffer = Buffer.from(await response.arrayBuffer());
        const contentType = response.headers.get('content-type') || 'image/png';
        if (buffer.length > 20 * 1024 * 1024) return { error: '图片超过20MB，无法处理' };
        const base64 = buffer.toString('base64');
        return { image_data_url: `data:${contentType};base64,${base64}`, format: imgPath.split('.').pop(), size: buffer.length, question: question || '请描述这张图片的内容', source: 'url' };
      } catch (err) {
        return { error: `下载图片失败: ${err.message}` };
      }
    }
    const resolved = path.resolve(imgPath);
    if (!fs.existsSync(resolved)) return { error: `图片不存在: ${resolved}` };
    const stat = fs.statSync(resolved);
    if (stat.size > 20 * 1024 * 1024) return { error: '图片超过20MB，无法处理' };
    const ext = path.extname(resolved).toLowerCase();
    if (!['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp'].includes(ext)) return { error: `不支持的图片格式: ${ext}，支持 PNG/JPG/WEBP/GIF/BMP` };
    const mime = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.bmp': 'image/bmp' };
    const base64 = fs.readFileSync(resolved).toString('base64');
    const dataUrl = `data:${mime[ext] || 'image/png'};base64,${base64}`;
    return { image_data_url: dataUrl, format: ext, size: stat.size, question: question || '请描述这张图片的内容' };
  },

  async transcribe_audio({ audio_path, language }) {
    const resolved = path.resolve(audio_path);
    if (!fs.existsSync(resolved)) return { error: `音频文件不存在: ${resolved}` };

    const mediaDir = path.join(process.env.APPDATA || process.env.USERPROFILE || 'C:\\', 'deepagent', 'media');
    const cleanup = () => {
      try {
        // 只清理 media 目录下的临时音频文件，不碰模型缓存
        if (fs.existsSync(mediaDir)) {
          const files = fs.readdirSync(mediaDir);
          files.forEach(f => {
            if (f.endsWith('.mp3') || f.endsWith('.wav') || f.endsWith('.m4a')) {
              try { fs.unlinkSync(path.join(mediaDir, f)); } catch(_) {}
            }
          });
        }
      } catch(_) {}
    };

    return new Promise((resolve) => {
      exec('python -c "import whisper; print(whisper.__version__)" 2>nul || echo nopython', { timeout: 5000 }, (pyErr, pyOut) => {
        const hasWhisper = pyOut && !pyOut.includes('nopython') && !pyErr;

        if (hasWhisper) {
          const langArg = language ? ` --language ${language}` : '';
          const cmd = `python -c "import whisper; model = whisper.load_model('base'); result = model.transcribe('${resolved.replace(/'/g, "\\'")}'${langArg}); print(result['text'])"`;
          exec(cmd, { timeout: 300000, maxBuffer: 10 * 1024 * 1024 }, (err, stdout) => {
            cleanup();
            if (err) resolve({ error: `Whisper 转录失败: ${err.message}`, note: '请确保已安装: pip install openai-whisper ffmpeg' });
            else resolve({ text: stdout.trim(), method: 'whisper' });
          });
        } else {
          const psCmd = `Add-Type -AssemblyName System.Speech; $speech = New-Object System.Speech.Recognition.SpeechRecognitionEngine; $speech.SetInputToWaveFile('${resolved.replace(/'/g, "''")}'); $result = $speech.Recognize(); if ($result) { $result.Text } else { '无法识别' }`;
          exec(`powershell -NoProfile -Command "${psCmd}"`, { timeout: 60000 }, (psErr, psOut) => {
            cleanup();
            if (psErr || !psOut || psOut.includes('无法识别')) {
              resolve({ error: '语音识别失败。请安装 Whisper: pip install openai-whisper ffmpeg', details: psOut?.trim() });
            } else {
              resolve({ text: psOut.trim(), method: 'windows-speech' });
            }
          });
        }
      });
    });
  },
};

// ── 系统通知 ──
function notifyUser(title, body) {
  try {
    if (mainWindow && mainWindow.isFocused()) return; // 窗口焦点时不弹
    new Notification({ title, body }).show();
  } catch(_) {}
}

// ── 智能 cwd 检测 ──
function detectProjectRoot(dir) {
  const markers = ['package.json', 'requirements.txt', '*.sln', '.git', 'go.mod', 'Cargo.toml', 'composer.json'];
  let current = path.resolve(dir);
  for (let i = 0; i < 5; i++) {
    for (const marker of markers) {
      try {
        if (marker.includes('*')) {
          if (fs.readdirSync(current).some(f => f.endsWith(marker.slice(1)))) return current;
        } else if (fs.existsSync(path.join(current, marker))) return current;
      } catch(_) {}
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return dir;
}

function downloadWithYtDlp(binary, url, mediaDir, extractAudio) {
  return new Promise((resolve) => {
    const output = path.join(mediaDir, '%(title)s.%(ext)s');
    const args = ['--no-playlist', '-o', output];

    if (extractAudio) {
      args.push('--extract-audio', '--audio-format', 'mp3', '--verbose');
    }
    args.push(url);

    const child = require('child_process').spawn(binary, args, { timeout: 600000 });
    let lastOutput = '';

    function sendProgress(line) {
      lastOutput += line + '\n';
      // 解析 yt-dlp 进度信息
      const pct = line.match(/(\d+\.?\d*)%/);
      const speed = line.match(/at\s+([\d.]+[KM]?i?B\/s)/);
      const eta = line.match(/ETA\s+(\d+:\d+)/);
      let msg = line.trim();
      if (pct) {
        const bar = '█'.repeat(Math.floor(parseFloat(pct[1]) / 5)) + '░'.repeat(20 - Math.floor(parseFloat(pct[1]) / 5));
        msg = `${bar} ${pct[1]}%`;
        if (speed) msg += ` ${speed[1]}`;
        if (eta) msg += ` ETA: ${eta[1]}`;
      }
      if (globalStreamSender) globalStreamSender('command-output', msg + '\n');
    }

    child.stdout.on('data', (data) => {
      data.toString().split('\n').forEach(l => l.trim() && sendProgress(l));
    });

    child.stderr.on('data', (data) => {
      data.toString().split('\n').forEach(l => l.trim() && sendProgress(l));
    });

    child.on('close', (code) => {
      let filePath = '';
      const fileMatch = lastOutput.match(/\[ExtractAudio\] Destination: (.+\.mp3)/) ||
                        lastOutput.match(/\[Merger\] Merging formats into "(.+)"/) ||
                        lastOutput.match(/\[download\] (.+) has already been downloaded/) ||
                        lastOutput.match(/Destination: (.+\.mp3)/i);
      if (fileMatch) filePath = fileMatch[1].trim();
      if (!filePath) {
        try {
          const files = fs.readdirSync(mediaDir).map(f => ({ name: f, time: fs.statSync(path.join(mediaDir, f)).mtimeMs })).sort((a, b) => b.time - a.time);
          if (files.length > 0) filePath = path.join(mediaDir, files[0].name);
        } catch (_) {}
      }
      const result = { output: lastOutput.slice(0, 2000) };
      if (filePath) result.file_path = filePath;
      if (code !== 0) result.error = `进程退出码: ${code}`;
      resolve(result);
    });
  });
}

// ── Git helper ────────────────────────────────────────────────
function runGitCommand(args, cwd) {
  return new Promise((resolve) => {
    exec(`git ${args.map(a => `"${a.replace(/"/g, '\\"')}"`).join(' ')}`, {
      cwd,
      timeout: 30000,
      maxBuffer: 1024 * 1024,
    }, (error, stdout, stderr) => {
      const result = { exitCode: error ? (error.code || 1) : 0 };
      if (stdout) result.stdout = stdout.trim().slice(0, 50000);
      if (stderr) result.stderr = stderr.trim().slice(0, 5000);
      if (error && !stdout) result.error = error.message.slice(0, 500);
      resolve(result);
    });
  });
}

// ══════════════════════════════════════════════════════════════
//  PERMISSION SYSTEM — 敏感操作需用户确认
// ══════════════════════════════════════════════════════════════

const permissionRequests = {}; // id → { resolve, tool, args, timer }

ipcMain.handle('request-permission', async (event, { tool, args }) => {
  return new Promise((resolve) => {
    const id = 'perm_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    permissionRequests[id] = resolve;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('permission-show', { id, tool, args });
    }
    // Auto-deny after 120 seconds
    const timer = setTimeout(() => {
      if (permissionRequests[id]) {
        delete permissionRequests[id];
        resolve({ allowed: false, reason: '等待超时（120秒）' });
      }
    }, 120000);
    permissionRequests[id].timer = timer;
  });
});

ipcMain.handle('permission-respond', (_, { id, allowed }) => {
  const req = permissionRequests[id];
  if (req) {
    clearTimeout(req.timer);
    delete permissionRequests[id];
    req({ allowed });
  }
});

// 需要用户确认的敏感工具列表
const SENSITIVE_TOOLS = ['run_command', 'write_file', 'edit_file', 'download_media', 'git_push', 'git_commit', 'git_branch'];

// ══════════════════════════════════════════════════════════════
//  SSE PARSER — 解析 API 流式响应，支持文本增量 + 工具调用
// ══════════════════════════════════════════════════════════════

function parseSSEStream(reader, decoder, onContent, onToolCallDelta, onFinish) {
  let buffer = '';
  const toolCallAccumulators = {}; // index → { id, name, arguments }

  return new Promise((resolve) => {
    (async () => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          const jsonStr = trimmed.slice(6).trim();
          if (jsonStr === '[DONE]') {
            // Flush accumulated tool calls before finishing
            const calls = Object.values(toolCallAccumulators);
            if (calls.length > 0) {
              resolve({ type: 'tool_calls', calls });
            } else {
              resolve({ type: 'done' });
            }
            return;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const choice = parsed.choices?.[0];
            if (!choice) continue;

            const delta = choice.delta || {};

            // Text content
            if (delta.content) {
              onContent(delta.content);
            }

            // Tool calls (delta)
            if (delta.tool_calls) {
              for (const tc of delta.tool_calls) {
                const idx = tc.index;
                if (!toolCallAccumulators[idx]) {
                  toolCallAccumulators[idx] = { id: '', name: '', arguments: '' };
                }
                if (tc.id) toolCallAccumulators[idx].id = tc.id;
                if (tc.function?.name) toolCallAccumulators[idx].name = tc.function.name;
                if (tc.function?.arguments) toolCallAccumulators[idx].arguments += tc.function.arguments;
              }
              onToolCallDelta(delta.tool_calls);
            }

            // Token usage (OpenAI 格式在最后一个 chunk 的 usage 字段)
            if (parsed.usage) {
              if (globalStreamSender) globalStreamSender('token-usage', JSON.stringify(parsed.usage));
            }

            // Finish reason
            if (choice.finish_reason) {
              const calls = Object.values(toolCallAccumulators);
              if (choice.finish_reason === 'tool_calls') {
                resolve({ type: 'tool_calls', calls });
              } else {
                resolve({ type: 'done', finish_reason: choice.finish_reason });
              }
              return;
            }
          } catch (_) { /* skip malformed JSON */ }
        }
      }

      // Stream ended without explicit finish
      const calls = Object.values(toolCallAccumulators);
      if (calls.length > 0) {
        resolve({ type: 'tool_calls', calls });
      } else {
        resolve({ type: 'done' });
      }
    })();
  });
}

// ══════════════════════════════════════════════════════════════
//  MULTI-TURN CONVERSATION LOOP
// ══════════════════════════════════════════════════════════════

let _abortController = null;
let globalStreamSender = null;
let globalSearchProvider = 'html';
let globalSearchApiKey = '';

// ── API 适配器：不同厂商的不同格式 ──
function buildApiRequest(provider, apiEndpoint, apiKey, model, messages, tools) {
  const baseUrl = (apiEndpoint || 'https://api.deepseek.com/v1').replace(/\/+$/, '');
  const isAnthropic = provider === 'anthropic';

  if (isAnthropic) {
    // Claude 使用自己的 API 格式
    const body = {
      model: model || 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      stream: true,
      messages: messages.filter(m => m.role !== 'system'),
    };
    // Claude 的 system prompt 单独传入
    const sysMsg = messages.find(m => m.role === 'system');
    if (sysMsg) body.system = sysMsg.content;

    return {
      url: 'https://api.anthropic.com/v1/messages',
      options: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
      },
    };
  }

  // OpenAI 兼容格式（DeepSeek / OpenAI / 通义 / 智谱 / Moonshot / Grok / Groq 等）
  const body = {
    model: model || 'deepseek-chat',
    max_tokens: 8192,
    stream: true,
    messages: messages,
  };
  if (tools && tools.length > 0) body.tools = tools;

  return {
    url: `${baseUrl}/chat/completions`,
    options: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    },
  };
}

// ── Claude SSE 解析（格式和 OpenAI 不同）──
async function parseClaudeSSE(reader, decoder, onContent, onToolCall, onDone) {
  let buffer = '';
  let currentEvent = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('event: ')) {
        currentEvent = line.slice(7).trim();
      } else if (line.startsWith('data: ')) {
        const data = line.slice(6).trim();
        if (!data) continue;
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
            onContent(parsed.delta.text);
          }
          if (parsed.type === 'message_delta' && parsed.usage) {
            // 记录 token 用量
            const usage = parsed.usage;
            if (globalStreamSender) globalStreamSender('token-usage', JSON.stringify(usage));
          }
          if (parsed.type === 'message_stop') {
            onDone();
            return;
          }
          if (parsed.type === 'error') {
            onContent(`\n[API Error: ${parsed.error?.message || '未知错误'}]\n`);
            onDone();
            return;
          }
        } catch (_) {}
      }
    }
  }
  onDone();
}

async function conversationLoop(event, userMessages, apiKey, model, apiEndpoint, apiProvider) {
  const currentMessages = [...userMessages];
  const provider = apiProvider || 'deepseek';
  let round = 0;

  // 注入长期记忆到上下文
  const memory = getMemory();
  if (memory) {
    const memoryInjected = currentMessages.some(m => m.role === 'system' && m.content?.includes('[记忆文件]'));
    if (!memoryInjected) {
      currentMessages.unshift({
        role: 'system',
        content: `[记忆文件内容]\n${memory.slice(0, 3000)}\n[/记忆文件]`,
      });
    }
  }

  // 注入 system prompt（如果用户设置了）
  const sysPrompt = event.sender && event.sender._sysPrompt;
  // system prompt 由前端传入 messages 中
  const MAX_ROUNDS = 10;

  while (round < MAX_ROUNDS) {
    round++;

    // ── 发送请求到 DeepSeek API（若 tools 不支持则自动降级）──
    let response;
    let useTools = true;
    let retryCount = 0;
    const maxRetries = 1;

    _abortController = new AbortController();

    while (retryCount <= maxRetries) {
      try {
        // 合并内置工具 + MCP 工具
        const allTools = useTools ? [...TOOL_DEFINITIONS, ...getAllMCPTools()] : null;
        const req = buildApiRequest(provider, apiEndpoint, apiKey, model, currentMessages, allTools);
        response = await fetch(req.url, { ...req.options, signal: _abortController.signal });

        if (response.ok) break;

        const errText = await response.text().catch(() => '');
        let errMsg = errText;
        try {
          const errBody = JSON.parse(errText);
          errMsg = errBody.error?.message || errBody.error || errText;
        } catch (_) {}

        if (useTools && (errMsg.includes('tools') || errMsg.includes('parameter') || errMsg.includes('unknown') || errMsg.includes('not supported'))) {
          useTools = false;
          retryCount++;
          continue;
        }

        event.sender.send('stream-error', errMsg);
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
        event.sender.send('stream-error', `网络请求失败: ${err.message}`);
        return;
      }
    }

    if (!response.ok) return;

    // ── 解析 SSE 流（支持 OpenAI 和 Claude 两种格式）──
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let currentRoundContent = '';
    let result;

    if (provider === 'anthropic') {
      // Claude 使用自己的 SSE 格式
      result = await new Promise((resolve) => {
        parseClaudeSSE(
          reader, decoder,
          (text) => { currentRoundContent += text; event.sender.send('stream-data', text); },
          () => {},
          () => resolve({ type: 'done' })
        );
      });
    } else {
      result = await parseSSEStream(reader, decoder,
        (text) => { currentRoundContent += text; event.sender.send('stream-data', text); },
        (tcDeltas) => {},
      );
    }

    // ── 处理结果 ──
    if (result.type === 'tool_calls' && result.calls.length > 0) {
      // 告诉 UI 有工具调用
      event.sender.send('tool-start', result.calls);

      // 构建 assistant 消息（含 tool_calls）
      const assistantMsg = {
        role: 'assistant',
        content: currentRoundContent || null,
        tool_calls: result.calls.map(tc => ({
          id: tc.id,
          type: 'function',
          function: { name: tc.name, arguments: tc.arguments },
        })),
      };
      currentMessages.push(assistantMsg);

      // 执行每个工具（敏感操作需用户确认）
      const toolResultMessages = [];

      // 设置流式输出发送器，让 run_command 可以实时推送输出到 terminal-panel
      globalStreamSender = (type, data) => {
        try { event.sender.send(type, data); } catch(_) {}
      };

      for (const tc of result.calls) {
        let toolResult;
        let needsPermission = SENSITIVE_TOOLS.includes(tc.name);

        // 如果是 git 命令，检查是否有破坏性操作
        if (tc.name === 'git_push') {
          try {
            const args = JSON.parse(tc.arguments || '{}');
            if (args.force) needsPermission = true; // force push 需要确认
          } catch (_) {}
        }

        // 检查权限 — 向用户发送确认请求
        if (needsPermission) {
          try {
            const response = await new Promise((resolve) => {
              const id = 'perm_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
              permissionRequests[id] = resolve;
              if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('permission-show', { id, tool: tc.name, args: tc.arguments });
              }
              setTimeout(() => {
                if (permissionRequests[id]) {
                  delete permissionRequests[id];
                  resolve({ allowed: false, reason: '等待超时（120秒）' });
                }
              }, 120000);
            });

            if (!response.allowed) {
              toolResult = { error: `操作已取消 — 用户未授权`, permission_denied: true, reason: response.reason || '用户拒绝' };
              // 通知 UI 工具结果（拒绝）
              event.sender.send('tool-result', {
                id: tc.id, name: tc.name, arguments: tc.arguments, result: toolResult,
              });
              toolResultMessages.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(toolResult) });
              continue;
            }
          } catch (permErr) {
            // Permission system failed, allow by default
          }
        }

        try {
          const args = JSON.parse(tc.arguments || '{}');
          const handler = toolHandlers[tc.name];
          if (handler) {
            toolResult = await handler(args);
          } else {
            // 尝试 MCP 服务器
            let mcpResult = null;
            for (const server of mcpServers) {
              if (server.tools.some(t => t.name === tc.name)) {
                mcpResult = await server.callTool(tc.name, args);
                break;
              }
            }
            toolResult = mcpResult || { error: `未知工具: ${tc.name}` };
          }
        } catch (err) {
          toolResult = { error: `工具执行失败: ${err.message}` };
        }

        const resultStr = JSON.stringify(toolResult, null, 2);

        // 通知 UI 工具结果
        event.sender.send('tool-result', {
          id: tc.id,
          name: tc.name,
          arguments: tc.arguments,
          result: toolResult,
        });

        toolResultMessages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: resultStr,
        });
      }

      // 通知 UI 本轮工具调用结束
      globalStreamSender = null;
      event.sender.send('command-end');
      event.sender.send('tool-end');

      // 将工具结果加入消息历史，继续循环
      currentMessages.push(...toolResultMessages);
      // 不发送 stream-end，继续下一轮
    } else {
      // 对话完成 - 文本回复或流结束
      const finishReason = result.finish_reason || (result.type === 'done' ? 'stop' : '');
      event.sender.send('stream-end', finishReason ? { finishReason } : {});
      return;
    }
  }

  // 达到最大轮次
  _abortController = null;
  event.sender.send('stream-end', { finishReason: 'max_rounds' });
}

// ── IPC: stream-message 入口 ─────────────────────────────────
ipcMain.handle('stream-message', async (event, { messages, apiKey, model, apiEndpoint, apiProvider, searchProvider, searchApiKey }) => {
  // 设置搜索 API 配置
  globalSearchProvider = searchProvider || 'html';
  globalSearchApiKey = searchApiKey || '';
  try {
    await conversationLoop(event, messages, apiKey, model, apiEndpoint, apiProvider);
  } catch (err) {
    // 如果是主动中止，不报错
    if (err.name === 'AbortError') return;
    event.sender.send('stream-error', err.message || '请求异常');
  } finally {
    _abortController = null;
  }
});

// ── IPC: 停止生成 ─────────────────────────────────────────────
ipcMain.handle('stop-generation', () => {
  if (_abortController) {
    _abortController.abort();
    _abortController = null;
    return true;
  }
  return false;
});

// ══════════════════════════════════════════════════════════════
//  FILE TREE & CODE VIEWER
// ══════════════════════════════════════════════════════════════

ipcMain.handle('get-home-dir', () => {
  return process.env.USERPROFILE || process.env.HOME || app.getPath('home');
});

ipcMain.handle('get-drives', () => {
  const drives = [];
  try {
    const execSync = require('child_process').execSync;
    const output = execSync('wmic logicaldisk get name 2>nul || fsutil fsinfo drives 2>nul').toString();
    const matches = output.match(/[A-Z]:/g);
    if (matches) {
      matches.forEach(d => drives.push(d));
    }
  } catch (_) {
    // Fallback: common drives
    ['C:', 'D:', 'E:', 'F:'].forEach(d => {
      try {
        if (require('fs').existsSync(d + '\\')) drives.push(d);
      } catch (_) {}
    });
  }
  return drives.length > 0 ? drives : ['C:'];
});

ipcMain.handle('get-directory-tree', async (_, dirPath, depth = 2) => {
  try {
    return buildDirectoryTree(path.resolve(dirPath), 0, depth);
  } catch (err) {
    return { error: err.message };
  }
});

function buildDirectoryTree(dirPath, currentDepth, maxDepth) {
  const name = path.basename(dirPath);
  const result = { name, path: dirPath, type: 'directory', children: [] };

  if (currentDepth >= maxDepth) return result;

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    // Sort: directories first, then files, alphabetically
    const sorted = entries
      .filter(e => !e.name.startsWith('.') && e.name !== 'node_modules' && e.name !== '.git')
      .sort((a, b) => {
        if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? -1 : 1;
        return a.name.localeCompare(b.name);
      });

    // Limit items to prevent freezing on huge directories
    const MAX_ITEMS = 200;
    const items = sorted.slice(0, MAX_ITEMS);

    for (const entry of items) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        // Only descend 1 level for initial load; deeper levels load on expand
        const childDepth = maxDepth > 1 ? currentDepth + 1 : currentDepth;
        result.children.push(buildDirectoryTree(fullPath, childDepth, maxDepth > 1 ? 1 : 0));
      } else if (entry.isFile()) {
        try {
          const stat = fs.statSync(fullPath);
          result.children.push({
            name: entry.name,
            path: fullPath,
            type: 'file',
            size: stat.size,
            ext: path.extname(entry.name).toLowerCase(),
          });
        } catch (_) { /* skip unreadable files */ }
      }
    }
    if (sorted.length > MAX_ITEMS) {
      result.children.push({ name: `... 还有 ${sorted.length - MAX_ITEMS} 项`, type: 'more' });
    }
  } catch (_) { /* permission denied, etc */ }

  return result;
}

ipcMain.handle('read-file-content', async (_, filePath) => {
  try {
    const resolved = path.resolve(filePath);
    const stat = fs.statSync(resolved);
    if (stat.size > 1024 * 1024) return { error: '文件超过 1MB，无法在查看器中打开' };
    const content = fs.readFileSync(resolved, 'utf-8');
    return { content, path: resolved, size: stat.size };
  } catch (err) {
    return { error: err.message };
  }
});

// ══════════════════════════════════════════════════════════════
//  DEPENDENCY CHECK
// ══════════════════════════════════════════════════════════════

ipcMain.handle('check-dependencies', () => {
  const results = [];
  const deps = {
    'node-pty': { label: 'node-pty (终端增强)', required: false, module: 'node-pty' },
    'sqlite3': { label: 'sqlite3 (数据库查询)', required: false, module: 'sqlite3' },
    '@xterm/xterm': { label: 'xterm.js (终端渲染)', required: false, module: '@xterm/xterm' },
    '@xterm/addon-fit': { label: 'xterm-fit (自动缩放)', required: false, module: '@xterm/addon-fit' },
    'yt-dlp': { label: 'yt-dlp (视频下载)', required: false, module: null, check: () => {
      try { require('child_process').execSync('where yt-dlp 2>nul || echo notfound').toString().trim(); return true; } catch(_) { return false; }
    }},
  };

  for (const [key, dep] of Object.entries(deps)) {
    let installed = false;
    if (dep.check) {
      installed = dep.check();
    } else {
      try { require(dep.module); installed = true; } catch(_) { installed = false; }
    }
    results.push({ key, label: dep.label, required: dep.required, installed });
  }
  return results;
});

ipcMain.handle('install-dependency', async (event, name) => {
  const appPath = app.getAppPath();
  const { exec } = require('child_process');
  return new Promise((resolve) => {
    const child = exec(`npm install ${name}`, { cwd: appPath, timeout: 120000 }, (err, stdout, stderr) => {
      resolve({ success: !err, output: (stdout + stderr).slice(0, 3000) });
    });
    // 实时推送安装输出
    child.stdout?.on('data', (data) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('dep-install-output', data.toString());
      }
    });
    child.stderr?.on('data', (data) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('dep-install-output', data.toString());
      }
    });
  });
});

// ══════════════════════════════════════════════════════════════
//  MICROPHONE RECORDING — transcribe audio blob
// ══════════════════════════════════════════════════════════════

ipcMain.handle('transcribe-audio-blob', async (event, { buffer }) => {
  const tmpDir = path.join(userDataPath, 'tmp');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  const tmpFile = path.join(tmpDir, `recording_${Date.now()}.webm`);

  try {
    fs.writeFileSync(tmpFile, Buffer.from(buffer));

    // 尝试使用 ffmpeg-static 转换，再调用 whisper
    let ffmpegPath;
    try { ffmpegPath = require('ffmpeg-static'); } catch(_) { ffmpegPath = 'ffmpeg'; }

    return new Promise((resolve) => {
      exec(`"${ffmpegPath}" -y -i "${tmpFile}" -ar 16000 -ac 1 "${tmpFile}.wav" 2>nul && python -m whisper "${tmpFile}.wav" --language zh --model base 2>nul`, {
        timeout: 300000, maxBuffer: 10 * 1024 * 1024,
      }, (err, stdout) => {
        // 清理临时文件
        try { fs.unlinkSync(tmpFile); } catch(_) {}
        try { fs.unlinkSync(tmpFile + '.wav'); } catch(_) {}

        if (err) {
          resolve({ error: `语音识别失败: ${err.message.slice(0, 200)}。请确保已安装: pip install openai-whisper ffmpeg` });
          return;
        }
        // Whisper 输出格式: [00:00.000 --> 00:05.000] 识别的文字
        const text = stdout.replace(/\[.*?\]\s*/g, '').trim();
        resolve({ text: text || '（无法识别语音内容）' });
      });
    });
  } catch (err) {
    try { fs.unlinkSync(tmpFile); } catch(_) {}
    return { error: `转录失败: ${err.message}` };
  }
});

// ══════════════════════════════════════════════════════════════
//  TTS — 双提供商（火山引擎 / ElevenLabs）
// ══════════════════════════════════════════════════════════════

ipcMain.handle('tts-speak', async (event, { text, provider, volcAk, volcSk, volcVoice, volcSpeed, elevenKey, elevenVoice, elevenSpeed }) => {
  try {
    if (provider === 'eleven') {
      // ElevenLabs
      const voiceId = elevenVoice || '21m00Tcm4TlvDq8ikWAM';
      const speed = elevenSpeed || 1.0;
      const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'xi-api-key': elevenKey || '' },
        body: JSON.stringify({ text, model_id: 'eleven_monolingual_v1', voice_settings: { stability: 0.5, similarity_boost: 0.5, speed: parseFloat(speed) } }),
      });
      if (!resp.ok) return { error: `ElevenLabs API 错误 (${resp.status})` };
      const arrayBuffer = await resp.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      return { audio: base64, format: 'mp3' };
    }

    // 火山引擎（默认）
    const token = `Bearer;${volcAk || ''};${volcSk || ''}`;
    const payload = {
      app: { appid: '0', token, cluster: 'volcano_tts' },
      user: { uid: 'deepagent' },
      audio: { voice_type: volcVoice || 'BV001_streaming', encoding: 'mp3', speed_ratio: parseFloat(volcSpeed || '1.0'), volume_ratio: 1.0, pitch_ratio: 1.0 },
      request: { reqid: Date.now().toString(36), text, text_type: 'plain', operation: 'query' },
    };
    const resp = await fetch('https://openspeech.bytedance.com/api/v1/tts', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': token },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) return { error: `火山引擎 TTS 错误 (${resp.status})` };
    const data = await resp.json();
    if (data.code !== 3000) return { error: `TTS 合成失败: ${data.message || data.code}` };
    return { audio: data.data, format: 'mp3' };
  } catch (err) {
    return { error: `TTS 请求失败: ${err.message}` };
  }
});

// ══════════════════════════════════════════════════════════════
//  BUILT-IN TERMINAL (node-pty / PowerShell)
// ══════════════════════════════════════════════════════════════

let terminalProcess = null;

ipcMain.handle('terminal-start', (event, { cwd, cols, rows } = {}) => {
  if (terminalProcess) {
    terminalProcess.kill();
    terminalProcess = null;
  }

  const shell = process.env.COMSPEC || 'powershell.exe';
  let useNodePty = false;

  // 尝试使用 node-pty（更真实的终端体验）
  try {
    const pty = require('node-pty');
    terminalProcess = pty.spawn(shell, ['-NoLogo'], {
      name: 'xterm-256color',
      cols: cols || 80,
      rows: rows || 24,
      cwd: cwd || process.env.USERPROFILE,
      env: { ...process.env, TERM: 'xterm-256color' },
    });
    useNodePty = true;

    terminalProcess.onData((data) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('terminal-data', data);
      }
    });

    terminalProcess.onExit(() => {
      terminalProcess = null;
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('terminal-exit');
      }
    });
  } catch (e) {
    // node-pty 不可用，降级到 child_process.spawn
    terminalProcess = require('child_process').spawn(shell, ['-NoExit', '-NoLogo', '-Command', 'Set-Location "' + (cwd || process.env.USERPROFILE) + '"'], {
      cwd: cwd || process.env.USERPROFILE,
      env: { ...process.env, TERM: 'xterm-256color' },
    });

    terminalProcess.stdout.on('data', (data) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('terminal-data', data.toString());
      }
    });
    terminalProcess.stderr.on('data', (data) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('terminal-data', data.toString());
      }
    });
    terminalProcess.on('exit', () => {
      terminalProcess = null;
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('terminal-exit');
      }
    });
  }

  return { pid: terminalProcess?.pid, useNodePty };
});

ipcMain.handle('terminal-resize', (_, { cols, rows }) => {
  if (terminalProcess && typeof terminalProcess.resize === 'function') {
    terminalProcess.resize(cols, rows);
  }
  return true;
});

ipcMain.handle('terminal-write', (_, data) => {
  if (terminalProcess && terminalProcess.stdin.writable) {
    // Ctrl+C (\x03): 发送中断信号
    if (data === '\x03') {
      terminalProcess.kill('SIGINT');
      // Windows fallback: send Ctrl+C via stdin
      try { terminalProcess.stdin.write('\x03'); } catch (_) {}
      return true;
    }
    terminalProcess.stdin.write(data);
    return true;
  }
  return false;
});

ipcMain.handle('terminal-stop', () => {
  if (terminalProcess) {
    terminalProcess.kill();
    terminalProcess = null;
  }
  return true;
});

app.on('before-quit', () => {
  if (terminalProcess) {
    terminalProcess.kill();
    terminalProcess = null;
  }
});
