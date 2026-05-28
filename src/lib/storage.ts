import { getDB } from './memory'

const STORE = 'kv'

async function db(){
  // Prefer shared getDB to ensure consistent versioning and migrations
  return getDB()
}

export async function saveState(key:string, value:any){
  try{
    const d = await db()
    await d.put(STORE, value, key)
  }catch(err){
    console.error('saveState failed, falling back to localStorage', err)
    try{ localStorage.setItem(`cm:${key}`, JSON.stringify(value)) }catch(_){}
  }
}

export async function loadState(key:string){
  try{
    const d = await db()
    return d.get(STORE, key)
  }catch(err){
    console.error('loadState failed, using localStorage fallback', err)
    try{ const v = localStorage.getItem(`cm:${key}`); return v ? JSON.parse(v) : undefined }catch(e){return undefined}
  }
}

export async function clearState(){
  try{
    const d = await db()
    await d.clear(STORE)
  }catch(err){
    console.error('clearState failed', err)
    try{ localStorage.clear() }catch(_){}
  }
}
