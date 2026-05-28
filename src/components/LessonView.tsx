import React, { useEffect, useRef, useState } from 'react'
import { recommendNextLessons, generateQuizForLesson, analyzeCodeAndTeach, recordAttempt, computeMastery } from '../lib/tutorEngine'
import { getLessons } from '../lib/memory'
import Editor from './Editor'
import { useAppState } from '../lib/appState'

export default function LessonView(){
  const [lessons,setLessons] = useState<any[]>([])
  const [recommended,setRecommended] = useState<any[]>([])
  const [activeLesson,setActiveLesson] = useState<any|null>(null)
  const [teachingStream,setTeachingStream] = useState<string>('')
  const editorRef = useRef<any>(null)
  const [loading,setLoading] = useState(true)
  const [masteryMap,setMasteryMap] = useState<Record<string,number>>({})
  const app = useAppState()
  

  useEffect(()=>{
    let mounted = true
    ;(async()=>{
      try{
        const l = (await getLessons() || [])
        const r = await recommendNextLessons('local-user') || []
        const mastery = await computeMastery('local-user')
        if(!mounted) return
        setLessons(l)
        setRecommended(r)
        setMasteryMap(mastery)
      }catch(err){
        console.error('Failed to load lessons or recommendations', err)
      }finally{
        if(mounted) setLoading(false)
      }
    })()
    return ()=>{ mounted = false }
  },[])


  useEffect(()=>{
    function onHash(){
      const h = window.location.hash || ''
      if(h.startsWith('#lesson:')){
        const id = h.replace('#lesson:','')
        const found = lessons.find(x=>x.id===id)
        if(found) setActiveLesson(found)
      }
    }
    window.addEventListener('hashchange', onHash)
    onHash()
    return ()=>window.removeEventListener('hashchange', onHash)
  },[lessons])

  async function openLesson(l:any){
    // navigate via hash so routing is consistent
    window.location.hash = `lesson:${l.id}`
    setActiveLesson(l)
  }

  async function requestTeaching(){
    if(!editorRef.current) return
    const code = typeof editorRef.current.getCode === 'function' ? editorRef.current.getCode() : ''
    setTeachingStream('')
    // loading state
    setLoading(true)
    try{
      await analyzeCodeAndTeach(code,'',activeLesson?.lang||'python',(chunk)=>{
        setTeachingStream(s=>s+chunk)
      })
    }catch(err){
      setTeachingStream(s=>s+'\n[Error during tutoring]')
    }finally{
      setLoading(false)
    }
  }

  async function generateQuiz(){
    if(!activeLesson) return
    const quiz = await generateQuizForLesson(activeLesson)
    // display inline
    setActiveLesson({...activeLesson,quiz})
  }

  async function markComplete(){
    if(!activeLesson) return
    try{
      const res = await recordAttempt('local-user', activeLesson.id, {passed:true, score:100})
      alert((app ? app.t('lessonMarkedComplete') : 'Lesson marked complete. Progress updated:') + ' ' + JSON.stringify(res))
    }catch(err){
      console.error('markComplete failed', err)
      alert(app ? app.t('lessonMarkFailed') : 'Failed to mark complete')
    }
  }

  return (
    <div style={{display:'flex',height:'100%'}}>
      <h1 style={{position:'absolute',left:-9999,top:'auto',width:1,height:1,overflow:'hidden'}}>Lessons</h1>
      <div style={{width:360,marginRight:12}}>
        <h2>{app.t('recommended')}</h2>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {recommended.map(r=>{
            const mastery = masteryMap[r.id] ?? 0
            const xp = (r.difficulty||1) * 100
            return (
              <div key={r.id} className="lesson-card" role="button" tabIndex={0} onClick={()=>openLesson(r)} onKeyDown={(e)=>{ if(e.key==='Enter' || e.key===' ') openLesson(r) }} aria-locked={mastery<20}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div>
                    <strong>{r.title}</strong>
                    <div className="muted">{r.description}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div className="muted">{r.estimatedMinutes}m • {r.difficulty}★</div>
                    <div style={{fontSize:12}}>{xp} XP</div>
                  </div>
                </div>
                <div style={{marginTop:8,display:'flex',gap:8,alignItems:'center'}}>
                  <div className="progress-bar" style={{flex:1}}>
                    <div className="progress-fill" style={{width:`${mastery}%`}} />
                  </div>
                  <div style={{width:48,textAlign:'right'}} className="muted">{mastery}%</div>
                </div>
                {mastery<20 && <div style={{marginTop:8}} className="locked-badge">Locked (low mastery)</div>}
              </div>
            )
          })}
        </div>

        <h2 style={{marginTop:12}}>{app.t('allLessons')}</h2>
        <div style={{maxHeight:420,overflow:'auto',display:'grid',gridTemplateColumns:'1fr',gap:8}}>
          {lessons.map(l=>{
            const mastery = masteryMap[l.id] ?? 0
            const xp = (l.difficulty||1) * 100
            return (
              <div key={l.id} className="lesson-card compact" role="button" tabIndex={0} onClick={()=>openLesson(l)} onKeyDown={(e)=>{ if(e.key==='Enter' || e.key===' ') openLesson(l) }}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div>
                    <strong>{l.title}</strong>
                    <div className="muted">{l.description}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div className="muted">{l.estimatedMinutes}m</div>
                    <div style={{fontSize:12}}>{xp} XP</div>
                  </div>
                </div>
                <div style={{marginTop:8,display:'flex',gap:8,alignItems:'center'}}>
                  <div className="progress-bar" style={{flex:1}}>
                    <div className="progress-fill" style={{width:`${mastery}%`}} />
                  </div>
                  <div style={{width:48,textAlign:'right'}} className="muted">{mastery}%</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <div style={{flex:1,display:'flex',flexDirection:'column'}}>
        {activeLesson ? (
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            <h2>{activeLesson.title}</h2>
            <div className="muted">{activeLesson.description}</div>
            <div style={{display:'flex',gap:8}}>
              <button className="btn" onClick={generateQuiz}>{app.t('generateQuiz')}</button>
              <button className="btn" onClick={requestTeaching}>{app.t('requestTeaching')}</button>
              <button className="btn" onClick={markComplete} style={{background:'#6ee7b7'}}>{app.t('markComplete')}</button>
            </div>
            <div style={{marginTop:12}}>
              <h3>{app.t('explanation')}</h3>
              <div className="muted">{activeLesson.explanation}</div>
              <h3 style={{marginTop:10}}>{app.t('examples')}</h3>
              {activeLesson.examples && activeLesson.examples.map((ex:any,idx:number)=> (
                <div key={idx} style={{background:'rgba(255,255,255,0.02)',padding:8,borderRadius:8,marginTop:8}}>
                  <pre style={{whiteSpace:'pre-wrap'}}>{ex.code}</pre>
                  <div className="muted">{ex.note}</div>
                </div>
              ))}
              <h3 style={{marginTop:10}}>{app.t('exercises')}</h3>
              <ul>
                {activeLesson.exercises?.map((ex:any)=> (
                  <li key={ex.id} style={{marginTop:6}}>
                    <strong>{ex.title}</strong> — {ex.prompt}
                    <div style={{marginTop:6}}>
                      <button className="btn" onClick={()=>{ if(editorRef.current && ex.type==='coding') editorRef.current.setCode(ex.starterCode||"// start coding") }}>{'Open in Editor'}</button>
                    </div>
                  </li>
                ))}
              </ul>

              {activeLesson.quiz && (
                <div style={{marginTop:12}}>
                  <h3>{app.t('quizTitle')}</h3>
                  <div className="muted">{app.t('quizTitle')} auto-generated for this lesson</div>
                  <ol>
                    {(Array.isArray(activeLesson.quiz) ? activeLesson.quiz : (activeLesson.quiz.questions || [])).map((q:any,idx:number)=>(
                      <li key={idx} style={{marginTop:8}}>
                        <strong>{q.question || q.prompt}</strong>
                        <ul>
                          {(q.choices||[]).map((c:any,ci:number)=>(<li key={ci} className="muted">{String.fromCharCode(65+ci)}. {c}</li>))}
                        </ul>
                        <div className="muted">Answer: {q.answer}</div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              <div style={{flex:1,marginTop:8}}>
                <Editor onEditorRef={(r)=>{ editorRef.current = r }} />
              </div>
            </div>
            <div style={{marginTop:8}}>
              <h3>Teaching Output</h3>
              <pre style={{background:'var(--card-bg)',padding:12,borderRadius:8,whiteSpace:'pre-wrap',color:'var(--text-primary)'}}>{teachingStream}</pre>
            </div>
          </div>
        ) : (
          <div className="muted">{app.t('selectLesson')}</div>
        )}
      </div>
    </div>
  )
}
