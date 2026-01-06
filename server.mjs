import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const distDir = path.join(__dirname, 'dist')
const indexPath = path.join(distDir, 'index.html')

const port = Number.parseInt(process.env.PORT ?? '8080', 10)
const host = '0.0.0.0'

function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  switch (ext) {
    case '.html':
      return 'text/html; charset=utf-8'
    case '.js':
      return 'text/javascript; charset=utf-8'
    case '.css':
      return 'text/css; charset=utf-8'
    case '.json':
      return 'application/json; charset=utf-8'
    case '.svg':
      return 'image/svg+xml'
    case '.png':
      return 'image/png'
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    case '.gif':
      return 'image/gif'
    case '.webp':
      return 'image/webp'
    case '.ico':
      return 'image/x-icon'
    case '.txt':
      return 'text/plain; charset=utf-8'
    case '.woff':
      return 'font/woff'
    case '.woff2':
      return 'font/woff2'
    default:
      return 'application/octet-stream'
  }
}

function safeResolveFromDist(urlPathname) {
  const decoded = decodeURIComponent(urlPathname)
  const stripped = decoded.replace(/^\/+/, '')

  const candidate = path.join(distDir, stripped)
  const normalized = path.normalize(candidate)

  if (!normalized.startsWith(distDir)) return null
  return normalized
}

const server = http.createServer((req, res) => {
  if (!req.url) {
    res.statusCode = 400
    res.end('Bad Request')
    return
  }

  const urlObj = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`)

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405
    res.setHeader('Allow', 'GET, HEAD')
    res.end('Method Not Allowed')
    return
  }

  if (urlObj.pathname === '/healthz') {
    res.statusCode = 200
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.end('ok')
    return
  }

  const filePath = safeResolveFromDist(urlObj.pathname)

  const tryServeFile = (p) => {
    try {
      const stat = fs.statSync(p)
      if (!stat.isFile()) return false

      res.statusCode = 200
      res.setHeader('Content-Type', contentTypeFor(p))
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')

      if (req.method === 'HEAD') {
        res.end()
        return true
      }

      fs.createReadStream(p).pipe(res)
      return true
    } catch {
      return false
    }
  }

  if (filePath && tryServeFile(filePath)) return

  // SPA fallback
  try {
    const html = fs.readFileSync(indexPath)
    res.statusCode = 200
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache')

    if (req.method === 'HEAD') {
      res.end()
      return
    }

    res.end(html)
  } catch {
    res.statusCode = 500
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.end('Missing build output. Did you run the build?')
  }
})

server.listen(port, host, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on http://${host}:${port}`)
})
