import React, { useEffect, useMemo, useState } from 'react'
import { getLessons } from '../lib/memory'
import { buildPrereqGraph, computeMastery } from '../lib/tutorEngine'
import { getProgress } from '../lib/progress'

export default function Roadmap(){
  const [lessons,setLessons] = useState<any[]>([])
  const [graph,setGraph] = useState<Record<string,string[]>>({})
  const [progress,setProgress] = useState<any>({})
  const [collapsed, setCollapsed] = useState<Record<string,boolean>>({})

  useEffect(()=>{(async()=>{
    const ls = await getLessons()
    const mastery = await computeMastery('local-user')
    // attach completion and group info
    const enriched = (ls||[]).map(l=>({
      ...l,
      completed: (mastery[l.id]||0) >= 80,
      mastery: mastery[l.id]||0,
      chapter: l.lang || 'General'
    }))
    setLessons(enriched)
    setGraph(await buildPrereqGraph())
    setProgress(await getProgress('local-user'))
  })()},[])

  const chapters = useMemo(()=>{
    const map: Record<string, any[]> = {}
    for(const l of lessons){
      const ch = l.chapter || 'General'
      map[ch] = map[ch] || []
      map[ch].push(l)
    }
    return map
  },[lessons])

  function toggleChapter(ch:string){
    setCollapsed(c=>({...c,[ch]:!c[ch]}))
  }

  function openLesson(id:string){
    window.location.hash = `lesson:${id}`
  }

  return (
    <div style={{marginTop:8}}>
      <h1>Learning Roadmap</h1>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{fontWeight:700}}>Learning Roadmap</div>
        <div className="muted">Structured learning path</div>
      </div>

      <div style={{marginTop:12,display:'flex',flexDirection:'column',gap:12}}>
        {Object.keys(chapters).map((ch,i)=> (
          <div key={ch} className="card-surface" style={{padding:12}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <strong>{ch}</strong>
                <div className="muted">{chapters[ch].length} topics</div>
              </div>
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                <div className="muted">Progress: {Math.round((chapters[ch].reduce((s,a)=>s+(a.mastery||0),0) / Math.max(1,chapters[ch].length)))}%</div>
                <button className="btn" onClick={()=>toggleChapter(ch)}>{collapsed[ch]? 'Expand':'Collapse'}</button>
              </div>
            </div>

            <div style={{marginTop:12,display: collapsed[ch]? 'none':'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:12}}>
              {chapters[ch].map((l:any)=> (
                <div key={l.id} className={`lesson-card`} role="button" tabIndex={0} onClick={()=>openLesson(l.id)} onKeyDown={(e)=>{ if(e.key==='Enter' || e.key===' ') openLesson(l.id) }} style={{opacity:l.completed?0.9:1}}>
                  <div style={{display:'flex',justifyContent:'space-between'}}>
                    <div>
                      <strong>{l.title}</strong>
                      <div className="muted">{l.description}</div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div className="muted">{l.estimatedMinutes}m</div>
                      <div style={{fontSize:12}}>{(l.difficulty||1)*100} XP</div>
                    </div>
                  </div>
                  <div style={{marginTop:8,display:'flex',alignItems:'center',gap:8}}>
                    <div style={{width:120}}>
                      <div className="progress-bar"><div className="progress-fill" style={{width:`${l.mastery||0}%`}} /></div>
                    </div>
                    <div style={{width:56,textAlign:'right'}} className="muted">{l.mastery||0}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
