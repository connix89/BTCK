// Lightweight mock API server for development
// Run with: node mock-server.js

import http from 'node:http'

const server = http.createServer(async (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    })
    return res.end()
  }

  if (req.method === 'POST' && req.url === '/api/analyze') {
    let body = ''
    req.on('data', (chunk) => (body += chunk))
    req.on('end', () => {
      try {
        const { code } = JSON.parse(body || '{}')
        // naive highlight line detection
        const lines = String(code || '').split(/\r?\n/)
        const idx = lines.findIndex((l) => /range\(len\([a-zA-Z_]+\)\+1\)/.test(l)) + 1

        const response = {
          rule: {
            icon: '⚙️',
            title: 'Hệ thống',
            reasoning_steps: [
              'Đọc cấu trúc vòng lặp để kiểm tra biên.',
              'Phát hiện range(len(x)+1) có thể vượt chỉ số.',
              'Giới hạn hợp lệ là 0..len(x)-1.',
            ],
            fix_steps: ['Đổi range(len(x)+1) → range(len(x)).', 'Kiểm thử lại với biên nhỏ ([], [1]).'],
            suggested_patch: 'for i in range(len(x)):',
            highlightLines: idx ? [idx] : [],
          },
          llm: {
            icon: '🤖',
            title: 'LLM',
            reasoning_steps: [
              'Xác thực logic so sánh và truy cập phần tử.',
              'Chỉ số len(x) sẽ gây IndexError.',
              'Cần lặp tới len(x)-1 hoặc duyệt trực tiếp giá trị.',
            ],
            fix_steps: ['Thay bằng range(len(x)).', 'Hoặc dùng for v in x: if v > m: m = v.'],
            suggested_patch: 'for i in range(len(x)):',
            highlightLines: idx ? [idx] : [],
          },
        }

        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        })
        res.end(JSON.stringify(response))
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8', 'Access-Control-Allow-Origin': '*' })
        res.end('Bad Request')
      }
    })
    return
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', 'Access-Control-Allow-Origin': '*' })
  res.end('Not Found')
})

const port = process.env.PORT ? Number(process.env.PORT) : 8787
server.listen(port, '127.0.0.1', () => {
  console.log(`Mock API listening at http://127.0.0.1:${port}`)
})
