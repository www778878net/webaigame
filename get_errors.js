const WebSocket = require('ws');

async function getJSErrors() {
    const pages = await fetch('http://localhost:9223/json/list').then(r => r.json());
    const page = pages.find(p => p.url && p.url.includes('index.html'));
    if (!page) {
        console.log('找不到页面，可用页面:', pages.map(p => p.url));
        process.exit(1);
    }
    
    console.log('连接页面:', page.url);
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    const errors = [];
    
    ws.on('open', () => {
        console.log('已连接，启用 Runtime...');
        ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
        ws.send(JSON.stringify({ id: 2, method: 'Console.enable' }));
        ws.send(JSON.stringify({ id: 3, method: 'Log.enable' }));
        
        setTimeout(() => {
            console.log('刷新页面...');
            ws.send(JSON.stringify({ id: 4, method: 'Page.reload', params: { ignoreCache: true } }));
        }, 500);
        
        setTimeout(() => {
            console.log('\n=== 检测结果 ===\n');
            if (errors.length > 0) {
                errors.forEach(e => console.log(e + '\n'));
                process.exit(1);
            } else {
                console.log('无 JS 错误');
                process.exit(0);
            }
        }, 5000);
    });
    
    ws.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        
        if (msg.method === 'Runtime.exceptionThrown') {
            const ex = msg.params.exceptionDetails;
            const text = ex.exception?.description || ex.text || 'Unknown error';
            const url = ex.url || '';
            const line = ex.lineNumber || '?';
            const col = ex.columnNumber || '?';
            errors.push(`[Exception] ${text}\n    at ${url}:${line}:${col}`);
        }
        
        if (msg.method === 'Runtime.consoleAPICalled') {
            if (msg.params.type === 'error') {
                const args = msg.params.args?.map(a => a.value || a.description || JSON.stringify(a)).join(' ');
                const frame = msg.params.stackTrace?.callFrames?.[0];
                const loc = frame ? `${frame.url}:${frame.lineNumber}` : '';
                errors.push(`[Console Error] ${args}\n    at ${loc}`);
            }
        }
        
        if (msg.method === 'Log.entryAdded') {
            const entry = msg.params.entry;
            if (entry.level === 'error') {
                errors.push(`[Log Error] ${entry.text}\n    at ${entry.url}:${entry.lineNumber}`);
            }
        }
    });
    
    ws.on('error', (err) => {
        console.log('WebSocket 错误:', err.message);
        process.exit(1);
    });
}

getJSErrors();
