import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import fs from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'

// Lokal muhitda .env.local faylidan o'zgaruvchilarni process.env ga yuklash
function loadLocalEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local')
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8')
    content.split('\n').forEach(line => {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...rest] = trimmed.split('=')
        if (key && rest.length > 0) {
          const val = rest.join('=').trim().replace(/^["']|["']$/g, '')
          if (!process.env[key.trim()]) {
            process.env[key.trim()] = val
          }
        }
      }
    })
  }
}

// Vite dev serverda Vercel serverless /api route larni to'g'ri ishlatish uchun plugin
function vercelApiDevPlugin() {
  loadLocalEnv()

  return {
    name: 'vercel-api-dev-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        // 1. /api/send-sms endpointi
        if (req.url?.startsWith('/api/send-sms')) {
          let body = ''
          req.on('data', chunk => { body += chunk })
          req.on('end', async () => {
            try {
              req.body = body ? JSON.parse(body) : {}
            } catch {
              req.body = {}
            }

            res.status = (code) => {
              res.statusCode = code
              return res
            }
            res.json = (data) => {
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify(data))
              return res
            }

            try {
              const smsApiPath = path.resolve(process.cwd(), 'api/send-sms.js')
              const fileUrl = pathToFileURL(smsApiPath).href + '?t=' + Date.now()
              const { default: handler } = await import(fileUrl)
              await handler(req, res)
            } catch (err) {
              console.error('[Vite Dev API] /api/send-sms xatosi:', err)
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: err.message }))
            }
          })
          return
        }

        // 2. /api/send-push endpointi
        if (req.url?.startsWith('/api/send-push')) {
          let body = ''
          req.on('data', chunk => { body += chunk })
          req.on('end', async () => {
            try {
              req.body = body ? JSON.parse(body) : {}
            } catch {
              req.body = {}
            }

            res.status = (code) => {
              res.statusCode = code
              return res
            }
            res.json = (data) => {
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify(data))
              return res
            }

            try {
              const pushApiPath = path.resolve(process.cwd(), 'api/send-push.js')
              const fileUrl = pathToFileURL(pushApiPath).href + '?t=' + Date.now()
              const { default: handler } = await import(fileUrl)
              await handler(req, res)
            } catch (err) {
              // Dev muhitida Firebase admin sozlanmagan bo'lsa ogohlantirish qaytaramiz
              console.warn('[Vite Dev API] /api/send-push xatosi:', err.message)
              res.statusCode = 200
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ success: false, message: 'Push dev serverda o\'tkazib yuborildi: ' + err.message }))
            }
          })
          return
        }

        next()
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), vercelApiDevPlugin()],
})
