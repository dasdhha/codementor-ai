import { saveProgress, loadProgress } from './memory'

export function levelFromXP(xp:number){
  // simple level curve: level = floor(sqrt(xp/100)) + 1
  return Math.floor(Math.sqrt(xp/100)) + 1
}

export async function addXP(userId:string, amount:number){
  const cur = (await loadProgress(userId)) || {id:userId,xp:0,lastActive:0,streak:0}
  cur.xp = (cur.xp||0) + amount
  cur.lastActive = Date.now()
  // streak: if lastActive within 48h, increment; else reset
  const prev = cur._prevActive || 0
  const diff = Date.now() - prev
  if(prev && diff < 48*3600*1000) cur.streak = (cur.streak||0) + 1
  else cur.streak = 1
  cur._prevActive = Date.now()
  cur.level = levelFromXP(cur.xp)
  await saveProgress(userId,cur)
  return cur
}

export async function getProgress(userId:string){
  const cur = (await loadProgress(userId)) || {id:userId,xp:0,level:1,streak:0}
  cur.level = levelFromXP(cur.xp||0)
  return cur
}
