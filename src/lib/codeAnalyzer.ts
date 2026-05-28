export function prepareDebugPrompt(code:string, runtimeOutput:string, language:string){
  return `You are an expert ${language} tutor and debugger. The user provided this code:\n\n${code}\n\nRuntime output or error:\n${runtimeOutput}\n\nPlease: 1) explain the error in simple terms, 2) provide a corrected version of the code with minimal edits inside a fenced code block, 3) give a brief explanation of the fix and any edge-cases.`
}

export function extractCodeFromResponse(resp:string){
  const fenceRegex = /```(?:[a-zA-Z0-9]+)?\n([\s\S]*?)```/m
  const m = resp.match(fenceRegex)
  if(m && m[1]) return m[1].trim()
  // fallback: return entire response if it looks like code
  if(resp.split('\n').length > 3) return resp
  return ''
}
