// Sandbox runners: JS in iframe and Python via Pyodide

export async function runJSInSandbox(code: string, timeout = 10000) {
  return new Promise<string>((res, rej) => {
    const iframe = document.createElement('iframe')
    iframe.style.display = 'none'
    document.body.appendChild(iframe)
    const win = iframe.contentWindow!

    let to: any = null
    const logs: string[] = []
    const listener = (ev: MessageEvent) => {
      if (ev.source !== win) return
      if (ev.data?.type === 'log') {
        logs.push(String(ev.data.value))
        return
      }
      if (ev.data?.type === 'result') {
        window.removeEventListener('message', listener)
        try { iframe.remove() } catch (_) {}
        if (to) clearTimeout(to)
        const combined = (logs.length ? (logs.join('\n') + '\n') : '') + String(ev.data.value)
        res(combined)
      }
    }

    window.addEventListener('message', listener)

    const wrapped = `
      (function(){
        const _console = { }
        _console.log = function(){ try{ parent.postMessage({type:'log',value: Array.from(arguments).map(a=>String(a)).join(' ')} ,'*') }catch(e){}
        }
        _console.error = function(){ try{ parent.postMessage({type:'log',value: Array.from(arguments).map(a=>String(a)).join(' ')} ,'*') }catch(e){}
        }
        try{ window.console = _console }catch(e){}
        try{
          const _res = (async()=>{${code}})();
          Promise.resolve(_res).then(v=>parent.postMessage({type:'result',value:String(v)},'*'))
        }catch(e){ parent.postMessage({type:'result',value:String(e)},'*') }
      })()
    `

    try {
      win.document.open()
      win.document.write(`<script>${wrapped} <\/script>`)
      win.document.close()
    } catch (e) {
      window.removeEventListener('message', listener)
      try { iframe.remove() } catch (_) {}
      return rej(e)
    }

    to = setTimeout(() => {
      window.removeEventListener('message', listener)
      try { iframe.remove() } catch (_) {}
      rej(new Error('Timeout or no result from sandbox'))
    }, timeout)
  })
}


// Pyodide loader: robust singleton with retries, multiple CDNs, and timeouts
let _pyodideInstance: any = null
let _pyodideInitializing: Promise<any> | null = null

const PYODIDE_VERSION = '0.23.4'
const PYODIDE_BASES = [
  `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`,
  `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`,
  // fallback mirrors (unpkg sometimes mirrors)
  `https://unpkg.com/pyodide@${PYODIDE_VERSION}/assets/`,
]

async function loadScript(src: string, timeout = 20000) {
  return new Promise<void>((resolve, reject) => {
    const s = document.createElement('script')
    s.src = src
    s.async = true
    let done = false
    const to = setTimeout(() => { if (!done) { done = true; reject(new Error('Script load timeout: ' + src)) } }, timeout)
    s.onload = () => { if (!done) { done = true; clearTimeout(to); resolve() } }
    s.onerror = (e) => { if (!done) { done = true; clearTimeout(to); reject(new Error('Failed to load script: ' + src)) } }
    document.head.appendChild(s)
  })
}

export async function initializePyodide(opts: {timeoutMs?: number} = {}) {
  if (_pyodideInstance) return _pyodideInstance
  if (_pyodideInitializing) return _pyodideInitializing

  _pyodideInitializing = (async () => {
    const timeoutMs = opts.timeoutMs || 60000
    try {
      // try each base until loadPyodide becomes available
      let lastError: any = null
      for (const base of PYODIDE_BASES) {
        const scriptUrl = `${base}pyodide.js`
        try {
          // If loadPyodide already present, skip
          if (typeof (window as any).loadPyodide === 'function') break
          await loadScript(scriptUrl, Math.min(30000, timeoutMs))
          // small delay to allow global to register
          await new Promise(r => setTimeout(r, 50))
          if (typeof (window as any).loadPyodide === 'function') break
        } catch (e) {
          lastError = e
          // try next base
        }
      }

      if (typeof (window as any).loadPyodide !== 'function') {
        throw new Error('loadPyodide not found after trying CDNs. ' + (lastError ? String(lastError) : ''))
      }

      const loadPromise = (window as any).loadPyodide({ indexURL: PYODIDE_BASES[0] })
      const py = await Promise.race([
        loadPromise,
        new Promise((_, rej) => setTimeout(() => rej(new Error('Pyodide init timeout')), timeoutMs))
      ])
      _pyodideInstance = py
      try{ (window as any).__pyodide_loaded = true }catch(e){}
      return py
    } catch (err) {
      _pyodideInitializing = null
      try{ (window as any).__pyodide_failed = true }catch(e){}
      // provide clearer error message for users
      const friendly = new Error('Failed to initialize Python runtime (Pyodide). Check network/CDN access or configure a proxy. Details: ' + String(err))
      throw friendly
    }
  })()

  return _pyodideInitializing
}

export function isPyodideReady() {
  return !!_pyodideInstance
}

export function getPyodide() {
  return _pyodideInstance
}

export function getPyodideStatus(){
  if(_pyodideInstance) return 'ready'
  if((window as any).__pyodide_failed) return 'failed'
  if(_pyodideInitializing) return 'loading'
  return 'idle'
}

export async function runPythonInPyodide(code: string, options: {timeoutMs?: number} = {}) {
  const timeoutMs = options.timeoutMs || 20000

  let py
  try{
    py = await initializePyodide({ timeoutMs: Math.min(timeoutMs, 60000) })
  }catch(e){
    // bubble a clear error
    throw new Error('Python runtime not available: ' + String(e))
  }

  const wrapped = `\nimport sys, io, traceback\n_code = ${JSON.stringify(code)}\nbuf = io.StringIO()\nold_out, old_err = sys.stdout, sys.stderr\nsys.stdout = buf; sys.stderr = buf\ntry:\n    exec(_code, {})\nexcept Exception:\n    traceback.print_exc()\nfinally:\n    sys.stdout, sys.stderr = old_out, old_err\nresult = buf.getvalue()\nresult\n`

  try {
    const resultPromise = py.runPythonAsync(wrapped)
    const out = await Promise.race([
      resultPromise,
      new Promise((_, rej) => setTimeout(() => rej(new Error('Python execution timeout')), timeoutMs))
    ])
    return String(out)
  } catch (err: any) {
    return String(err && err.message ? err.message : err)
  }
}
