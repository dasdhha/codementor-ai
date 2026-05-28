import React from 'react'

export default function Achievements(){
  return (
    <div>
      <h1>Achievements</h1>
      <div className="card-surface">
        <div className="muted">Earn badges and level up by completing lessons and challenges.</div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:12}}>
          <div className="card-surface" style={{width:120,textAlign:'center'}}>Novice Coder</div>
          <div className="card-surface" style={{width:120,textAlign:'center'}}>Streak 7</div>
          <div className="card-surface" style={{width:120,textAlign:'center'}}>Quiz Master</div>
        </div>
      </div>
    </div>
  )
}
