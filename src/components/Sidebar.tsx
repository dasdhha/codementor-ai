import React from 'react'

const Icon = ({name}:{name:string})=>{
  const icons:any = {
    dashboard: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 13h8V3H3v10zM3 21h8v-6H3v6zM13 21h8V11h-8v10zM13 3v6h8V3h-8z" fill="currentColor"/></svg>,
    chat: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 6h-18v9a2 2 0 0 0 2 2h3v3l4-3h9a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2z" fill="currentColor"/></svg>,
    lessons: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 6h16v2H4zM4 10h10v2H4zM4 14h16v2H4z" fill="currentColor"/></svg>,
    roadmap: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 6h6v6H3zM15 3h6v6h-6zM9 15h6v6H9z" fill="currentColor"/></svg>,
    practice: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2l3 7h7l-5.5 4 2 7L12 16 5.5 20l2-7L2 9h7z" fill="currentColor"/></svg>,
    projects: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zM13 3v6h8V3h-8zM13 13h8v8h-8v-8z" fill="currentColor"/></svg>,
    challenges: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2l2 5h5l-4 3 2 5-5-3-5 3 2-5-4-3h5z" fill="currentColor"/></svg>,
    progress: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 13h2v8H3v-8zM8 7h2v14H8V7zM13 3h2v18h-2V3zM18 10h2v11h-2V10z" fill="currentColor"/></svg>,
    achievements: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2l3 7h7l-5.5 4 2 7L12 16 5.5 20l2-7L2 9h7z" fill="currentColor"/></svg>,
    settings: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM2 12a10 10 0 0 0 1.6 5.4l2.1-1.2A7.8 7.8 0 0 1 6 12c0- .9.1-1.8.4-2.6L4.3 8.2A10 10 0 0 0 2 12z" fill="currentColor"/></svg>
  }
  return <span style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:22,height:22}}>{icons[name]||null}</span>
}

export default function Sidebar({collapsed, onSelect, active}:{collapsed:boolean,onSelect:(key:string)=>void,active:string}){
  const groups = [
    {label:'Main', items:[{key:'dashboard',label:'Dashboard'},{key:'chat',label:'AI Tutor'},{key:'lessons',label:'Lessons'},{key:'roadmap',label:'Roadmap'}]},
    {label:'Learn', items:[{key:'practice',label:'Practice'},{key:'projects',label:'Projects'},{key:'challenges',label:'Challenges'}]},
    {label:'Account', items:[{key:'progress',label:'Progress'},{key:'achievements',label:'Achievements'},{key:'settings',label:'Settings'}]}
  ]

  return (
    <aside id="main-sidebar" className={`sidebar-surface ${collapsed? 'collapsed':''}` } aria-hidden={collapsed} hidden={collapsed}>
      <div className="sidebar-brand">
        <div className="logo">CM</div>
        <div className="brand-text">CodeMentor AI</div>
      </div>
      <nav aria-label="Main navigation">
        {groups.map((g,gi)=> (
          <div key={gi} className="nav-group">
            {!collapsed && <div className="nav-group-label muted">{g.label}</div>}
            {g.items.map(it=> (
              <button key={it.key} className={`nav-item ${active===it.key? 'active':''}`} onClick={()=>{ onSelect(it.key); window.location.hash = `section:${it.key}` }} title={it.label} aria-current={active===it.key? 'page': undefined}>
                <Icon name={it.key as string} />
                <span className="nav-label">{it.label}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  )
}
