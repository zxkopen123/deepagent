// DeepAgent MCP Plugin — 剪贴板读写
const { execSync } = require('child_process');
let buf = '';
process.stdin.on('data', async chunk => {
  buf += chunk.toString();
  try {
    const req = JSON.parse(buf); buf = '';
    if (req.method === 'tools/list') {
      process.stdout.write(JSON.stringify({ id: req.id, result: { tools: [
        { name: 'clipboard_read', description: '读取系统剪贴板内容', inputSchema: { type: 'object', properties: {} } },
        { name: 'clipboard_write', description: '写入内容到系统剪贴板', inputSchema: { type: 'object', properties: { text: { type: 'string', description: '要写入的文字' } }, required: ['text'] } },
      ] } }) + '\n');
    } else if (req.method === 'tools/call') {
      if (req.params?.name === 'clipboard_read') {
        const text = execSync('powershell -NoProfile -Command "Get-Clipboard"', { encoding: 'utf-8' }).toString().trim();
        process.stdout.write(JSON.stringify({ id: req.id, result: { content: [{ type: 'text', text: text || '（剪贴板为空）' }] } }) + '\n');
      } else if (req.params?.name === 'clipboard_write') {
        const text = (req.params.arguments?.text || '').replace(/'/g, "''");
        execSync(`powershell -NoProfile -Command "Set-Clipboard -Value '${text}'"`);
        process.stdout.write(JSON.stringify({ id: req.id, result: { content: [{ type: 'text', text: '已写入剪贴板' }] } }) + '\n');
      }
    }
  } catch (_) {}
});
