import React from 'react'

export default function ProgressPage(){
  return (
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      <h1>Progress</h1>
      <div className="card-surface">
        <div className="muted">Track your XP, streaks, mastery and achievements here.</div>
        <div style={{display:'flex',gap:12,marginTop:12}}>
          <div style={{flex:1}}>
            <strong>Mastery</strong>
            <div className="muted">Topic mastery breakdown</div>
          </div>
          <div style={{width:160}}>
            <strong>Streak</strong>
            <div className="muted">5 days</div>
          </div>
        </div>
      </div>
    </div>
  )
}
