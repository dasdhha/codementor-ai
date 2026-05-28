import React, { useEffect, useState } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import Dashboard from './Dashboard'
import LessonView from './LessonView'
import Roadmap from './Roadmap'
import AiWorkspace from './AiWorkspace'
import Practice from './Practice'
import Projects from './Projects'
import Challenges from './Challenges'
import ProgressPage from './ProgressPage'
import Achievements from './Achievements'
import Settings from './Settings'
import { getProgress } from '../lib/progress'

export default function Layout(){
  const [sidebarOpen,setSidebarOpen] = useState(true)
  const [active,setActive] = useState<string>('dashboard')
  const [progress,setProgress] = useState<any>(null)
  const [isMobile, setIsMobile] = useState<boolean>(false)

  useEffect(()=>{(async()=>{ const p = await getProgress('local-user'); setProgress(p) })()},[])

  useEffect(()=>{
    function onResize(){ setIsMobile(window.innerWidth <= 1100) }
    onResize()
    window.addEventListener('resize', onResize)
    return ()=>window.removeEventListener('resize', onResize)
  },[])

  function renderMain(){
    switch(active){
      case 'dashboard': return <Dashboard />
      case 'chat': return <AiWorkspace />
      case 'lessons': return <LessonView />
      case 'roadmap': return <Roadmap />
      case 'practice': return <Practice />
      case 'projects': return <Projects />
      case 'challenges': return <Challenges />
      case 'progress': return <ProgressPage />
      case 'achievements': return <Achievements />
      case 'settings': return <Settings />
      default: return <Dashboard />
    }
  }

  return (
    <div className="app-shell">
      <Sidebar collapsed={!sidebarOpen} onSelect={(k)=>{ setActive(k); if(isMobile) setSidebarOpen(false) }} active={active} />
      {sidebarOpen && isMobile && <div className="sidebar-overlay" onClick={()=>setSidebarOpen(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.35)',zIndex:40}} aria-hidden />}
      <div className="main-column">
        <Topbar xp={progress?.xp||0} level={progress?.level||1} streak={progress?.streak||0} onToggleSidebar={()=>setSidebarOpen(s=>!s)} sidebarOpen={sidebarOpen} />
        <main id="main-content" className={`main-content page-${active}`}>
          {renderMain()}
        </main>
      </div>
    </div>
  )
}
