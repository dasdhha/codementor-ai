import React, { useEffect, useState } from 'react'
import { createGeminiProvider } from '../lib/geminiProvider'
import { setProvider, clearProvider } from '../lib/aiProvider'
import { useAppState } from '../lib/appState'
import { useTheme } from '../lib/theme'
import { saveState, loadState } from '../lib/storage'

export default function Settings(){
  const app = (()=>{ try{ return useAppState() }catch(e){ return null } })()
  const [key,setKey] = useState('')
  const [proxy,setProxy] = useState('')
  const theme = (()=>{ try{ return useTheme() }catch(e){ return null } })()

  useEffect(()=>{(async()=>{
    const cfg = await loadState('provider_config')
    if(cfg){ setKey(cfg.apiKey||''); setProxy(cfg.proxyUrl||'') }
    else {
      setKey((window as any).__GEMINI_API_KEY||'')
      setProxy((window as any).__GEMINI_PROXY_URL||'')
    }
  })()},[])

  function apply(){
    ;(window as any).__GEMINI_API_KEY = key
    ;(window as any).__GEMINI_PROXY_URL = proxy
    saveState('provider_config',{apiKey:key,proxyUrl:proxy}).catch(()=>{})
    try{
      const prov = createGeminiProvider({apiKey:key, model: 'gemini-1.0'}) as any
      // attach proxyUrl on provider for reference
      (prov as any).__proxy = proxy
      setProvider(prov)
      alert(app ? app.t('settingsAITitle') + ' configured (client-side).' : 'Gemini provider configured (client-side).')
    }catch(err:any){
      clearProvider()
      alert(app ? app.t('loadingPythonError') : String(err))
    }
  }

  return (
    <div style={{marginTop:12}}>
      <h1>{app ? app.t('settingsAITitle') : 'AI Provider'}</h1>
      <div className="muted">Configure Google Gemini key and optional proxy (client-side for testing).</div>
      <div style={{marginTop:8}}>
        <label htmlFor="settings-api-key">API Key</label>
        <input id="settings-api-key" aria-label="Gemini API Key" value={key} onChange={e=>setKey(e.target.value)} placeholder="GEMINI_API_KEY" style={{width:'100%',marginTop:6,padding:8}} />
      </div>
      <div style={{marginTop:8}}>
        <label htmlFor="settings-proxy">Proxy URL (optional)</label>
        <input id="settings-proxy" aria-label="Proxy URL" value={proxy} onChange={e=>setProxy(e.target.value)} placeholder="Optional: https://your-proxy.example/proxy" style={{width:'100%',marginTop:6,padding:8}} />
      </div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:8}}>
        <div>
          <label htmlFor="settings-language" style={{marginRight:8}}>Language:</label>
          <select id="settings-language" value={app ? app.language : 'en'} onChange={e=>app?.setLanguage(e.target.value)}>
            <option value="en">English</option>
            <option value="vi">Tiếng Việt</option>
          </select>
        </div>
        <div style={{display:'flex',gap:12,alignItems:'center'}}>
          <div>
            <label htmlFor="settings-theme" style={{marginRight:8}}>Theme:</label>
            <select id="settings-theme" value={theme ? theme.theme : 'system'} onChange={e=>theme?.setTheme(e.target.value as any)}>
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
          <button className="btn" onClick={apply}>{app ? app.t('applyProvider') : 'Apply'}</button>
        </div>
      </div>
    </div>
  )
}
