// dsh-fairy host plugin.
//
// Two halves live in this bundle:
//   1. the `fairy` agent preset (declared in cordis.patch.yml — persona only);
//   2. the Fairy voice service (this file): browser routes that turn assistant
//      text into speech through a local GPT-SoVITS (cpufast) engine, the engine
//      lifecycle around it, and the two ways a reply gets spoken:
//        - 0.7.0 default: one short *summary* of the finished answer, produced by
//          a cheap auxiliary model call with a deterministic local fallback;
//        - `speakMode: 'full'`: the 0.6.x *live speaker* that starts talking
//          sentence by sentence while the reply is still streaming.
//
// The browser half (client/client.js) never sees the model text: the live
// speaker announces opaque speech ids over SSE (`<prefix>/live`), the automatic
// read-out is just `GET <prefix>/auto`, and every wav is fetched by id or served
// directly. Nothing here imports harness packages: the services are reached
// through `inject` / `ctx.get`, so the bundle keeps working across dsh versions
// without a peer dependency.
import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { connect } from 'node:net'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

export const name = 'dsh-fairy'
export const inject = ['webServer']

/** Voice-service defaults; every field is overridable from cordis.patch.yml. */
const DEFAULTS = {
  enabled: true,
  prefix: '/fairy-voice',
  /** GPT-SoVITS api_v2 server base URL. */
  engineUrl: 'http://127.0.0.1:9880',
  /** Spawn the engine on first use when it is not listening. */
  autoStart: true,
  /** Absolute path to the python executable of the engine venv. */
  engineCommand: '',
  engineArgs: [],
  engineCwd: '',
  engineEnv: {},
  /** Reference clip + its transcript (the voice the engine clones). */
  refAudio: '',
  refText: '',
  refLang: 'zh',
  textLang: 'zh',
  speed: 1.0,
  /** Upper bound on characters sent to the engine per request. */
  maxChars: 600,
  /** Where synthesized wavs are cached; empty disables the disk cache. */
  cacheDir: '',
  /** How long to wait for a cold engine before answering 503. */
  startTimeoutMs: 180000,
  synthesizeTimeoutMs: 180000,
  /**
   * What the automatic read-out speaks:
   *   'summary' — one short summary of the finished answer (default);
   *   'full'    — the whole answer, sentence by sentence, while it streams.
   */
  speakMode: 'summary',
  /** Target length (Chinese characters) of the spoken summary. */
  summaryChars: 60,
  /** Ask a model for the summary first; fall back to local extraction. */
  summaryLlm: true,
  /** Give up on the model summary after this long and extract locally. */
  summaryTimeoutMs: 6000,
  /** Never feed more than this many reply characters to the summarizer. */
  summaryMaxInputChars: 6000,
  /** Optional explicit route for the summary call; empty = the reply's own model. */
  summaryProvider: '',
  summaryModel: '',
  /** Speak sentences while the assistant reply is still streaming ('full' only). */
  streamSpeech: true,
  /** Preferred chars for the very first spoken chunk (short ⇒ sound sooner). */
  firstChunkChars: 14,
  /** Soft chars per spoken chunk before a comma is accepted as a cut. */
  speechChunkChars: 30,
  /** Characters that never make a standalone chunk. */
  minChunkChars: 4,
}

function mergeConfig(config) {
  const merged = { ...DEFAULTS }
  if (config && typeof config === 'object') {
    for (const [key, value] of Object.entries(config)) {
      if (key === 'engineEnv') merged.engineEnv = { ...DEFAULTS.engineEnv, ...(value || {}) }
      else merged[key] = value
    }
  }
  if (typeof merged.enabled !== 'boolean') throw new TypeError('dsh-fairy: config.enabled must be a boolean')
  if (typeof merged.autoStart !== 'boolean') throw new TypeError('dsh-fairy: config.autoStart must be a boolean')
  if (typeof merged.streamSpeech !== 'boolean') throw new TypeError('dsh-fairy: config.streamSpeech must be a boolean')
  if (typeof merged.summaryLlm !== 'boolean') throw new TypeError('dsh-fairy: config.summaryLlm must be a boolean')
  if (merged.speakMode !== 'summary' && merged.speakMode !== 'full') {
    throw new TypeError('dsh-fairy: config.speakMode must be "summary" or "full"')
  }
  if (!merged.prefix.startsWith('/')) throw new TypeError('dsh-fairy: config.prefix must start with "/"')
  for (const key of ['engineCommand', 'engineCwd', 'refAudio', 'refText', 'cacheDir', 'engineUrl', 'summaryProvider', 'summaryModel']) {
    if (typeof merged[key] !== 'string') throw new TypeError(`dsh-fairy: config.${key} must be a string`)
  }
  if (!Array.isArray(merged.engineArgs)) throw new TypeError('dsh-fairy: config.engineArgs must be an array')
  for (const key of ['firstChunkChars', 'speechChunkChars', 'minChunkChars', 'maxChars']) {
    if (!Number.isFinite(merged[key]) || merged[key] < 0) {
      throw new TypeError(`dsh-fairy: config.${key} must be a non-negative number`)
    }
  }
  if (!Number.isFinite(merged.summaryChars) || merged.summaryChars < 12 || merged.summaryChars > 400) {
    throw new TypeError('dsh-fairy: config.summaryChars must be between 12 and 400')
  }
  for (const key of ['summaryTimeoutMs', 'summaryMaxInputChars']) {
    if (!Number.isFinite(merged[key]) || merged[key] < 1) {
      throw new TypeError(`dsh-fairy: config.${key} must be a positive number`)
    }
  }
  return merged
}

