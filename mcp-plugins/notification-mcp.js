// DeepAgent MCP Plugin — Windows 桌面通知
let buf = '';
process.stdin.on('data', async chunk => {
  buf += chunk.toString();
  try {
    const req = JSON.parse(buf); buf = '';
    if (req.method === 'tools/list') {
      process.stdout.write(JSON.stringify({ id: req.id, result: { tools: [{ name: 'notify', description: '发送 Windows 桌面通知', inputSchema: { type: 'object', properties: { title: { type: 'string', description: '通知标题' }, body: { type: 'string', description: '通知内容' } }, required: ['title', 'body'] } }] } }) + '\n');
    } else if (req.method === 'tools/call' && req.params?.name === 'notify') {
      try {
        const { title, body } = req.params.arguments || {};
        const ps = `powershell -NoProfile -Command "& { [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] > \\$null; $t = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02); $t.GetElementsByTagName('text')[0].AppendChild($t.CreateTextNode('${(title||'').replace(/'/g,"''")}')) > \\$null; $t.GetElementsByTagName('text')[1].AppendChild($t.CreateTextNode('${(body||'').replace(/'/g,"''")}')) > \\$null; [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('DeepAgent').Show($t) }"`;
        require('child_process').execSync(ps, { stdio: 'pipe' });
        process.stdout.write(JSON.stringify({ id: req.id, result: { content: [{ type: 'text', text: '通知已发送' }] } }) + '\n');
      } catch (e) {
        process.stdout.write(JSON.stringify({ id: req.id, result: { content: [{ type: 'text', text: `通知失败: ${e.message}` }] } }) + '\n');
      }
    }
  } catch (_) {}
});
