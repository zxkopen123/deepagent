/* ══════════════════════════════════════════════════════════════
   DeepAgent — i18n 多语言系统
   ══════════════════════════════════════════════════════════════ */

const LANGUAGES = {
  zh: '中文',
  en: 'English',
};

const translations = {
  zh: {
    // ── 应用通用 ──
    'app.name': 'DeepAgent',
    'app.title': 'DeepAgent',

    // ── 侧边栏 ──
    'sidebar.new_chat': '新建对话',
    'sidebar.chats_tab': '💬 对话',
    'sidebar.files_tab': '📁 文件',
    'sidebar.settings': '设置',
    'sidebar.no_chats': '暂无对话',
    'sidebar.search': '搜索对话...',
    'sidebar.loading': '加载中...',
    'sidebar.export': '导出对话',

    // ── 文件树 ──
    'filetree.refresh': '刷新',
    'filetree.loading': '加载中...',
    'filetree.select_hint': '选择文件查看',
    'filetree.select_drive': '选择磁盘',

    // ── 主视图 ──
    'main.chat_tab': '💬 对话',
    'main.terminal_tab': '💻 终端',
    'main.select_model': '选择模型',
    'theme.toggle': '切换主题',

    // ── 聊天 ──
    'chat.new_conversation': '新对话',
    'chat.welcome_title': '欢迎使用 DeepAgent',
    'chat.welcome_desc': '强大的 AI 助手，可以读写文件、执行命令、搜索代码、访问网络。',
    'chat.placeholder': '输入消息...',
    'chat.send': '发送',
    'chat.disclaimer': 'DeepSeek 可能会生成不准确的信息，请核实重要事实。',
    'chat.suggestion_list': '列出当前目录的文件',
    'chat.suggestion_sysinfo': '查看系统信息',
    'chat.drop_hint': '📄 拖放文件到此处',
    'chat.upload': '上传文件',
    'chat.mic': '语音输入',
    'chat.recording': '录音中...',
    'chat.mic_error': '请授予麦克风权限',
    'chat.whisper_error': '语音识别失败，请检查 openai-whisper 是否安装',

    // ── 终端 ──
    'terminal.ready': '终端已就绪',
    'terminal.connected': '终端已连接',
    'terminal.disconnected': '终端已断开',
    'terminal.restart': '重启',
    'terminal.restarting': '重启中...',
    'terminal.prompt': 'PS> ',
    'terminal.placeholder': '输入命令...',
    'terminal.starting': '正在启动终端...',
    'terminal.welcome1': 'DeepAgent — PowerShell 终端',
    'terminal.welcome2': '输入命令后按 Enter 执行',
    'terminal.exited': '终端进程已退出',
    'terminal.error': '终端启动失败',
    'terminal.running': '执行中...',

    // ── 代码查看器 ──
    'codeview.close': '关闭',
    'codeview.loading': '加载中...',
    'codeview.select_hint': '选择文件查看',
    'codeview.edit': '编辑',
    'codeview.save': '保存',

    // ── 设置 ──
    'settings.title': '设置',
    'settings.api_key': 'DeepSeek API 密钥',
    'settings.api_key_placeholder': 'sk-...',
    'settings.api_key_hint': 'API 密钥仅存储在本地，仅用于调用 DeepSeek API (api.deepseek.com)。前往 platform.deepseek.com 获取',
    'settings.theme': '主题',
    'settings.dark': '深色',
    'settings.light': '浅色',
    'settings.language': '语言',
    'settings.saved': '✅ 设置已保存',
    'settings.save': '保存设置',
    'settings.back': '← 返回',
    'settings.provider': 'AI 服务商',
    'settings.provider_deepseek': 'DeepSeek（深度求索）',
    'settings.provider_openai': 'OpenAI',
    'settings.provider_qwen': '通义千问（阿里云）',
    'settings.provider_zhipu': '智谱清言',
    'settings.provider_moonshot': '月之暗面',
    'settings.provider_custom': '自定义',
    'settings.provider_grok': 'xAI Grok',
    'settings.provider_groq': 'Groq（免费）',
    'settings.provider_anthropic': 'Anthropic Claude',
    'settings.endpoint': 'API 端点地址',
    'settings.model': '默认模型',
    'settings.api_key_hint': '密钥仅本地保存，仅用于调用对应 API',

    // ── 权限弹窗 ──
    'perm.title': '权限请求',
    'perm.label': 'AI 想执行以下操作：',
    'perm.hint': '拒绝后 AI 会尝试其他方案。',
    'perm.allow': '允许',
    'perm.deny': '拒绝',
    'perm.timeout': '等待超时（120秒）',
    'perm.cancelled': '操作已取消 — 用户未授权',

    // ── 错误消息 ──
    'error.no_api_key': '请先在设置中配置 DeepSeek API 密钥。',
    'error.no_api_key_send': '请先在设置中配置 DeepSeek API 密钥后再开始对话。',
    'error.stream_error': '流式响应出错',
    'error.send_failed': '消息发送失败',
    'error.network': '网络请求失败',
    'error.file_not_found': '文件不存在',
    'error.file_too_large': '文件超过 1MB，无法读取',
    'error.permission_denied': '操作已取消 — 用户未授权',

    // ── 工具调用 ──
    'tool.running': '执行中...',
    'tool.error': '执行出错',
    'tool.unknown': '未知工具',

    // ── 搜索 ──
    'search.no_results': '未找到结果，可尝试调整搜索词',

    // ── Git ──
    'git.no_changes': '没有需要提交的变更',
    'git.no_changes_note': '文件没有修改或已全部提交',
  },

  en: {
    // ── App General ──
    'app.name': 'DeepAgent',
    'app.title': 'DeepAgent',

    // ── Sidebar ──
    'sidebar.new_chat': 'New Chat',
    'sidebar.chats_tab': '💬 Chats',
    'sidebar.files_tab': '📁 Files',
    'sidebar.settings': 'Settings',
    'sidebar.no_chats': 'No conversations yet',
    'sidebar.search': 'Search conversations...',
    'sidebar.loading': 'Loading...',
    'sidebar.export': 'Export Chat',

    // ── File Tree ──
    'filetree.refresh': 'Refresh',
    'filetree.loading': 'Loading...',
    'filetree.select_hint': 'Select a file to view',
    'filetree.select_drive': 'Select drive',

    // ── Main View ──
    'main.chat_tab': '💬 Chat',
    'main.terminal_tab': '💻 Terminal',
    'main.select_model': 'Select Model',
    'chat.drop_hint': '📄 Drop files here',
    'theme.toggle': 'Toggle Theme',

    // ── Chat ──
    'chat.new_conversation': 'New conversation',
    'chat.welcome_title': 'Welcome to DeepAgent',
    'chat.welcome_desc': 'A powerful AI assistant that can read/write files, run commands, search code, and access the web.',
    'chat.placeholder': 'Send a message...',
    'chat.send': 'Send',
    'chat.disclaimer': 'DeepSeek may produce inaccurate information. Verify important facts.',
    'chat.upload': 'Upload File',
    'chat.mic': 'Voice Input',
    'chat.recording': 'Recording...',
    'chat.mic_error': 'Please grant microphone permission',
    'chat.whisper_error': 'Speech recognition failed. Please check openai-whisper installation',
    'chat.suggestion_list': 'List files in current directory',
    'chat.suggestion_sysinfo': 'Check system information',

    // ── Terminal ──
    'terminal.ready': 'Terminal ready',
    'terminal.connected': 'Terminal connected',
    'terminal.disconnected': 'Terminal disconnected',
    'terminal.restart': 'Restart',
    'terminal.restarting': 'Restarting...',
    'terminal.prompt': 'PS> ',
    'terminal.placeholder': 'Type a command...',
    'terminal.starting': 'Starting terminal...',
    'terminal.welcome1': 'DeepAgent — PowerShell Terminal',
    'terminal.welcome2': 'Type a command and press Enter to execute',
    'terminal.exited': 'Terminal process exited',
    'terminal.error': 'Terminal failed to start',
    'terminal.running': 'Running...',

    // ── Code Viewer ──
    'codeview.close': 'Close',
    'codeview.loading': 'Loading...',
    'codeview.select_hint': 'Select a file to view',
    'codeview.edit': 'Edit',
    'codeview.save': 'Save',

    // ── Settings ──
    'settings.title': 'Settings',
    'settings.api_key': 'DeepSeek API Key',
    'settings.api_key_placeholder': 'sk-...',
    'settings.api_key_hint': 'Your API key is stored locally and sent only to DeepSeek API (api.deepseek.com). Get one at platform.deepseek.com',
    'settings.theme': 'Theme',
    'settings.dark': 'Dark',
    'settings.light': 'Light',
    'settings.language': 'Language',
    'settings.saved': '✅ Settings saved',
    'settings.save': 'Save Settings',
    'settings.back': '← Back',
    'settings.provider': 'AI Provider',
    'settings.provider_deepseek': 'DeepSeek',
    'settings.provider_openai': 'OpenAI',
    'settings.provider_qwen': 'Qwen (Alibaba Cloud)',
    'settings.provider_zhipu': 'Zhipu AI (GLM)',
    'settings.provider_moonshot': 'Moonshot',
    'settings.provider_custom': 'Custom',
    'settings.provider_grok': 'xAI Grok',
    'settings.provider_groq': 'Groq (Free)',
    'settings.provider_anthropic': 'Anthropic Claude',
    'settings.endpoint': 'API Endpoint',
    'settings.model': 'Default Model',
    'settings.api_key_hint': 'Your API key is stored locally and only used to call the API',

    // ── Permission Dialog ──
    'perm.title': 'Permission Request',
    'perm.label': 'AI wants to perform the following operation:',
    'perm.hint': 'If denied, AI will try alternative approaches.',
    'perm.allow': 'Allow',
    'perm.deny': 'Deny',
    'perm.timeout': 'Request timed out (120s)',
    'perm.cancelled': 'Operation cancelled — user denied permission',

    // ── Error Messages ──
    'error.no_api_key': 'Please set your DeepSeek API key in Settings first.',
    'error.no_api_key_send': 'Please configure your DeepSeek API key in Settings before starting a conversation.',
    'error.stream_error': 'Stream error occurred',
    'error.send_failed': 'Failed to send message',
    'error.network': 'Network request failed',
    'error.file_not_found': 'File not found',
    'error.file_too_large': 'File exceeds 1MB, cannot read',
    'error.permission_denied': 'Operation cancelled — user denied permission',

    // ── Tool Calls ──
    'tool.running': 'Running...',
    'tool.error': 'Error executing',
    'tool.unknown': 'Unknown tool',

    // ── Search ──
    'search.no_results': 'No results found. Try refining your search terms.',

    // ── Git ──
    'git.no_changes': 'Nothing to commit',
    'git.no_changes_note': 'No files have been modified or all changes are already committed',
  },

  ja: {
    'app.name': 'DeepAgent',
    'app.title': 'DeepAgent',
    'sidebar.new_chat': '新規チャット',
    'sidebar.chats_tab': '💬 チャット',
    'sidebar.files_tab': '📁 ファイル',
    'sidebar.settings': '設定',
    'sidebar.no_chats': 'チャットがありません',
    'sidebar.search': 'チャットを検索...',
    'sidebar.export': 'エクスポート',
    'main.chat_tab': '💬 チャット',
    'main.terminal_tab': '💻 ターミナル',
    'chat.new_conversation': '新しい会話',
    'chat.welcome_title': 'DeepAgentへようこそ',
    'chat.welcome_desc': 'ファイルの読み書き、コマンド実行、コード検索が可能なAIアシスタント',
    'chat.placeholder': 'メッセージを入力...',
    'chat.disclaimer': '不正確な情報が含まれる可能性があります。ご確認ください。',
    'chat.upload': 'ファイルをアップロード',
    'settings.title': '設定',
    'settings.api_key': 'API キー',
    'settings.dark': 'ダーク',
    'settings.light': 'ライト',
    'settings.language': '言語',
    'settings.save': '保存',
    'terminal.ready': 'ターミナル準備完了',
    'perm.title': '権限リクエスト',
    'perm.allow': '許可',
    'perm.deny': '拒否',
  },

  ko: {
    'app.name': 'DeepAgent',
    'app.title': 'DeepAgent',
    'sidebar.new_chat': '새 채팅',
    'sidebar.chats_tab': '💬 채팅',
    'sidebar.files_tab': '📁 파일',
    'sidebar.settings': '설정',
    'sidebar.no_chats': '채팅이 없습니다',
    'sidebar.search': '채팅 검색...',
    'sidebar.export': '내보내기',
    'main.chat_tab': '💬 채팅',
    'main.terminal_tab': '💻 터미널',
    'chat.new_conversation': '새 대화',
    'chat.welcome_title': 'DeepAgent에 오신 것을 환영합니다',
    'chat.welcome_desc': '파일 읽기/쓰기, 명령 실행, 코드 검색이 가능한 AI 어시스턴트',
    'chat.placeholder': '메시지 입력...',
    'chat.disclaimer': '부정확한 정보를 생성할 수 있습니다. 중요한 정보는 확인하세요.',
    'chat.upload': '파일 업로드',
    'settings.title': '설정',
    'settings.api_key': 'API 키',
    'settings.dark': '다크',
    'settings.light': '라이트',
    'settings.language': '언어',
    'settings.save': '저장',
    'terminal.ready': '터미널 준비 완료',
    'perm.title': '권한 요청',
    'perm.allow': '허용',
    'perm.deny': '거부',
  },
};

let currentLang = 'zh';

function setLanguage(lang) {
  if (translations[lang]) {
    currentLang = lang;
    // Update <html> lang attribute
    document.documentElement.lang = lang === 'en' ? 'en' : 'zh';
    // Update page title
    document.title = t('app.title');
  }
}

function t(key, ...args) {
  let text = translations[currentLang]?.[key] || translations.zh[key] || key;
  if (args.length > 0) {
    args.forEach((arg, i) => {
      text = text.replace(`{${i}}`, arg);
    });
  }
  return text;
}

function getCurrentLang() {
  return currentLang;
}

function getLanguages() {
  return LANGUAGES;
}
