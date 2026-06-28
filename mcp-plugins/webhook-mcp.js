// DeepAgent MCP Plugin — Webhook 推送
const { stdin, stdout } = process;
let buf = '';
stdin.on('data', async chunk => {
  buf += chunk.toString();
  try {
    const req = JSON.parse(buf); buf = '';
    if (req.method === 'tools/list') {
      stdout.write(JSON.stringify({ id: req.id, result: { tools: [{ name: 'webhook_send', description: '通过 Webhook URL 发送消息（支持 Discord、Slack、企业微信等）', inputSchema: { type: 'object', properties: { url: { type: 'string', description: 'Webhook URL' }, message: { type: 'string', description: '要发送的消息内容' } }, required: ['url', 'message'] } }] } }) + '\n');
    } else if (req.method === 'tools/call' && req.params?.name === 'webhook_send') {
      try {
        const { url, message } = req.params.arguments || {};
        const res = await fetch(url, { method: 'POST', body: JSON.stringify({ content: message }), headers: { 'Content-Type': 'application/json' } });
        const text = await res.text();
        stdout.write(JSON.stringify({ id: req.id, result: { content: [{ type: 'text', text: text.slice(0, 500) }] } }) + '\n');
      } catch (e) {
        stdout.write(JSON.stringify({ id: req.id, result: { content: [{ type: 'text', text: `发送失败: ${e.message}` }] } }) + '\n');
      }
    }
  } catch (_) {}
});
