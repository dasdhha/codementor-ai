import React, { useEffect, useState } from 'react'
import { askAI, askAIStream, getActiveProviderOrNull } from '../lib/aiProvider'
import { recommendNextLessons } from '../lib/tutorEngine'
import { addMessage } from '../lib/memory'
import { useAppState } from '../lib/appState'

export default function Chat(){
  const app = (()=>{ try{ return useAppState() }catch(e){ return null } })()
  const [messages, setMessages] = useState<Array<{from:'user'|'assistant',text:string}>>([])
  const [text, setText] = useState('')
  const [sending,setSending] = useState(false)

  useEffect(()=>{
    // seed
    setMessages([{from:'assistant',text: app ? app.t('welcomeTutor') : 'Welcome to CodeMentor AI — ask me to explain concepts, fix code, or create exercises.'}])
    addMessage('global-conversation',{from:'system',text:'session-start',timestamp:Date.now()}).catch(()=>{})
  },[])

  async function send(){
    if(!text.trim()) return
    const userMsg = {from:'user' as const, text, timestamp:Date.now()}
    setMessages(m=>[...m,userMsg])
    addMessage('global-conversation',userMsg).catch(()=>{})
    setText('')
    // streaming response
    let assistantText = ''
    setSending(true)
    setMessages(m=>[...m,{from:'assistant',text:'…'}])
    try{
      const prov = getActiveProviderOrNull()
      if(!prov){
        // local fallback: generate an intelligent reply based on simple heuristics
        const seenKey = 'localTutorLast'
        const recent = sessionStorage.getItem(seenKey) || ''
        const used = new Set(recent.split('|').filter(Boolean))

        async function localTutorRespond(input:string, onChunk:(c:string)=>void){
          // basic heuristics
          let reply = ''
          const low = input.toLowerCase()
          if(low.includes('explain') || low.includes('what is') || low.includes('explain how')){
            reply = `I can explain that concept step-by-step. First, here's the short definition:\n\n` +
              `- Key idea: ...\n- Why it matters: ...\n- Example:\n` +
              `I'll provide a short example and then an exercise.\n\nExample:\nprint('Hello')\n\nExercise: Try modifying the example to ...`;
          }else if(low.includes('fix') || low.includes('error') || low.includes('bug')){
            reply = `I can help debug. Describe the error or paste the stack trace. Common fixes:\n` +
              `1) Check types and nulls\n2) Add logging\n3) Isolate the failing function\n\nIf you paste code, I'll suggest fixes.`
          }else if(low.includes('exercise') || low.includes('practice') || low.includes('challenge')){
            const recs = await recommendNextLessons('local-user',3)
            reply = `Here are some practice suggestions:\n` + recs.map(r=>`- ${r.title} — ${r.estimatedMinutes}m`).join('\n')
          }else{
            reply = `I'm your local tutor. Ask me to explain concepts, generate exercises, or help fix code. For example: "Explain closures in Python" or "Help fix my TypeError".`
          }

          // avoid repeating identical replies
          if(used.has(reply)) reply = reply + '\n\n(Additional hint: try rephrasing your question.)'
          used.add(reply)
          sessionStorage.setItem(seenKey, Array.from(used).join('|'))

          // stream reply in chunks
          const chunkSize = 60
          for(let i=0;i<reply.length;i+=chunkSize){
            const part = reply.slice(i,i+chunkSize)
            onChunk(part)
            // emulate streaming
            await new Promise(r=>setTimeout(r, 60))
          }
        }

        await localTutorRespond(text,(chunk)=>{
          assistantText += chunk
          setMessages(cur=>{ const copy = cur.slice(0,-1); copy.push({from:'assistant',text:assistantText}); return copy })
        })
        addMessage('global-conversation',{from:'assistant',text:assistantText,timestamp:Date.now()}).catch(()=>{})
        setSending(false)
        return
      }

      await askAIStream(text,(chunk)=>{
        assistantText += chunk
        // replace last assistant message
        setMessages(cur=>{
          const copy = cur.slice(0,-1)
          copy.push({from:'assistant',text:assistantText})
          return copy
        })
      })
      addMessage('global-conversation',{from:'assistant',text:assistantText,timestamp:Date.now()}).catch(()=>{})
      setSending(false)
    }catch(e:any){
      const err = String(e)
      setMessages(cur=>[...cur,{from:'assistant',text:err}])
      addMessage('global-conversation',{from:'assistant',text:err,timestamp:Date.now()}).catch(()=>{})
      setSending(false)
    }
  }

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h1>{app ? app.t('aiTutorTitle') : 'AI Tutor'}</h1>
        <div className="muted" style={{fontSize:13}}>{(() => { try{ const p = getActiveProviderOrNull(); return p ? (app ? `${app.t('provider')}: ${p.name}` : `Provider: ${p.name}`) : (app ? app.t('providerNotConfiguredShort') : 'Provider: Not configured') }catch(e){return app ? app.t('providerNotConfiguredShort') : 'Provider: Not configured'}})()}</div>
      </div>
      <div style={{flex:1,overflow:'auto'}}>
        <div className="chat-list">
          {messages.map((m,i)=>(
            <div key={i} className="chat-bubble"><strong>{m.from}:</strong> {m.text}</div>
          ))}
        </div>
      </div>
      <div style={{display:'flex',gap:8,marginTop:8}}>
        <label htmlFor="chat-input" className="sr-only">{app?app.t('aiTutorTitle'):'AI Tutor input'}</label>
        <input id="chat-input" aria-label={app?app.t('aiTutorTitle'):'Ask the tutor'} style={{flex:1,padding:8,borderRadius:8,border:'none'}} value={text} onChange={e=>setText(e.target.value)} placeholder={app?app.t('aiTutorTitle'):'Ask the tutor...'} />
        <button className="btn" onClick={send} aria-busy={sending} disabled={sending || !text.trim()}>{sending ? (app?app.t('loading'):'Sending…') : (app?app.t('send'):'Send')}</button>
      </div>
    </div>
  )
}