/** Strip markdown/URLs so the engine speaks the words, not the syntax. */
export function speakableText(markdown) {
  if (typeof markdown !== 'string') return ''
  let text = markdown
  text = text.replace(/```[\s\S]*?```/g, '。代码见上文。')
  text = text.replace(/`([^`]+)`/g, '$1')
  text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, '')
  text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
  text = text.replace(/https?:\/\/\S+/g, '链接')
  text = text.replace(/<[^>]+>/g, '')
  text = text.replace(/^#{1,6}\s+/gm, '')
  text = text.replace(/^[-*+]\s+/gm, '')
  text = text.replace(/^>\s?/gm, '')
  text = text.replace(/[*_~|]/g, '')
  text = text.replace(/[ \t]+/g, ' ')
  text = text.replace(/\n{2,}/g, '\n')
  text = text.trim()
  return text
}

/**
 * Split assistant text into spoken chunks.
 *
 * Pure and incremental: the caller keeps `rest`, appends the next delta, and
 * rescans. Fenced code is dropped entirely (never spoken), the first chunk uses
 * a smaller budget so sound starts early, and a comma cuts a chunk only once it
 * is long enough to be worth a pause.
 *
 * Exported for the host smoke test; the browser never runs this.
 *
 * @param buffer - raw assistant text accumulated so far.
 * @param options - first/limit/min character budgets.
 * @returns `chunks` ready to speak plus the `rest` still buffering.
 */
export function splitSpeech(buffer, options = {}) {
  const first = options.first ?? DEFAULTS.firstChunkChars
  const limit = options.limit ?? DEFAULTS.speechChunkChars
  const min = options.min ?? DEFAULTS.minChunkChars
  const chunks = []
  let piece = ''
  let budget = Math.max(first, min)
  let i = 0
  while (i < buffer.length) {
    if (buffer.startsWith('```', i)) {
      if (piece.trim()) {
        chunks.push(piece)
        piece = ''
        budget = limit
      }
      const close = buffer.indexOf('```', i + 3)
      if (close < 0) return { chunks, rest: buffer.slice(i) }
      i = close + 3
      continue
    }
    const ch = buffer[i]
    i += 1
    piece += ch
    if (ch === '\n') {
      if (piece.trim().length >= budget) {
        chunks.push(piece)
        piece = ''
        budget = limit
      }
      continue
    }
    if ('。！？!?；;…'.includes(ch)) {
      if (piece.trim().length >= min) {
        chunks.push(piece)
        piece = ''
        budget = limit
      }
      continue
    }
    if (piece.trim().length >= budget) {
      const soft = '，、,'.includes(ch) || piece.trim().length >= budget * 2
      if (soft) {
        chunks.push(piece)
        piece = ''
        budget = limit
      }
    }
  }
  return { chunks, rest: piece }
}

// ---- spoken summary -------------------------------------------------------
// The automatic read-out speaks a short summary of the finished answer, not the
// whole answer: a coding reply is long, and reading code/commands/tables out
// loud is noise. Two lanes produce the summary, in order of preference:
//   1. one cheap auxiliary model call (same provider the reply came from), and
//   2. a deterministic local extraction of the reply's opening conclusion.
// Lane 2 is the floor: it never needs a model, never fails, and is fast enough
// to answer in the time it takes the engine to synthesize one sentence.

/** Smallest summary the code will produce; below this the sentence is cut. */
const SUMMARY_FLOOR = 12

/** Prefer a punctuation boundary when a spoken sentence must be cut. */
function truncateSpeech(text, limit) {
  const budget = Math.max(SUMMARY_FLOOR, Number(limit) || DEFAULTS.summaryChars)
  if (text.length <= budget) return text
  const head = text.slice(0, budget)
  let cut = -1
  for (const mark of ['。', '！', '？', '!', '?', '；', ';', '…']) {
    cut = Math.max(cut, head.lastIndexOf(mark))
  }
  if (cut < Math.floor(budget / 2)) {
    let soft = -1
    for (const mark of ['，', '、', ',', '：', ':']) soft = Math.max(soft, head.lastIndexOf(mark))
    cut = soft >= Math.floor(budget / 2) ? soft : -1
  }
  const piece = (cut >= 0 ? head.slice(0, cut + 1) : head).replace(/[\s，、,：:；;—\-]+$/u, '')
  if (!piece) return ''
  return /[。！？!?…]$/u.test(piece) ? piece : `${piece}。`
}

