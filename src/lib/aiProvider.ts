// Minimal modular AI provider interface with a local tutor implementation.

export type AIProvider = {
  name: string
  // simple chat returning final response
  chat: (prompt: string, opts?: any) => Promise<string>
  // optional streaming chat: call with onUpdate to receive partial chunks
  stream?: (prompt: string, onUpdate: (chunk: string) => void, opts?: any) => Promise<void>
}

// Local tutor: simple rule-based + code-aware responses.
export const localTutor: AIProvider = {
  name: 'local-tutor',
  async chat(prompt: string) {
    const p = prompt.toLowerCase()
    if (p.includes('explain')) {
      return 'Sure — here is a step-by-step explanation: 1) Read the problem. 2) Break into smaller steps. 3) Write pseudocode. Need a concrete example?'
    }
    if (p.includes('fix') || p.includes('error') || p.includes('debug')) {
      return 'I can run your code in the sandbox. Paste the code in the editor and click Run — I will analyze errors and suggest fixes.'
    }
    if (p.includes('quiz') || p.includes('exercise')) {
      return 'Generating a short interactive quiz...\n1) What is a function?\n2) Explain variable scope.\nReply "start quiz" to begin.'
    }
    return 'I am a local assistant. For advanced AI responses you can configure a cloud provider (Google Gemini / OpenAI). Meanwhile, try asking me to explain a concept or paste code.'
  },
  async stream(prompt: string, onUpdate: (chunk: string) => void) {
    // Simulate streaming by breaking message into chunks
    const reply = await this.chat(prompt)
    const parts = reply.match(/.{1,80}/g) || [reply]
    for (const part of parts) {
      onUpdate(part)
      // small delay to simulate typing
      await new Promise(r => setTimeout(r, 60))
    }
  }
}

let active: AIProvider | null = null

export function setProvider(p: AIProvider){ active = p }
export function clearProvider(){ active = null }
export function getActiveProvider(){ if(!active) throw new Error('AI provider not configured'); return active }
export function getActiveProviderOrNull(){ return active }

function withTimeout<T>(p:Promise<T>, ms:number){
  return Promise.race([p, new Promise<T>((_,rej)=>setTimeout(()=>rej(new Error('AI timeout')), ms))])
}

export async function askAI(prompt:string, opts?:{timeout?:number,retries?:number}){
  const timeout = opts?.timeout ?? 8000
  const retries = opts?.retries ?? 1
  if(!active) throw new Error('AI provider not configured. Please configure in Settings.')
  let lastErr:any
  for(let attempt=0; attempt<=retries; attempt++){
    try{
      const p = active.chat(prompt)
      return await withTimeout(p, timeout)
    }catch(err){
      lastErr = err
      console.error('askAI attempt failed', attempt, err)
      await new Promise(r=>setTimeout(r, 200 * (attempt+1)))
    }
  }
  throw lastErr || new Error('AI request failed')
}

export async function askAIStream(prompt:string, onUpdate:(chunk:string)=>void, opts?:{timeout?:number}){
  const timeout = opts?.timeout ?? 15000
  if(!active) throw new Error('AI provider not configured. Please configure in Settings.')
  if(active.stream){
    return await Promise.race([active.stream!(prompt,onUpdate,opts), new Promise((_,rej)=>setTimeout(()=>rej(new Error('AI stream timeout')), timeout))])
  }
  // provider doesn't support streaming: call chat and emit once
  const r = await askAI(prompt, {timeout: Math.min(12000, timeout)})
  onUpdate(r)
}
