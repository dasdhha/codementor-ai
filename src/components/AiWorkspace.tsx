import React, { useRef, useState } from 'react'
import Chat from './Chat'
import Editor from './Editor'

export default function AiWorkspace(){
  const editorRef = useRef<any>(null)
  const [output, setOutput] = useState<string>('')

  return (
    <div className="ai-workspace">
      <div className="ai-left">
        <Chat />
      </div>
      <div className="ai-center">
        <Editor onEditorRef={(r)=>{ editorRef.current = r }} />
      </div>
      <div className="ai-right">
        <div className="card-surface">
          <h2>Output / Debug</h2>
          <pre style={{whiteSpace:'pre-wrap'}}>{output || 'Run code to see output'}</pre>
        </div>
        <div className="card-surface" style={{marginTop:12}}>
          <h2>Lesson Context</h2>
          <div className="muted">Active lesson details and quick links will appear here.</div>
        </div>
      </div>
    </div>
  )
}
