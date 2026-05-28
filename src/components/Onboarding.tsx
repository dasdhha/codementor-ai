import React, { useState, useRef } from 'react'
import { saveState } from '../lib/storage'
import { generateRoadmap } from '../lib/lessonEngine'
import { addXP } from '../lib/progress'
import { useAppState } from '../lib/appState'

export default function Onboarding({onFinish}:{onFinish:()=>void}){
  const app = (()=>{ try{ return useAppState() }catch(e){ return null } })()
  const [name,setName]=useState('')
  const [goals,setGoals]=useState('Learn Python')
  const [langs,setLangs]=useState('Python,JavaScript')
  const [level,setLevel]=useState('Beginner')
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState<string|null>(null)
  const [message,setMessage]=useState<string|null>(null)
  const modalRef = useRef<HTMLDivElement|null>(null)
  const generationId = useRef(0)

  async function finish(){
    setError(null)
    // validation
    if(!name || !name.trim()){
      setError(app ? app.t('validationName') : 'Please enter your name.')
      return
    }
    if(!langs || !langs.trim()){
      setError(app ? app.t('validationLang') : 'Please enter at least one language.')
      return
    }

    const profile = {name,goals,langs,level,onboarded:true}
    const currentGen = ++generationId.current
    setLoading(true)
    setMessage(app ? app.t('creatingMessage') : 'Creating your personalized roadmap...')

    try{
      // save basic profile immediately so UI state persists even if roadmap generation fails
      await saveState('profile', {...profile, onboarded:false})

      // generate roadmap (has internal timeouts and fallbacks)
      const roadmap = await generateRoadmap(profile)

      // ensure this is the latest generation (ignore stale responses)
      if(currentGen !== generationId.current){
        console.warn('Stale roadmap generation ignored')
        return
      }

      // award XP - non-blocking but await to ensure consistency
      try{
        await addXP('local-user', 50)
      }catch(e){
        console.error('addXP failed', e)
      }

      // mark fully onboarded and persist
      await saveState('profile', {...profile, onboarded:true, roadmapSummary: (roadmap || []).length})

      // smooth fade-out then transition
      if(modalRef.current){
        modalRef.current.classList.add('fade-out')
        setTimeout(()=>{
          setLoading(false)
          onFinish()
        }, 450)
      }else{
        setLoading(false)
        onFinish()
      }
    }catch(err:any){
      console.error('onboarding failed', err)
      setError(err?.message || (app ? app.t('fallbackMessage') : 'Failed to create roadmap. A local fallback will be used.'))
      // Try local fallback quickly
      try{
        setMessage(app ? app.t('fallbackMessage') : 'Applying local fallback roadmap...')
        const fallback = await generateRoadmap(profile)
        await saveState('profile', {...profile, onboarded:true, roadmapSummary: (fallback||[]).length})
        setMessage(null)
        setLoading(false)
        onFinish()
      }catch(fbErr){
        console.error('fallback generation failed', fbErr)
        setLoading(false)
        setMessage(null)
      }
    }
  }

  return (
    <div className="onboard-modal" ref={modalRef}>
      <div className="card">
        <h1>Welcome to CodeMentor AI</h1>
        <div className="muted">We'll create a personalized roadmap for you.</div>
        <div style={{marginTop:12}}>
          <label htmlFor="onboard-name">Name</label>
          <input id="onboard-name" aria-required="true" style={{width:'100%',padding:8,marginTop:6}} value={name} onChange={e=>setName(e.target.value)} />
        </div>
        <div style={{marginTop:12}}>
          <label htmlFor="onboard-goals">What do you want to learn?</label>
          <input id="onboard-goals" style={{width:'100%',padding:8,marginTop:6}} value={goals} onChange={e=>setGoals(e.target.value)} />
        </div>
        <div style={{marginTop:12}}>
          <label htmlFor="onboard-langs">Preferred languages (comma-separated)</label>
          <input id="onboard-langs" style={{width:'100%',padding:8,marginTop:6}} value={langs} onChange={e=>setLangs(e.target.value)} />
        </div>
        <div style={{marginTop:12}}>
          <label htmlFor="onboard-level">Current level</label>
          <select id="onboard-level" value={level} onChange={e=>setLevel(e.target.value)}>
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>
        </div>
        {error && <div style={{color:'var(--danger)',marginTop:12}}>{error}</div>}
        {message && <div style={{marginTop:8}} className="muted">{message}</div>}
        <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:16}}>
          <button className="btn" onClick={finish} aria-busy={loading}>
            {loading ? 'Generating…' : 'Create roadmap'}
          </button>
        </div>
      </div>
    </div>
  )
}
