import { saveLesson, saveLessons } from './memory'
import { askAI } from './aiProvider'

type Profile = { name?:string, goals?:string, langs?:string, level?:string }

const topicMap: Record<string,string[]> = {
  python: ['Syntax & Basics','Data Structures','Functions & Modules','OOP','Async & IO','Testing','Data Science Intro'],
  javascript: ['Syntax & DOM','Functions & Scope','Async & Promises','Node.js Basics','Frontend Tooling','Testing'],
  cpp: ['Syntax & Types','Memory & Pointers','OOP','STL','Build System','Debugging'],
}

function splitLangs(s?:string){
  if(!s) return ['python']
  return s.split(',').map(x=>x.trim().toLowerCase()).filter(Boolean)
}

export async function generateRoadmap(profile:Profile){
  const langs = splitLangs(profile.langs)
  const level = (profile.level||'Beginner').toLowerCase()
  const lessons:any[] = []
  let id = 1
  for(const lang of langs){
    const topics = topicMap[lang] || ['Basics','Intermediate Topics','Advanced Topics']
    for(const [i,t] of topics.entries()){
      const difficulty = level === 'beginner' ? Math.max(1,i+1) : level === 'intermediate' ? Math.max(2,i+2) : Math.max(3,i+3)
      const lessonId = `${lang}-${id++}`
      const lesson = {
        id: lessonId,
        lang,
        title: `${t} (${lang.toUpperCase()})`, 
        description: `Learn ${t} for ${lang}. Includes examples, exercises and a checkpoint.`,
        difficulty,
        prerequisites: i===0 ? [] : [`${lang}-${id-1-1}`],
        estimatedMinutes: 20 + i*15,
        // richer content
        explanation: `This lesson covers ${t} in ${lang}. Read carefully and try the examples.`,
        examples: [
          {code: `# Example for ${t} in ${lang}\nprint('Hello')`, note: 'Simple example to get started.'}
        ],
        exercises: [
          {id: `${lessonId}-ex-1`, title: `Practice ${t}`, prompt: `Implement a small example demonstrating ${t}.`, type: 'coding'}
        ],
        quiz: [
          {question: `What is the main concept in ${t}?`, choices:['A','B','C'], answer:0}
        ],
        challenge: {title:`${t} mini-project`, description:`Build a small project exercising ${t}.`, starterCode: ''}
      }
      lessons.push(lesson)
      // yield periodically to avoid blocking the main thread
      if((i % 3) === 0) await new Promise(r=>setTimeout(r,0))
    }
  }

  // Helper to add timeouts to promises
  async function withTimeout<T>(p:Promise<T>, ms:number){
    return await Promise.race([
      p,
      new Promise<T>((_,rej)=>setTimeout(()=>rej(new Error('timeout')), ms))
    ])
  }

  // Try AI enrichment but do not block if it times out or fails
  try{
    const aiPrompt = `Generate a short enrichment for this roadmap based on profile: ${JSON.stringify(profile)}`
    const aiResp = await withTimeout(askAI(aiPrompt), 4000)
    if(aiResp && typeof aiResp === 'string'){
      for(const l of lessons){
        l.aiNote = aiResp
      }
    }
  }catch(err){
    console.error('AI enrichment failed or timed out:', err)
  }

  // Persist lessons in bulk; wait briefly but don't block the UI for long
  try{
    const savePromise = saveLessons(lessons)
    await Promise.race([savePromise, new Promise((_,rej)=>setTimeout(()=>rej(new Error('save timeout')),2000))])
  }catch(err){
    console.error('Failed to persist lessons quickly:', err)
    // fallback: attempt background save
    saveLessons(lessons).catch(e=>console.error('background save failed',e))
  }

  return lessons
}
