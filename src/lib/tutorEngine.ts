import { getLessons } from './memory'
import { askAI, askAIStream } from './aiProvider'
import { prepareDebugPrompt } from './codeAnalyzer'
import { saveProgress, loadProgress } from './memory'

type Lesson = { id:string, title:string, lang?:string, difficulty?:number, prerequisites?:string[] }

export async function buildPrereqGraph(){
  const lessons = await getLessons()
  const graph: Record<string,string[]> = {}
  for(const l of lessons){
    graph[l.id] = l.prerequisites || []
  }
  return graph
}

export async function computeMastery(userId:string){
  const lessons = await getLessons()
  const mastery: Record<string,number> = {}
  for(const l of lessons){
    const p = await loadProgress(`${userId}:${l.id}`)
    const score = p?.mastery ?? 0
    mastery[l.id] = Math.min(100, Math.max(0, score))
  }
  return mastery
}

export async function recommendNextLessons(userId:string,count=3){
  const lessons = await getLessons()
  const mastery = await computeMastery(userId)
  // filter by prerequisites satisfied
  const available = lessons.filter(l=>{
    const pre = l.prerequisites || []
    return pre.every(pid => (mastery[pid] || 0) >= 60)
  })
  // sort by low mastery and difficulty
  available.sort((a,b)=> (mastery[a.id]||0) - (mastery[b.id]||0) || (a.difficulty||1)-(b.difficulty||1))
  return available.slice(0,count)
}

export async function generateQuizForLesson(lesson:Lesson){
  const prompt = `Create a 5-question multiple-choice quiz for the lesson titled \"${lesson.title}\". Provide JSON array of questions with fields: question, choices (array), answer (index), explanation.`
  const raw = await askAI(prompt)
  try{ const parsed = JSON.parse(raw); return parsed }catch(e){ return {raw} }
}

export async function generateProjectForLesson(lesson:Lesson){
  const prompt = `Generate a small project-based assignment for the lesson \"${lesson.title}\". Include objectives, deliverables, starter code, difficulty, and estimated time.`
  const raw = await askAI(prompt)
  try{ const parsed = JSON.parse(raw); return parsed }catch(e){ return {text:raw} }
}

export async function analyzeCodeAndTeach(code:string, runtimeOutput:string, language:string, onUpdate:(chunk:string)=>void){
  const prompt = prepareDebugPrompt(code,runtimeOutput,language) + `\n\nNow teach the student line-by-line, provide comments, mark potential improvements, and include short exercises.`
  await askAIStream(prompt,(chunk)=>onUpdate(chunk))
}

export async function recordAttempt(userId:string,lessonId:string,result:{passed:boolean,score:number,details?:any}){
  const key = `${userId}:${lessonId}`
  const cur = await loadProgress(key) || {id:key, attempts:0, mastery:0}
  cur.attempts = (cur.attempts||0) + 1
  // simple mastery update: moving average
  cur.mastery = Math.round(((cur.mastery||0) * (cur.attempts-1) + result.score) / cur.attempts)
  await saveProgress(key,cur)
  return cur
}
