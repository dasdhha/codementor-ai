import React from 'react'

export default function Challenges(){
  return (
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      <h1>Challenges</h1>
      <div className="card-surface">
        <div className="muted">Daily and weekly coding challenges to test your skills.</div>
        <ol style={{marginTop:8}}>
          <li>Array manipulation (10m)</li>
          <li>Recursive puzzles (20m)</li>
          <li>Optimization challenge (30m)</li>
        </ol>
      </div>
    </div>
  )
}
