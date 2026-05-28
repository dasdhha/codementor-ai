// Gemini provider adapter (streaming-capable). Configure API key at runtime.

import { AIProvider } from './aiProvider'

type GeminiOptions = {
  apiKey?: string
  model?: string
}

function readApiKey(){
  // In-browser, expect a global set by the app or user input. Do not hardcode keys.
  // Example: window.__GEMINI_API_KEY = '...'
  // In production, use a secure server-side proxy to call Gemini.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).__GEMINI_API_KEY as string | undefined
}

export function createGeminiProvider(opts?: GeminiOptions): AIProvider {
  const model = opts?.model || 'gemini-1.0'
  const apiKey = opts?.apiKey || readApiKey()
  const proxy = (opts as any)?.proxyUrl || (window as any).__GEMINI_PROXY_URL || 'https://api.example-gemini'

  return {
    name: 'gemini',
    async chat(prompt:string){
      if(!apiKey && (!proxy || proxy.includes('example-gemini'))) throw new Error('Gemini not configured: provide API key or a server proxy in Settings')
      const endpoint = proxy.replace(/\/+$/,'') + '/proxy'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {'content-type':'application/json', ...(apiKey ? {authorization:`Bearer ${apiKey}`} : {})},
        body: JSON.stringify({model,prompt})
      })
      if(!res.ok){
        const txt = await res.text().catch(()=>res.statusText)
        throw new Error(`Gemini request failed: ${res.status} ${txt}`)
      }
      const json = await res.json().catch(()=>null)
      return (json && (json.text || json.output)) || (await res.text())
    },
    async stream(prompt:string,onUpdate:(chunk:string)=>void){
      if(!apiKey && (!proxy || proxy.includes('example-gemini'))) throw new Error('Gemini streaming not configured: provide API key or proxy')
      const endpoint = proxy.replace(/\/+$/,'') + '/proxy/stream'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {'content-type':'application/json', ...(apiKey ? {authorization:`Bearer ${apiKey}`} : {})},
        body: JSON.stringify({model,prompt})
      })
      if(!res.ok) {
        const txt = await res.text().catch(()=>res.statusText)
        throw new Error(`Gemini stream failed: ${res.status} ${txt}`)
      }
      if(!res.body) throw new Error('No streaming body from Gemini proxy')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''
      while(true){
        const {done, value} = await reader.read()
        if(done) break
        buf += decoder.decode(value || new Uint8Array(), {stream:true})
        // try split by newlines
        const parts = buf.split('\n')
        buf = parts.pop() || ''
        for(const p of parts){
          if(!p) continue
          try{ const obj = JSON.parse(p); if(obj.text) onUpdate(obj.text); else onUpdate(JSON.stringify(obj)) }
          catch(e){ onUpdate(p) }
        }
      }
      if(buf.trim()) onUpdate(buf)
    }
  }
}
