import React from 'react'
import { useTheme } from '../lib/theme'

export default function Topbar({xp,level,streak,onToggleSidebar,sidebarOpen}:{xp:number,level:number,streak:number,onToggleSidebar:()=>void,sidebarOpen:boolean}){
  const theme = (()=>{ try{ return useTheme() }catch(e){ return null } })()
  const resolved = theme ? theme.resolved : 'light'
  const toggle = ()=>{
    if(!theme) return
    // cycle: system -> light -> dark -> system
    const next = theme.theme === 'system' ? 'light' : theme.theme === 'light' ? 'dark' : 'system'
    theme.setTheme(next)
  }

  return (
    <header className="topbar-surface" role="banner">
      <div className="topbar-left">
        <button className="icon-btn" onClick={onToggleSidebar} aria-label="Toggle sidebar" aria-expanded={sidebarOpen} aria-controls="main-sidebar">☰</button>
        <div className="search" role="search">
          <label htmlFor="topbar-search" className="sr-only">Search</label>
          <input id="topbar-search" aria-label="Search lessons, topics, or commands" placeholder="Search lessons, topics, or commands" />
        </div>
      </div>
      <div className="topbar-right">
        <div className="status">
          <div className="xp" title="Experience">{xp} XP • Lv {level}</div>
          <div className="streak" title="Streak">🔥 {streak}d</div>
        </div>
        <button className="icon-btn" aria-label="Change language">🌐</button>
        <button className="icon-btn" aria-label="Notifications">🔔</button>
        <button className="theme-toggle icon-btn" onClick={toggle} aria-label={`Theme: ${theme?.theme||'system'}`} title={`Theme: ${theme?.theme||'system'}`}>
          {resolved === 'dark' ? '🌙' : '☀️'}
        </button>
        <div className="profile" role="img" aria-label="User profile">Me</div>
      </div>
    </header>
  )
}
