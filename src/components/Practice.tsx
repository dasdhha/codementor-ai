import React from 'react'

export default function Practice(){
  return (
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      <h1>Practice</h1>
      <div className="card-surface">
        <div className="muted">Interactive practice sessions to improve your skills.</div>
        <ul style={{marginTop:8}}>
          <li>Quick coding drills</li>
          <li>Flash exercises</li>
          <li>Timed challenges</li>
        </ul>
      </div>
    </div>
  )
}
