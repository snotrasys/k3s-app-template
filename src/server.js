import express from 'express'

const app = express()
const PORT = process.env.PORT || 3000

const COMMIT = process.env.COMMIT_SHA || 'dev'
const BUILT_AT = process.env.BUILT_AT || 'dev'
const APP_NAME = process.env.APP_NAME || 'k3s-app-template'

app.get('/healthz', (_req, res) => res.type('text/plain').send('ok'))

app.get('/', (_req, res) => {
  res.type('html').send(`<!doctype html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${APP_NAME}</title>
<style>
  body{font-family:ui-monospace,monospace;background:#0a0a0f;color:#e6e6f0;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
  main{max-width:560px;padding:32px;border:1px solid #2a2a3e;border-radius:8px;background:#15151f}
  h1{font-size:20px;margin:0 0 16px;letter-spacing:-0.01em}
  .row{display:flex;justify-content:space-between;font-size:13px;padding:8px 0;border-bottom:1px solid #2a2a3e}
  .row:last-child{border:0}
  .k{color:#8b8ba6}
  .v{color:#4ade80}
</style></head>
<body>
  <main>
    <h1><span style="color:#4ade80">●</span> ${APP_NAME}</h1>
    <div class="row"><span class="k">commit</span><span class="v">${COMMIT}</span></div>
    <div class="row"><span class="k">built_at</span><span class="v">${BUILT_AT}</span></div>
    <div class="row"><span class="k">host</span><span class="v">${_req.headers.host}</span></div>
    <div class="row"><span class="k">runtime</span><span class="v">node ${process.version}</span></div>
  </main>
</body></html>`)
})

app.listen(PORT, () => console.log(`${APP_NAME} listening on :${PORT}`))