/** Drop everything that must not be spoken: code, tables, markup, URLs. */
function stripForSpeech(markdown) {
  let text = String(markdown == null ? '' : markdown)
  text = text.replace(/<!--[\s\S]*?-->/g, ' ')
  text = text.replace(/```[\s\S]*?```/g, '\n')
  text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
  text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
  text = text.replace(/<[^>]+>/g, ' ')
  text = text
    .split(/\r?\n/)
    .filter((line) => !/^\s*\|/.test(line))
    .join('\n')
  // inline code is usually a path, identifier or command: do not pronounce it
  text = text.replace(/`[^`]*`/g, ' ')
  text = text.replace(/^#{1,6}\s*.*$/gm, '')
  text = text.replace(/^[-*+]\s+/gm, '')
  text = text.replace(/^>\s?/gm, '')
  text = text.replace(/^\d+[.)、]\s*/gm, '')
  text = text.replace(/[*_~|]/g, '')
  text = text.replace(/[ \t]+/g, ' ')
  return text.trim()
}

/** Split one paragraph into sentences, keeping the closing punctuation. */
function chunkSentences(text) {
  const out = []
  let piece = ''
  for (const ch of text) {
    piece += ch
    if ('。！？!?；;…\n'.includes(ch)) {
      if (piece.trim()) out.push(piece.trim())
      piece = ''
    }
  }
  if (piece.trim()) out.push(piece.trim())
  return out
}

/** One sentence ready to speak: no dangling comma/colon, closing punctuation. */
function spokenSentence(piece) {
  const trimmed = String(piece == null ? '' : piece)
    .trim()
    .replace(/[\s，、,：:；;—\-]+$/u, '')
  if (!trimmed) return ''
  return /[。！？!?…]$/u.test(trimmed) ? trimmed : `${trimmed}。`
}

/**
 * Deterministic local summary: the reply's opening conclusion, within `maxChars`.
 *
 * Pure and exported for the smoke test. The agent's replies are conclusion-first,
 * so the first paragraph usually *is* the summary; the fallback exists for every
 * reply whose model call did not answer.
 *
 * @param markdown - full assistant reply.
 * @param maxChars - character budget of the spoken summary.
 * @returns one or two sentences, or an empty string when there is no prose.
 */
export function extractSummary(markdown, maxChars = DEFAULTS.summaryChars) {
  const limit = Math.max(SUMMARY_FLOOR, Number(maxChars) || DEFAULTS.summaryChars)
  const cleaned = stripForSpeech(markdown)
  if (!cleaned) return ''
  let summary = ''
  for (const paragraph of cleaned.split(/\n{2,}|\n/)) {
    const sentences = []
    for (const sentence of chunkSentences(paragraph)) {
      if (!/[0-9A-Za-z\u3400-\u9fff]/u.test(sentence)) continue
      sentences.push(spokenSentence(sentence))
      if (sentences.join('').length >= limit) break
    }
    if (sentences.length === 0) continue
    summary = sentences.join('')
    break
  }
  if (!summary) return ''
  return truncateSpeech(summary, limit)
}

/**
 * Clean one model-produced summary before it is spoken.
 *
 * The model is instructed to return plain prose, but a stray label, quote,
 * newline or Markdown leftover must never reach the engine (it would be read
 * aloud). Exported for the smoke test.
 *
 * @param text - raw model output.
 * @param maxChars - character budget of the spoken summary.
 * @returns plain one-line summary, or an empty string when nothing usable.
 */
export function sanitizeSummary(text, maxChars = DEFAULTS.summaryChars) {
  if (typeof text !== 'string') return ''
  const limit = Math.max(SUMMARY_FLOOR, Number(maxChars) || DEFAULTS.summaryChars)
  let out = text.replace(/```[\s\S]*?```/g, ' ').replace(/<!--[\s\S]*?-->/g, ' ')
  out = out.replace(/`[^`]*`/g, ' ')
  out = out.replace(/\r?\n+/g, ' ').replace(/\s+/g, ' ').trim()
  out = out.replace(/^(语音摘要|摘要|播报|语音版|朗读版)\s*[:：]\s*/u, '')
  out = out.replace(/^[*#>]+\s*/, '')
  out = out.replace(/\*\*|__|`|~~/g, '')
  out = out.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
  out = out.replace(/^[「『“"'【\[]+/u, '').replace(/[」』”"'】\]]+$/u, '')
  out = out.replace(/\s+([，。！？、；：])/g, '$1')
  out = out.replace(/([，。！？、；：])\s+/g, '$1')
  out = out.replace(/\s+/g, ' ').trim()
  if (!out || !/[0-9A-Za-z\u3400-\u9fff]/u.test(out)) return ''
  if (out.length > limit) return truncateSpeech(out, limit)
  return spokenSentence(out)
}

/** System instruction for the auxiliary summary call. */
function summaryPrompt(limit) {
  return [
    '你是 Fairy（Ⅲ型总序式集成泛用人工智能）的语音播报摘要器。',
    '把下面这条助手回复压缩成一句适合朗读的中文口语摘要。',
    '要求：只保留结论、关键动作与重要数字；删掉过程、代码、命令、路径、表格、清单和 Markdown 符号。',
    '用 Fairy 的口吻：以协议词起句（回答/检索完成/结论/注意/记录），可以称呼「主人」，克制、礼貌。',
    `最多 ${limit} 个汉字，一到两句。只输出摘要正文，不要引号、前缀、解释或换行。`,
  ].join('\n')
}

/** Message body of one `assistant/message` log event, or null. */
function eventMessage(event) {
  if (!event || event.type !== 'assistant/message') return null
  const message = event.data && event.data.message
  return message && typeof message === 'object' ? message : null
}

/** Joined text blocks of one message (empty string when it carries no prose). */
function messageText(message) {
  if (!message || !Array.isArray(message.content)) return ''
  const parts = []
  for (const block of message.content) {
    if (block && block.type === 'text' && typeof block.text === 'string') parts.push(block.text)
  }
  return parts.join('\n')
}

/** Text worth auto-reading: prose with no tool calls (the step's final answer). */
function finalAnswerText(message) {
  const content = message && Array.isArray(message.content) ? message.content : []
  if (content.some((block) => block && block.type === 'tool-call')) return null
  const text = messageText(message)
  return text.trim() ? text : null
}


function reply(res, status, body, headers) {
  const payload = typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...(headers || {}),
  })
  res.end(payload)
}

function waitForPort(host, port, timeoutMs, abort) {
  const deadline = Date.now() + timeoutMs
  return new Promise((resolve) => {
    const attempt = () => {
      if (abort && abort()) {
        resolve(false)
        return
      }
      const socket = connect({ host, port })
      socket.setTimeout(1500)
      socket.once('connect', () => {
        socket.destroy()
        resolve(true)
      })
      socket.once('timeout', () => {
        socket.destroy()
        retry()
      })
      socket.once('error', () => {
        socket.destroy()
        retry()
      })
      function retry() {
        if (Date.now() > deadline) resolve(false)
        else setTimeout(attempt, 400)
      }
    }
    attempt()
  })
}

const MIME = 'audio/wav'
const HEARTBEAT_MS = 15000
const SPOKEN_LIMIT = 400
const SPEECH_BANK_LIMIT = 96

export function apply(ctx, config) {
  const cfg = mergeConfig(config)
  const logger = ctx.logger || console
  // The live speaker only makes sense when the whole answer is spoken: a summary
  // can only be produced after the reply is complete.
  const liveEnabled = cfg.speakMode === 'full' && cfg.streamSpeech

  // ---- balance (0.26.0) ---------------------------------------------------
  // The sidebar strip needs the account balance and today's observed spend.
  // Until now the browser read them from the balance widget's route; the skin
  // now owns the read so the strip keeps working when that plugin is not
  // installed (user: it was uninstalled while this skin was being built).
  //   - the key is resolved per request through ctx.credentials (environment,
  //     provider store, .env), never cached and never handed to the page;
  //   - today's spend is a balance-difference observation kept in
  //     $DSH_HOME/fairy-balance.json — opening balance at the day's first
  //     reading, minus the latest one (the same accounting the widget used);
  //   - the reply is numbers only: { ok, balance, currency, todayUsed, day }.
  // Unavailable states are still HTTP 200 with ok:false and a code, so the
  // strip can say why instead of showing a network error.
  const BALANCE_API = 'https://api.deepseek.com/user/balance'
  const BALANCE_PREFIX = '/fairy-balance'
  const BALANCE_TTL_MS = 25000
  const BALANCE_STORE = 'fairy-balance.json'
  let balanceCache = null // { at, payload }

  function beijingDay(at) {
    return new Date(Number(at) + 8 * 3600000).toISOString().slice(0, 10)
  }

  function balanceStorePath() {
    const home = process.env.DSH_HOME || join(homedir(), '.dsh')
    return join(home, BALANCE_STORE)
  }

  async function readBalanceStore() {
    try {
      return JSON.parse(await readFile(balanceStorePath(), 'utf8'))
    } catch {
      return null
    }
  }

  async function writeBalanceStore(row) {
    try {
      const target = balanceStorePath()
      await mkdir(dirname(target), { recursive: true })
      await writeFile(target, JSON.stringify(row), 'utf8')
    } catch (error) {
      logger.warn('[dsh-fairy] balance store write failed:', error && error.message ? error.message : error)
    }
  }

  async function readDeepSeekBalance() {
    const credentials = ctx.get ? ctx.get('credentials') : undefined
    const cred = credentials && typeof credentials.resolve === 'function'
      ? await credentials.resolve('DEEPSEEK_API_KEY')
      : undefined
    if (!cred || !cred.value) return { ok: false, code: 'NO_KEY', error: '未配置 DEEPSEEK_API_KEY' }
    const upstream = await fetch(BALANCE_API, {
      headers: { Authorization: `Bearer ${cred.value}` },
      signal: AbortSignal.timeout(8000),
    })
    if (!upstream.ok) {
      return { ok: false, code: 'HTTP', status: upstream.status, error: `余额接口返回 ${upstream.status}` }
    }
    const body = await upstream.json()
    const info = Array.isArray(body && body.balance_infos) ? body.balance_infos[0] : null
    const balance = info ? Number(info.total_balance) : NaN
    if (!Number.isFinite(balance)) return { ok: false, code: 'EMPTY', error: '余额接口没有可用的账户信息' }
    return { ok: true, balance, currency: String(info.currency || 'CNY').toUpperCase() }
  }

  async function handleBalance(req, res) {
    const now = Date.now()
    if (balanceCache && now - balanceCache.at < BALANCE_TTL_MS) return reply(res, 200, balanceCache.payload)
    try {
      const read = await readDeepSeekBalance()
      if (!read.ok) return reply(res, 200, read)
      const day = beijingDay(now)
      const previous = await readBalanceStore()
      const sameDay = previous && previous.day === day && previous.currency === read.currency
      const row = sameDay
        ? previous
        : { day, currency: read.currency, opening: read.balance, last: read.balance }
      if (sameDay) {
        // A top-up must not erase the day's spend: raising the new balance by the
        // same delta keeps opening - balance continuous across a recharge.
        const delta = read.balance - Number(row.last)
        if (delta > 0) row.opening = Number(row.opening) + delta
      }
      row.last = read.balance
      row.at = now
      const todayUsed = Math.max(0, Math.round((row.opening - read.balance) * 100) / 100)
      await writeBalanceStore(row)
      const payload = {
        ok: true,
        balance: Math.round(read.balance * 100) / 100,
        currency: read.currency,
        todayUsed,
        day,
        observedAt: new Date(now).toISOString(),
        source: 'balance-observed',
      }
      balanceCache = { at: now, payload }
      return reply(res, 200, payload)
    } catch (error) {
      logger.warn('[dsh-fairy] balance read failed:', error && error.message ? error.message : error)
      return reply(res, 200, { ok: false, code: 'FAILED', error: String((error && error.message) || error) })
    }
  }

  // Mounted on its own path and before the voice gate, so turning the voice
  // service off (`config.enabled: false`) never takes the sidebar strip's data
  // with it. `config.balance: false` is the switch that removes this route.
  ctx.effect(() => {
    if (cfg.balance === false) return undefined
    const disposeRoute = ctx.webServer.register({ kind: 'prefix', path: BALANCE_PREFIX, handler: handleBalance })
    logger.info?.(`[dsh-fairy] balance route mounted at ${BALANCE_PREFIX}`)
    return () => {
      disposeRoute()
      balanceCache = null
    }
  }, 'dsh-fairy: balance route')

  if (!cfg.enabled) return

  // ---- engine lifecycle --------------------------------------------------
  let child = null
  let starting = null

  function engineOrigin() {
    try {
      const u = new URL(cfg.engineUrl)
      return { host: u.hostname, port: Number(u.port || 80) }
    } catch {
      return { host: '127.0.0.1', port: 9880 }
    }
  }

  async function isListening() {
    const { host, port } = engineOrigin()
    return waitForPort(host, port, 600)
  }

  async function startEngine() {
    if (!cfg.autoStart || cfg.engineCommand === '') return false
    if (child && child.exitCode === null) return true
    const { port } = engineOrigin()
    let spawnError = null
    try {
      child = spawn(cfg.engineCommand, cfg.engineArgs, {
        cwd: cfg.engineCwd || undefined,
        env: { ...process.env, ...cfg.engineEnv },
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
      })
      logger.info?.(`[dsh-fairy] voice engine starting: ${cfg.engineCommand}`)
    } catch (error) {
      logger.warn('[dsh-fairy] voice engine spawn failed:', error && error.message ? error.message : error)
      return false
    }
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    const tail = []
    const collect = (chunk) => {
      tail.push(chunk)
      while (tail.length > 40) tail.shift()
    }
    child.stdout.on('data', collect)
    child.stderr.on('data', collect)
    child.once('error', (error) => {
      // EPERM/ENOENT arrives here, not as a throw — never leave it unhandled.
      spawnError = error
      logger.warn('[dsh-fairy] voice engine process error:', error && error.message ? error.message : error)
      child = null
    })
    child.once('exit', (code) => {
      if (code !== 0) logger.warn(`[dsh-fairy] voice engine exited with ${code}: ${tail.join('').slice(-800)}`)
      child = null
      // an engine restart must pay the one-time setup again
      warmDone = false
    })
    const ready = await waitForPort(engineOrigin().host, port, cfg.startTimeoutMs, () => spawnError !== null)
    if (!ready) {
      logger.warn('[dsh-fairy] voice engine did not open its port in time')
      return false
    }
    return true
  }

  async function ensureEngine() {
    if (await isListening()) return true
    if (!cfg.autoStart) return false
    if (!starting) {
      starting = startEngine().finally(() => {
        starting = null
      })
    }
    return starting
  }

  // one synthesis at a time: the CPU engine is single-threaded anyway
  let synthChain = Promise.resolve()
  const serial = (task) => {
    const run = synthChain.then(task, task)
    synthChain = run.catch(() => {})
    return run
  }

  const memoryCache = new Map()

  async function cachePath(key) {
    if (!cfg.cacheDir) return null
    const dir = join(cfg.cacheDir, key.slice(0, 2))
    await mkdir(dir, { recursive: true })
    return join(dir, `${key}.wav`)
  }

  async function synthesize(text, force = false) {
    const clean = speakableText(text).slice(0, cfg.maxChars)
    if (!clean) return null
    const key = createHash('sha1')
      .update(`${cfg.refAudio}\u0000${cfg.refText}\u0000${cfg.speed}\u0000${clean}`)
      .digest('hex')
    if (!force) {
      if (memoryCache.has(key)) return memoryCache.get(key)
      const cached = await cachePath(key)
      if (cached && existsSync(cached)) {
        const buf = await readFile(cached)
        memoryCache.set(key, buf)
        return buf
      }
    }
    const file = force ? null : await cachePath(key)
    if (!(await ensureEngine())) return null
    const body = {
      text: clean,
      text_lang: cfg.textLang,
      ref_audio_path: cfg.refAudio,
      prompt_text: cfg.refText,
      prompt_lang: cfg.refLang,
      text_split_method: 'cut5',
      batch_size: 1,
      media_type: 'wav',
      streaming_mode: false,
      speed_factor: cfg.speed,
      seed: -1,
    }
    const res = await fetch(`${cfg.engineUrl.replace(/\/$/, '')}/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(cfg.synthesizeTimeoutMs),
    })
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      throw new Error(`voice engine ${res.status}: ${detail.slice(0, 400)}`)
    }
    const wav = Buffer.from(await res.arrayBuffer())
    memoryCache.set(key, wav)
    if (memoryCache.size > 64) memoryCache.delete(memoryCache.keys().next().value)
    if (file) await writeFile(file, wav)
    return wav
  }

  // ---- spoken summary ----------------------------------------------------
  const summaryCache = new Map()
  const summaryInFlight = new Map()
  const SUMMARY_CACHE_LIMIT = 200

  /** Route for the auxiliary summary call: explicit config, or the reply's model. */
  function summaryRoute(message) {
    if (cfg.summaryProvider && cfg.summaryModel) {
      return { provider: cfg.summaryProvider, model: cfg.summaryModel }
    }
    const source = message && message.source
    if (
      source &&
      source.kind === 'model' &&
      typeof source.provider === 'string' &&
      source.provider &&
      typeof source.model === 'string' &&
      source.model
    ) {
      return { provider: source.provider, model: source.model }
    }
    try {
      const model = ctx.get('agentDefaultModel')
      const selection = model && typeof model.currentSelection === 'function' ? model.currentSelection() : null
      if (selection && typeof selection.provider === 'string' && typeof selection.model === 'string') {
        return { provider: selection.provider, model: selection.model }
      }
    } catch (error) {
      // no default-model service: the extractive lane still works
    }
    return null
  }

  function isReasoningEffortRejection(error) {
    if (!error) return false
    if (error.code === 'UNSUPPORTED_REASONING_EFFORT') return true
    const message = String(error.message || '')
    return /reasoning effort/i.test(message) && /(unsupported|does not support)/i.test(message)
  }

  /** Resolve `promise` after at most `ms`, so one stuck stream cannot hang a route. */
  function withDeadline(promise, ms) {
    let timer = null
    return Promise.race([
      promise,
      new Promise((resolve) => {
        timer = setTimeout(() => resolve(undefined), ms)
        timer.unref?.()
      }),
    ]).finally(() => {
      if (timer) clearTimeout(timer)
    })
  }

  /**
   * One auxiliary model call that compresses the reply into a spoken line.
   *
   * The route is the reply's own provider/model, and the request deliberately
   * carries no session id and no tool schemas: this is a side conversation, not
   * a step of the agent loop. Failures are swallowed — the extractive lane owns
   * the floor.
   */
  async function llmSummary(reply, route) {
    const llm = ctx.get('llm')
    if (!llm || typeof llm.stream !== 'function') return null
    const input = reply.slice(0, cfg.summaryMaxInputChars)
    if (!input.trim()) return null
    const base = {
      provider: route.provider,
      model: route.model,
      system: summaryPrompt(cfg.summaryChars),
      messages: [{ role: 'user', content: [{ type: 'text', text: `生成语音摘要：\n${input}` }] }],
      maxTokens: Math.min(400, Math.max(160, cfg.summaryChars * 3)),
      temperature: 0.2,
    }
    const attempt = async (withEffort) => {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), cfg.summaryTimeoutMs)
      timer.unref?.()
      try {
        let text = ''
        const stream = llm.stream({ ...base, ...(withEffort ? { reasoningEffort: 'off' } : {}), signal: controller.signal })
        for await (const chunk of stream) {
          if (chunk && chunk.type === 'text-delta' && typeof chunk.text === 'string') text += chunk.text
        }
        return text
      } finally {
        clearTimeout(timer)
      }
    }
    try {
      const text = await withDeadline(attempt(true), cfg.summaryTimeoutMs + 1500)
      return text ? sanitizeSummary(text, cfg.summaryChars) || null : null
    } catch (error) {
      if (!isReasoningEffortRejection(error)) {
        logger.warn('[dsh-fairy] summary model failed:', error && error.message ? error.message : error)
        return null
      }
    }
    // a provider that rejects "off" reasoning still gets one plain attempt
    try {
      const text = await withDeadline(attempt(false), cfg.summaryTimeoutMs + 1500)
      return text ? sanitizeSummary(text, cfg.summaryChars) || null : null
    } catch (error) {
      logger.warn('[dsh-fairy] summary model retry failed:', error && error.message ? error.message : error)
      return null
    }
  }

  /**
   * Summary used for one assistant message, cached per message id.
   * Concurrent callers (auto read-out racing a manual replay) share one model call.
   * @returns `{ text, via: 'llm' | 'extract' }`, or null when the reply has no prose.
   */
  async function summarizeForSpeech(messageId, message) {
    const cached = summaryCache.get(messageId)
    if (cached) return cached
    const pending = summaryInFlight.get(messageId)
    if (pending) return pending
    const reply = finalAnswerText(message)
    if (!reply) return null
    const job = (async () => {
      let entry = null
      if (cfg.summaryLlm) {
        const route = summaryRoute(message)
        if (route) {
          const text = await llmSummary(reply, route)
          if (text) entry = { text, via: 'llm', route }
        }
      }
      if (!entry) {
        const text = extractSummary(reply, cfg.summaryChars)
        if (!text) return null
        entry = { text, via: 'extract' }
      }
      summaryCache.set(messageId, entry)
      if (summaryCache.size > SUMMARY_CACHE_LIMIT) summaryCache.delete(summaryCache.keys().next().value)
      return entry
    })()
    summaryInFlight.set(messageId, job)
    try {
      return await job
    } finally {
      summaryInFlight.delete(messageId)
    }
  }

  // ---- live speaker ------------------------------------------------------
  // While an assistant attempt streams, complete sentences are synthesized in
  // arrival order and announced over SSE. A listener is any browser tab that
  // asked for this session's live stream; with none connected nothing is
  // synthesized and the browser's finalized-message fallback owns the reply.
  const listeners = new Set()
  const speakers = new Map()
  const quiet = new Set()
  const spokenMessages = new Set()
  const autoInFlight = new Set()
  const bank = new Map()

  function speechId(text) {
    return createHash('sha1').update(text).digest('hex').slice(0, 24)
  }

  function bankPut(id, wav) {
    bank.set(id, wav)
    if (bank.size > SPEECH_BANK_LIMIT) bank.delete(bank.keys().next().value)
  }

  function hasListener(sessionId) {
    for (const listener of listeners) {
      if (!sessionId || listener.session === sessionId) return true
    }
    return false
  }

  function broadcast(sessionId, payload) {
    const data = `data: ${JSON.stringify(payload)}\n\n`
    for (const listener of listeners) {
      if (listener.session !== sessionId) continue
      try {
        listener.res.write(data)
      } catch (error) {
        // a dead socket removes itself through its close handler
      }
    }
  }

  function rememberSpoken(messageId) {
    spokenMessages.add(messageId)
    if (spokenMessages.size > SPOKEN_LIMIT) spokenMessages.delete(spokenMessages.values().next().value)
  }

  function messageIdOf(agent, frame) {
    const session = agent && agent.session
    if (!session) return null
    const outcome = frame.outcome
    if (outcome && outcome.kind === 'committed') {
      const event = typeof session.eventAt === 'function' ? session.eventAt(outcome.seq) : undefined
      if (event && event.type === 'assistant/message') {
        const id = event.data && event.data.message && event.data.message.id
        if (id) return id
      }
    }
    const events = typeof session.snapshotEvents === 'function' ? session.snapshotEvents() : []
    for (let i = events.length - 1; i >= 0; i -= 1) {
      const event = events[i]
      if (event && event.type === 'assistant/message') {
        const id = event.data && event.data.message && event.data.message.id
        if (id) return id
      }
    }
    return null
  }

  function enqueueSpeech(speaker, raw) {
    if (!speaker || speaker.skipped) return
    const text = speakableText(raw).slice(0, cfg.maxChars)
    if (!text) return
    speaker.queued += 1
    speaker.chain = speaker.chain
      .then(async () => {
        if (speaker.cancelled || quiet.has(speaker.sessionId)) return
        if (!hasListener(speaker.sessionId)) return
        const wav = await serial(() => synthesize(text))
        if (!wav) return
        const id = speechId(text)
        bankPut(id, wav)
        speaker.spoken += 1
        broadcast(speaker.sessionId, {
          type: 'speech',
          session: speaker.sessionId,
          id,
          index: speaker.spoken,
          chars: text.length,
        })
      })
      .catch((error) => {
        logger.warn('[dsh-fairy] live speech failed:', error && error.message ? error.message : error)
      })
  }

  function flushSpeech(speaker) {
    if (!speaker || speaker.skipped) return
    if (speaker.buffer.trim()) {
      enqueueSpeech(speaker, speaker.buffer)
      speaker.buffer = ''
    }
  }

  function feedSpeech(speaker, text) {
    if (!speaker || speaker.skipped || !text) return
    speaker.buffer += text
    const { chunks, rest } = splitSpeech(speaker.buffer, {
      first: cfg.firstChunkChars,
      limit: cfg.speechChunkChars,
      min: cfg.minChunkChars,
    })
    speaker.buffer = rest
    for (const chunk of chunks) enqueueSpeech(speaker, chunk)
  }

  function onAssistantFrame(payload) {
    if (!liveEnabled) return
    const agent = payload && payload.agent
    const frame = payload && payload.frame
    const session = agent && agent.session
    const sessionId = session && session.id
    if (!sessionId || !frame) return

    if (frame.type === 'start') {
      quiet.delete(sessionId)
      const speaker = {
        sessionId,
        attemptId: frame.attemptId,
        buffer: '',
        spoken: 0,
        queued: 0,
        skipped: !hasListener(sessionId),
        cancelled: false,
        chain: Promise.resolve(),
      }
      speakers.set(sessionId, speaker)
      return
    }

    const speaker = speakers.get(sessionId)
    if (!speaker) return

    if (frame.type === 'chunk') {
      const chunk = frame.chunk
      if (chunk && chunk.type === 'text-delta' && typeof chunk.text === 'string') {
        feedSpeech(speaker, chunk.text)
      }
      return
    }

    if (frame.type === 'end') {
      flushSpeech(speaker)
      const messageId = messageIdOf(agent, frame)
      // Mark the reply as live-spoken *before* the chain drains: the browser asks
      // `/auto` the moment the finalized message renders, and that answer must
      // not depend on how long the remaining sentences take to synthesize.
      if (messageId && speaker.queued > 0) rememberSpoken(messageId)
      const finish = speaker.chain.then(() => {
        if (speakers.get(sessionId) === speaker) speakers.delete(sessionId)
        broadcast(sessionId, {
          type: 'done',
          session: sessionId,
          message: messageId,
          // read after the chain drained: this is the final count
          spoken: speaker.spoken,
        })
        if (messageId && speaker.spoken > 0) rememberSpoken(messageId)
      })
      speaker.chain = finish
    }
  }

  // The engine pays a one-time setup cost on its first request after a cold
  // start (reference-audio + text-frontend graphs, ~10 s on this box). Absorb it
  // in the background when a voice-enabled tab connects, so the first reply does
  // not pay it. The probe sentence is cached on disk like any other chunk.
  let warmPromise = null
  let warmDone = false
  function warmSpeech() {
    if (warmDone) return Promise.resolve(true)
    if (warmPromise) return warmPromise
    warmPromise = (async () => {
      const ready = await ensureEngine()
      if (!ready) return false
      try {
        // force: never answer from the cache — the point is the model setup
        await serial(() => synthesize('嗯。', true))
      } catch (error) {
        logger.warn('[dsh-fairy] engine warm-up failed:', error && error.message ? error.message : error)
      }
      warmDone = true
      return true
    })().finally(() => {
      warmPromise = null
    })
    return warmPromise
  }

  // ---- session log lookup ------------------------------------------------
  function persistence() {
    return ctx.get('sessionPersistence')
  }

  /** Session events, live memory first (the newest reply may not be on disk yet). */
  async function sessionEvents(sessionId) {
    const sessions = ctx.get('sessions')
    const live = sessions && typeof sessions.get === 'function' ? sessions.get(sessionId) : undefined
    if (live && typeof live.snapshotEvents === 'function') return live.snapshotEvents()
    const store = persistence()
    if (!store) return null
    const handle = await store.open(sessionId, 'read')
    try {
      const { events } = await handle.read()
      return events
    } finally {
      await handle.close()
    }
  }

  /**
   * Find one assistant message in the log, with the position of the newest
   * user message so callers can stay inside the current turn.
   */
  function findAssistant(events, messageId) {
    if (!Array.isArray(events)) return null
    let lastUser = -1
    let found = -1
    for (let i = 0; i < events.length; i += 1) {
      const event = events[i]
      if (!event) continue
      if (event.type === 'user/message') {
        lastUser = i
        continue
      }
      const message = eventMessage(event)
      if (message && message.id === messageId) found = i
    }
    if (found < 0) return null
    return { message: eventMessage(events[found]), index: found, lastUser, events }
  }

  async function assistantMessage(sessionId, messageId) {
    const events = await sessionEvents(sessionId)
    return events ? findAssistant(events, messageId) : null
  }

  /** Full text of one message (the manual whole-reply read-out). */
  async function assistantText(sessionId, messageId) {
    const found = await assistantMessage(sessionId, messageId)
    if (!found) return null
    const text = messageText(found.message)
    return text.trim() ? text : null
  }

  // ---- routes ------------------------------------------------------------
  function sendWav(res, wav) {
    res.writeHead(200, {
      'Content-Type': MIME,
      'Content-Length': String(wav.length),
      'Cache-Control': 'no-store',
    })
    res.end(wav)
  }

  async function handleStatus(req, res, url) {
    if (url.searchParams.get('warm') === '1' && !(await isListening())) {
      // pre-warm in the background: the first reply should not pay the model load
      void warmSpeech()
    }
    const ready = await isListening()
    return reply(res, 200, {
      enabled: true,
      engine: ready ? 'ready' : starting ? 'starting' : child ? 'starting' : 'offline',
      autoStart: cfg.autoStart,
      engineUrl: cfg.engineUrl,
      voice: Boolean(cfg.refAudio && cfg.refText),
      speakMode: cfg.speakMode,
      summary: { chars: cfg.summaryChars, llm: cfg.summaryLlm, cached: summaryCache.size },
      streaming: cfg.speakMode === 'full' && cfg.streamSpeech,
      listeners: listeners.size,
    })
  }

  async function readJson(req) {
    const chunks = []
    for await (const chunk of req) {
      chunks.push(chunk)
      if (chunks.reduce((n, b) => n + b.length, 0) > 65536) throw new Error('request too large')
    }
    if (chunks.length === 0) return {}
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  }

  /** SSE: announce completed spoken chunks for one session, and pre-warm. */
  function handleLive(req, res, url) {
    const sessionId = url.searchParams.get('session') || ''
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      // the webserver's gzip layer already skips event-stream; these headers keep
      // an intermediate proxy from buffering the stream
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    })
    res.write(': fairy-voice live\n\n')
    res.write(`data: ${JSON.stringify({ type: 'hello', session: sessionId || null, streaming: liveEnabled, speakMode: cfg.speakMode })}\n\n`)

    const listener = { res, session: sessionId, heartbeat: null }
    listeners.add(listener)
    listener.heartbeat = setInterval(() => {
      try {
        res.write(': ping\n\n')
      } catch (error) {
        // the close handler cleans up
      }
    }, HEARTBEAT_MS)
    listener.heartbeat.unref?.()

    const cleanup = () => {
      if (!listeners.has(listener)) return
      listeners.delete(listener)
      if (listener.heartbeat) clearInterval(listener.heartbeat)
      try {
        res.end()
      } catch (error) {
        // already closed
      }
    }
    res.on('close', cleanup)
    res.on('error', cleanup)
    req.on('close', cleanup)

    // keep the model warm while a voice-enabled tab is open
    void warmSpeech()
  }

  function handleSpeech(req, res, url) {
    const id = url.searchParams.get('id')
    if (!id) return reply(res, 400, { error: 'id required' })
    const wav = bank.get(id)
    if (!wav) return reply(res, 404, { error: 'unknown speech id' })
    return sendWav(res, wav)
  }

  async function handleQuiet(req, res) {
    let sessionId = null
    try {
      if (req.method === 'POST') {
        const body = await readJson(req)
        sessionId = typeof body.session === 'string' ? body.session : null
      } else {
        const url = new URL(req.url, 'http://localhost')
        sessionId = url.searchParams.get('session')
      }
    } catch (error) {
      return reply(res, 400, { error: 'invalid body' })
    }
    if (sessionId) {
      quiet.add(sessionId)
      const speaker = speakers.get(sessionId)
      if (speaker) {
        speaker.cancelled = true
        speaker.buffer = ''
      }
    }
    return reply(res, 200, { quiet: Boolean(sessionId) })
  }

  async function handleTts(req, res) {
    try {
      let text = null
      let sessionId = null
      let messageId = null
      let mode = null
      const url = new URL(req.url, 'http://localhost')
      if (req.method === 'POST') {
        const body = await readJson(req)
        text = typeof body.text === 'string' ? body.text : null
        sessionId = typeof body.session === 'string' ? body.session : null
        messageId = typeof body.message === 'string' ? body.message : null
        mode = typeof body.mode === 'string' ? body.mode : null
      } else {
        text = url.searchParams.get('text')
        sessionId = url.searchParams.get('session')
        messageId = url.searchParams.get('message')
        mode = url.searchParams.get('mode')
      }
      if (!text && sessionId && messageId) {
        if (mode === 'summary') {
          // Manual "read the summary" replay: same text the auto path spoke,
          // but never marked as spoken, so it can be replayed.
          const found = await assistantMessage(sessionId, messageId)
          const summary = found ? await summarizeForSpeech(messageId, found.message) : null
          if (summary) text = summary.text
        } else {
          text = await assistantText(sessionId, messageId)
        }
      }
      if (!text) return reply(res, 204, '')
      const wav = await serial(() => synthesize(text))
      if (!wav) return reply(res, 503, { error: 'voice engine unavailable', autoStart: cfg.autoStart })
      return sendWav(res, wav)
    } catch (error) {
      logger.warn('[dsh-fairy] voice synthesis failed:', error && error.message ? error.message : error)
      if (!res.headersSent) return reply(res, 502, { error: String((error && error.message) || error) })
    }
  }

  /**
   * Automatic read-out of one finalized answer.
   *
   * Only the message that closes the current turn is spoken: a historical reply
   * the user scrolls past, a progress preamble, or a message that still carries
   * tool calls all answer 204. With `speakMode: 'summary'` the spoken text is the
   * short summary; `'full'` keeps the 0.6.x whole-reply fallback for a reply the
   * live speaker missed. When the live speaker already spoke this reply the
   * client also gets 204, so no answer is ever read twice. A manual replay calls
   * `/tts` instead and is always served (the wav comes from the disk cache).
   */
  async function handleAuto(req, res) {
    try {
      const url = new URL(req.url, 'http://localhost')
      const sessionId = url.searchParams.get('session')
      const messageId = url.searchParams.get('message')
      if (!sessionId || !messageId) return reply(res, 204, '')
      if (spokenMessages.has(messageId)) return reply(res, 204, '')
      // two tabs asking at once share one synthesis; only the first one plays
      if (autoInFlight.has(messageId)) return reply(res, 204, '')
      const found = await assistantMessage(sessionId, messageId)
      if (!found) return reply(res, 204, '')
      // stay inside the turn: everything above the newest user message is history
      if (found.lastUser >= 0 && found.index < found.lastUser) return reply(res, 204, '')
      autoInFlight.add(messageId)
      try {
        let text = null
        if (cfg.speakMode === 'summary') {
          const summary = await summarizeForSpeech(messageId, found.message)
          if (!summary) return reply(res, 204, '')
          text = summary.text
        } else {
          text = finalAnswerText(found.message)
          if (!text) return reply(res, 204, '')
        }
        const wav = await serial(() => synthesize(text))
        if (!wav) return reply(res, 503, { error: 'voice engine unavailable', autoStart: cfg.autoStart })
        rememberSpoken(messageId)
        return sendWav(res, wav)
      } finally {
        autoInFlight.delete(messageId)
      }
    } catch (error) {
      logger.warn('[dsh-fairy] fallback speech failed:', error && error.message ? error.message : error)
      if (!res.headersSent) return reply(res, 502, { error: String((error && error.message) || error) })
    }
  }

  /**
   * The spoken summary of one message, without synthesizing it.
   *
   * `POST /summary {"text": "..."}` summarizes arbitrary text locally (the
   * extractive lane only); `GET /summary?session=…&message=…` runs the exact
   * pipeline the auto read-out uses. Useful for tests and for showing what Fairy
   * would say without playing it.
   */
  async function handleSummary(req, res) {
    try {
      const url = new URL(req.url, 'http://localhost')
      let text = null
      let sessionId = null
      let messageId = null
      if (req.method === 'POST') {
        const body = await readJson(req)
        text = typeof body.text === 'string' ? body.text : null
        sessionId = typeof body.session === 'string' ? body.session : null
        messageId = typeof body.message === 'string' ? body.message : null
      } else {
        text = url.searchParams.get('text')
        sessionId = url.searchParams.get('session')
        messageId = url.searchParams.get('message')
      }
      if (text) {
        const summary = extractSummary(text, cfg.summaryChars)
        if (!summary) return reply(res, 204, '')
        return reply(res, 200, { summary, via: 'extract', chars: summary.length })
      }
      if (!sessionId || !messageId) return reply(res, 204, '')
      const found = await assistantMessage(sessionId, messageId)
      if (!found) return reply(res, 204, '')
      const summary = await summarizeForSpeech(messageId, found.message)
      if (!summary) return reply(res, 204, '')
      return reply(res, 200, { summary: summary.text, via: summary.via, chars: summary.text.length })
    } catch (error) {
      logger.warn('[dsh-fairy] summary lookup failed:', error && error.message ? error.message : error)
      if (!res.headersSent) return reply(res, 502, { error: String((error && error.message) || error) })
    }
  }

  async function handler(req, res) {
    const url = new URL(req.url, 'http://localhost')
    const suffix = url.pathname.slice(cfg.prefix.length)
    if (suffix === '/status' || suffix === '/status/') return handleStatus(req, res, url)
    if (suffix === '/live' || suffix === '/live/') {
      if (req.method !== 'GET') return reply(res, 405, { error: 'GET' })
      return handleLive(req, res, url)
    }
    if (suffix === '/speech' || suffix === '/speech/') return handleSpeech(req, res, url)
    if (suffix === '/quiet' || suffix === '/quiet/') {
      if (req.method !== 'GET' && req.method !== 'POST') return reply(res, 405, { error: 'GET or POST' })
      return handleQuiet(req, res)
    }
    if (suffix === '/auto' || suffix === '/auto/') {
      if (req.method !== 'GET') return reply(res, 405, { error: 'GET' })
      return handleAuto(req, res)
    }
    if (suffix === '/summary' || suffix === '/summary/') {
      if (req.method !== 'GET' && req.method !== 'POST') return reply(res, 405, { error: 'GET or POST' })
      return handleSummary(req, res)
    }
    if (suffix === '/tts' || suffix === '/tts/') {
      if (req.method !== 'GET' && req.method !== 'POST') return reply(res, 405, { error: 'GET or POST' })
      return handleTts(req, res)
    }
    return reply(res, 404, { error: 'not found' })
  }

  ctx.effect(() => {
    const disposeRoute = ctx.webServer.register({ kind: 'prefix', path: cfg.prefix, handler })
    logger.info?.(`[dsh-fairy] voice routes mounted at ${cfg.prefix}`)
    return () => {
      disposeRoute()
      for (const listener of listeners) {
        if (listener.heartbeat) clearInterval(listener.heartbeat)
        try {
          listener.res.end()
        } catch (error) {
          // already closed
        }
      }
      listeners.clear()
      speakers.clear()
      summaryCache.clear()
      summaryInFlight.clear()
      autoInFlight.clear()
      if (child && child.exitCode === null) {
        try {
          child.kill()
        } catch {
          // the engine is a local helper process; a failed kill is not fatal
        }
        child = null
      }
    }
  }, 'dsh-fairy: voice service')

  // The live speaker rides the assistant stream: sentence-sized chunks are
  // synthesized as the reply arrives, instead of waiting for the final message.
  if (liveEnabled) {
    ctx.effect(() => {
      const dispose = ctx.on('agent/assistant-stream', onAssistantFrame)
      return () => {
        dispose()
        for (const speaker of speakers.values()) speaker.cancelled = true
        speakers.clear()
      }
    }, 'dsh-fairy: live speaker')
  }
}
