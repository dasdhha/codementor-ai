import React, { useEffect, useState } from 'react'
import { getLessons } from '../lib/memory'
import { getProgress } from '../lib/progress'
import { computeMastery } from '../lib/tutorEngine'
import { useAppState } from '../lib/appState'

export default function Dashboard(){
  const [lessons,setLessons] = useState<any[]>([])
  const [progress,setProgress] = useState<any>(null)
  const [loading,setLoading] = useState(true)
  const app = (() => { try{ return useAppState() }catch(e){ return null } })()

  useEffect(()=>{
    let mounted = true
    ;(async()=>{
      try{
        if(app){
          setLessons(app.lessons||[])
          setProgress(app.progress)
        }else{
          const l = await getLessons() || []
          const p = await getProgress('local-user')
          const mastery = await computeMastery('local-user')
          // attach _progress value for UI
          for(const item of l){ item._progress = mastery[item.id] || 0 }
          if(!mounted) return
          setLessons(l)
          setProgress(p)
        }
      }catch(err){
        console.error('Failed to load dashboard data', err)
      }finally{
        if(mounted) setLoading(false)
      }
    })()
    return ()=>{ mounted = false }
  },[app])


  return (
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      <h1>Dashboard</h1>
      <div className="dash-grid">
        <div className="card-surface">
          <h2>{app ? app.t('xp') : 'XP'}</h2>
          <div style={{fontSize:24,fontWeight:700}}>{progress?.xp||0}</div>
          <div className="muted">{app ? app.t('level') : 'Level'} {progress?.level||1} • {app ? app.t('upcoming') : 'Next in'} {Math.max(0, ((progress?.level||1)+1)*100 - (progress?.xp||0))} {app ? app.t('xp') : 'XP'}</div>
        </div>
        <div className="card-surface">
          <h2>{app ? app.t('streak') : 'Streak'}</h2>
          <div style={{fontSize:24,fontWeight:700}}>{progress?.streak||0} {app ? app.t('days') : 'days'}</div>
          <div className="muted">{app ? app.t('keepCoding') : 'Keep coding each day to maintain streak'}</div>
        </div>
        <div className="card-surface">
          <h2>{app ? app.t('upcoming') : 'Upcoming'}</h2>
          <div className="muted">{app ? app.t('nextLesson') : 'Next lesson'}</div>
          <div style={{marginTop:8}}>
            {(lessons && lessons[0]) ? (
              <div>
                <strong>{lessons[0].title}</strong>
                <div className="muted">{lessons[0].estimatedMinutes}m • {(lessons[0].difficulty||1)}★</div>
              </div>
            ) : <div className="muted">{app ? app.t('noLessonsScheduled') : 'No lessons scheduled'}</div>}
          </div>
        </div>
        <div className="card-surface">
          <h2>{app ? app.t('roadmapPreview') : 'Roadmap Preview'}</h2>
          <div className="muted">Quick glance of upcoming topics</div>
          <div style={{marginTop:8}}>
            <ul style={{margin:0,paddingLeft:16}}>
              {lessons && lessons.length ? lessons.slice(0,5).map(l=>(
                <li key={l.id}>
                  <button className="nav-item" onClick={()=>{ window.location.hash = `lesson:${l.id}` }} style={{width:'100%',background:'transparent',padding:6,textAlign:'left'}}>
                    <strong>{l?.title || 'Untitled'}</strong>
                    <div className="muted">{l?.estimatedMinutes||0}m</div>
                  </button>
                </li>
              )) : <li className="muted">{app?app.t('noLessons'):'No lessons yet'}</li>}
            </ul>
          </div>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:12}}>
        <div className="card-surface">
          <h2>Lesson Progress</h2>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {lessons.slice(0,6).map(l=> (
              <div key={l.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <strong>{l.title}</strong>
                  <div className="muted">{l.estimatedMinutes}m</div>
                </div>
                <div style={{width:160}}>
                  <div className="progress-bar"><div className="progress-fill" style={{width:`${(l._progress||0)}%`}} /></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-surface">
          <h2>Activity</h2>
          <div className="muted">Recent activity and analytics</div>
          <div style={{height:160,display:'flex',alignItems:'center',justifyContent:'center',marginTop:12}}>
            <svg width="100%" height="120">
              {/* simple sparkline */}
              <polyline fill="none" stroke="#6ee7b7" strokeWidth="3" points="0,80 20,60 40,70 60,50 80,40 100,60 120,30 140,50 160,40 180,30" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
