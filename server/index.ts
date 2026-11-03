import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { dirname, extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { HttpError } from './http.ts'
import { createLevel, readContent, saveLevelRoutes, updateHero, updateLevel } from './store.ts'

const port = Number(process.env.PORT ?? 8787)
const distDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const serveStatic = process.env.NODE_ENV === 'production'

const types: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  const payload = JSON.stringify(body)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(payload),
    'cache-control': 'no-store',
  })
  res.end(payload)
}

function fileInDist(urlPath: string) {
  const pathname = decodeURIComponent(urlPath.split('?')[0] ?? '/')
  const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '')
  const full = normalize(join(distDir, relative))
  if (!full.startsWith(normalize(distDir))) return null
  return full
}

function sendFile(res: ServerResponse, file: string) {
  const type = types[extname(file)] ?? 'application/octet-stream'
  res.writeHead(200, { 'content-type': type })
  createReadStream(file).pipe(res)
}

function readJson(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let size = 0
    let failed = false
    const fail = (error: HttpError) => {
      if (failed) return
      failed = true
      reject(error)
    }
    req.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > 1_000_000) {
        fail(new HttpError(413, '提交的内容太大'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      if (failed) return
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))
      } catch {
        fail(new HttpError(400, '内容无法读取'))
      }
    })
    req.on('error', () => fail(new HttpError(400, '内容无法读取')))
  })
}

async function handleRequest(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? '127.0.0.1'}`)

  try {
    if (url.pathname === '/api/health') {
      sendJson(res, 200, { ok: true })
      return
    }

    if (url.pathname === '/api/content' && req.method === 'GET') {
      sendJson(res, 200, readContent())
      return
    }

    if (url.pathname === '/api/levels' && req.method === 'POST') {
      sendJson(res, 201, createLevel(await readJson(req)))
      return
    }

    const routeMatch = /^\/api\/levels\/([^/]+)\/routes$/.exec(url.pathname)
    if (routeMatch && req.method === 'PUT') {
      sendJson(res, 200, saveLevelRoutes(decodeURIComponent(routeMatch[1]), await readJson(req)))
      return
    }

    const heroMatch = /^\/api\/heroes\/([^/]+)$/.exec(url.pathname)
    if (heroMatch && req.method === 'PUT') {
      sendJson(res, 200, updateHero(decodeURIComponent(heroMatch[1]), await readJson(req)))
      return
    }

    const levelMatch = /^\/api\/levels\/([^/]+)$/.exec(url.pathname)
    if (levelMatch && req.method === 'PUT') {
      sendJson(res, 200, updateLevel(decodeURIComponent(levelMatch[1]), await readJson(req)))
      return
    }

    if (url.pathname.startsWith('/api/')) {
      sendJson(res, 404, { error: '没有这个接口' })
      return
    }
  } catch (error) {
    if (error instanceof HttpError) {
      sendJson(res, error.status, { error: error.message })
      return
    }
    console.error(error)
    sendJson(res, 500, { error: '内容没有保存' })
    return
  }

  if (!serveStatic) {
    sendJson(res, 404, { error: '开发时页面由 Vite 提供' })
    return
  }

  const requested = fileInDist(url.pathname)
  if (requested && existsSync(requested) && statSync(requested).isFile()) {
    sendFile(res, requested)
    return
  }

  const fallback = join(distDir, 'index.html')
  if (existsSync(fallback)) {
    sendFile(res, fallback)
    return
  }

  sendJson(res, 404, { error: '还没有构建前端' })
}

createServer(handleRequest).listen(port, '127.0.0.1', () => {
  console.log(`content api http://127.0.0.1:${port}`)
})
