import { spawn } from 'node:child_process'
import http from 'node:http'
import { once } from 'node:events'
import { setTimeout as delay } from 'node:timers/promises'

const cwd = process.cwd()
const runnerScript = process.argv[2] || 'tmp/smoke-public-i18n.mjs'
const serverMode = process.argv[3] === 'dev' ? 'dev' : 'preview'
const baseUrl = serverMode === 'dev' ? 'http://127.0.0.1:5173' : 'http://127.0.0.1:4173'

const isWin = process.platform === 'win32'
const npmCmd = isWin ? 'npm.cmd' : 'npm'
const npxCmd = isWin ? 'npx.cmd' : 'npx'
const spawnCmd = (command, options = {}) => {
  if (!isWin) {
    return spawn(command, { ...options, shell: true })
  }
  return spawn('cmd.exe', ['/d', '/s', '/c', command], options)
}

const waitForServer = async (url, timeoutMs = 60_000) => {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    const ok = await new Promise((resolve) => {
      const req = http.get(url, (res) => {
        res.resume()
        resolve(res.statusCode >= 200 && res.statusCode < 500)
      })
      req.on('error', () => resolve(false))
      req.setTimeout(2_000, () => {
        req.destroy()
        resolve(false)
      })
    })

    if (ok) return true
    await delay(1000)
  }
  return false
}

const run = async () => {
  console.log(`[runner] script: ${runnerScript}`)
  console.log(`[runner] mode: ${serverMode}`)
  const serverCommand =
    serverMode === 'dev'
      ? `${npmCmd} run dev -- --host 127.0.0.1 --port 5173`
      : `${npmCmd} run preview -- --host 127.0.0.1 --port 4173`
  const preview = spawnCmd(serverCommand, {
    cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  preview.stdout.on('data', (chunk) => process.stdout.write(`[preview] ${chunk}`))
  preview.stderr.on('data', (chunk) => process.stderr.write(`[preview] ${chunk}`))

  let exitCode = 1

  try {
    const ready = await waitForServer(baseUrl, 90_000)
    if (!ready) {
      throw new Error(`Preview server not ready at ${baseUrl}`)
    }
    console.log('[runner] preview ready')

    const smokeCommand = `${npxCmd} -y -p playwright node ${runnerScript}`
    console.log(`[runner] executing: ${smokeCommand}`)
    const smoke = spawnCmd(smokeCommand, {
      cwd,
      stdio: 'inherit',
      env: { ...process.env, BASE_URL: baseUrl },
    })

    const [code] = await once(smoke, 'exit')
    console.log(`[runner] smoke exit code: ${code}`)
    exitCode = Number(code ?? 1)
  } finally {
    if (!preview.killed) {
      preview.kill('SIGTERM')
      await delay(800)
      if (!preview.killed) {
        preview.kill('SIGKILL')
      }
    }
  }

  process.exit(exitCode)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
