import React, { useEffect, useRef, useState } from 'react'
import EditorMonaco from '@monaco-editor/react'
import { runJSInSandbox, runPythonInPyodide, initializePyodide, isPyodideReady, getPyodideStatus } from '../lib/sandbox'
import { prepareDebugPrompt, extractCodeFromResponse } from '../lib/codeAnalyzer'
import { askAI, askAIStream } from '../lib/aiProvider'
import { addMessage } from '../lib/memory'
import { saveState, loadState } from '../lib/storage'
import { useAppState } from '../lib/appState'
import { useTheme } from '../lib/theme'

export default function Editor({onEditorRef}:{onEditorRef?: (ref:{getCode:()=>string,setCode:(c:string)=>void})=>void}){
  const [code, setCode] = useState<string>("# Hello CodeMentor AI\nprint('Hello from Python')")
  const [lang, setLang] = useState<'python'|'javascript'>('python')
  const [out, setOut] = useState<string>('')
  const app = useAppState()
  const [pyLoading, setPyLoading] = useState(false)
  const theme = (()=>{ try{ return useTheme() }catch(e){ return null } })()
  const monacoEditorRef = useRef<any>(null)
  const monacoInstanceRef = useRef<any>(null)

  useEffect(()=>{
    (async()=>{
      const s = await loadState('editor')
      if(s?.code) setCode(s.code)
      if(s?.lang) setLang(s.lang)
    })()
    if(onEditorRef){
      onEditorRef({getCode:()=>code,setCode:(c:string)=>setCode(c)})
    }
  },[])

  useEffect(()=>{
    // if user opens Python editor, prewarm pyodide
    let mounted = true
    if(lang === 'python' && !isPyodideReady()){
      setPyLoading(true)
      ;(async ()=>{
        try{
          await initializePyodide()
        }catch(err){
          console.error('Pyodide init failed', err)
          const status = getPyodideStatus()
          setOut(app ? (app.t('loadingPythonError') + ' — ' + String(err)) : ('Failed to load Python runtime: ' + String(err)))
        }finally{
          if(mounted) setPyLoading(false)
        }
      })()
    }
    return ()=>{ mounted=false }
  },[lang])

  useEffect(()=>{
    const t = setTimeout(()=>saveState('editor',{code,lang}),800)
    return ()=>clearTimeout(t)
  },[code,lang])

  async function run(){
    setOut(app ? app.t('running') : 'Running...')
    try{
      if(lang==='javascript'){
        const r = await runJSInSandbox(code)
        setOut(r)
      }else{
        // ensure pyodide initialized
        setPyLoading(true)
        const r = await runPythonInPyodide(code, {timeoutMs: 20000})
        setOut(r)
        setPyLoading(false)
      }
    }catch(e:any){
      setOut(String(e))
    }
  }

  function handleEditorMount(editor:any, monaco:any){
    monacoEditorRef.current = editor
    monacoInstanceRef.current = monaco
    // set theme mapping
    try{
      const resolved = theme ? theme.resolved : 'light'
      // define a lightweight custom theme matching app tokens
      try{
        monaco.editor.defineTheme('cm-dark', {
          base: 'vs-dark',
          inherit: true,
          rules: [
            { token: '', foreground: 'f8fafc', background: '0f172a' },
            { token: 'keyword', foreground: '8b5cf6' },
            { token: 'string', foreground: '7dd3fc' },
            { token: 'number', foreground: 'fbbf24' },
            { token: 'comment', foreground: '94a3b8', fontStyle: 'italic' }
          ],
          colors: {
            'editor.background': '#0f172a',
            'editor.foreground': '#f8fafc',
            'editorLineNumber.foreground': '#475569',
            'editorCursor.foreground': '#8b5cf6',
            'editor.lineHighlightBackground': '#071026'
          }
        })
        monaco.editor.defineTheme('cm-light', {
          base: 'vs', inherit: true,
          rules: [
            { token: '', foreground: '111827', background: 'ffffff' },
            { token: 'keyword', foreground: '7c3aed' },
            { token: 'string', foreground: '059669' },
            { token: 'number', foreground: 'b45309' },
            { token: 'comment', foreground: '6b7280', fontStyle: 'italic' }
          ],
          colors: {
            'editor.background': '#ffffff',
            'editor.foreground': '#111827',
            'editorLineNumber.foreground': '#9ca3af',
            'editorCursor.foreground': '#7c3aed'
          }
        })
      }catch(e){}
      monaco.editor.setTheme(resolved === 'dark' ? 'cm-dark' : 'cm-light')

      // editor options for better font rendering and minimap/scrollbar
      editor.updateOptions({
        fontFamily: "'Fira Code', 'Roboto Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, 'Courier New', monospace",
        fontSize: 14,
        minimap: { enabled: false },
        smoothScrolling: true,
        scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 8, handleMouseWheel: true }
      })
    }catch(e){}
  }

  async function formatEditor(){
    try{
      const ed = monacoEditorRef.current
      if(!ed) return
      // run built-in format action
      const action = ed.getAction && ed.getAction('editor.action.formatDocument')
      if(action && action.run) await action.run()
    }catch(e){ console.warn('format failed',e) }
  }

  async function fixWithAI(){
    setOut(app ? app.t('loading') : 'Analyzing and requesting fix from AI...')
    const prompt = prepareDebugPrompt(code,String(out), lang)
    let suggested = ''
    try{
      // stream suggestion
      await askAIStream(prompt,(chunk)=>{
        suggested += chunk
      })
      const newCode = extractCodeFromResponse(suggested)
      if(newCode){
        setCode(newCode)
        setOut('Applied suggested fix from AI.')
        addMessage('global-conversation',{from:'assistant',text:'Applied AI fix',timestamp:Date.now()})
      }else{
        setOut(app ? app.t('aiNoCodeBlock') : 'AI suggested changes but no code block was detected. See assistant message.')
      }
    }catch(e:any){
      setOut(app ? (app.t('providerNotConfigured') + ' — ' + String(e)) : String(e))
    }
  }

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      <div style={{display:'flex',gap:8,marginBottom:8,alignItems:'center'}}>
        <select value={lang} onChange={e=>setLang(e.target.value as any)}>
          <option value="python">Python</option>
          <option value="javascript">JavaScript</option>
        </select>
        <button className="btn" onClick={run} disabled={lang==='python' && pyLoading}>{app ? app.t('run') : 'Run'}</button>
        <button className="btn" onClick={fixWithAI} style={{background:'#ffd166'}}>{app ? app.t('aiFix') : 'AI Fix'}</button>
        {lang==='python' && pyLoading && <div style={{marginLeft:8}} className="muted">{app ? app.t('loadingPython') : 'Loading Python...'}</div>}
      </div>
      <div style={{flex:1}}>
        <EditorMonaco theme={theme && theme.resolved === 'dark' ? 'vs-dark' : 'vs'} height="60vh" defaultLanguage={lang} value={code} onChange={v=>setCode(v||'')} onMount={handleEditorMount} />
      </div>
      <div style={{marginTop:8}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <strong>{app.t('output')}</strong>
          <div style={{display:'flex',gap:8}}>
            <button className="btn" onClick={formatEditor}>{app ? app.t('format') : 'Format'}</button>
          </div>
        </div>
        <pre style={{background:'var(--card-bg)',color:'var(--text-primary)',padding:12,borderRadius:8}}>{out}</pre>
      </div>
    </div>
  )
}
