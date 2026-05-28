import { openDB } from 'idb'

const DB = 'codementor-ai-db'
const DB_VERSION = 2

async function createOrUpgrade(db:any){
  if(!db.objectStoreNames.contains('kv')) db.createObjectStore('kv')
  if(!db.objectStoreNames.contains('conversations')) db.createObjectStore('conversations', {keyPath:'id'})
  if(!db.objectStoreNames.contains('lessons')) db.createObjectStore('lessons', {keyPath:'id'})
  if(!db.objectStoreNames.contains('progress')) db.createObjectStore('progress', {keyPath:'id'})
}

export async function resetDatabase(){
  try{
    console.warn('Resetting database due to incompatible schema')
    await new Promise((resolve,reject)=>{
      const req = indexedDB.deleteDatabase(DB)
      req.onsuccess = ()=>resolve(undefined)
      req.onerror = ()=>reject(req.error)
      req.onblocked = ()=>{
        console.warn('deleteDatabase blocked')
      }
    })
  }catch(err){
    console.error('resetDatabase failed', err)
    throw err
  }
}

export async function getDB(){
  try{
    return await openDB(DB, DB_VERSION, {
      upgrade(db, oldV, newV, tx){
        createOrUpgrade(db)
      }
    })
  }catch(err:any){
    console.error('openDB failed, attempting reset', err)
    try{
      await resetDatabase()
      return await openDB(DB, DB_VERSION, {upgrade(db){ createOrUpgrade(db) }})
    }catch(err2){
      console.error('Reopening DB after reset failed', err2)
      throw err2
    }
  }
}

export async function saveKV(key:string, value:any){
  const db = await getDB()
  await db.put('kv', value, key)
}

export async function loadKV(key:string){
  const db = await getDB()
  return db.get('kv', key)
}

export async function addMessage(conversationId:string, message:{from:'user'|'assistant'|'system',text:string,timestamp?:number}){
  const db = await getDB()
  const conv = await db.get('conversations', conversationId)
  const ts = message.timestamp || Date.now()
  if(!conv){
    await db.put('conversations',{id:conversationId,messages:[{...message,timestamp:ts}]})
  }else{
    conv.messages.push({...message,timestamp:ts})
    await db.put('conversations',conv)
  }
}

export async function getConversation(conversationId:string){
  const db = await getDB()
  return db.get('conversations', conversationId)
}

export async function saveLesson(lesson:any){
  const db = await getDB()
  await db.put('lessons',lesson)
}

export async function saveLessons(lessons:any[]){
  try{
    const db = await getDB()
    const tx = db.transaction('lessons','readwrite')
    const store = tx.objectStore('lessons')
    for(const l of lessons){
      store.put(l)
    }
    await tx.done
  }catch(err){
    console.error('saveLessons error', err)
    // rethrow for callers that want to handle it
    throw err
  }
}

export async function getLessons(){
  const db = await getDB()
  return db.getAll('lessons')
}

export async function saveProgress(id:string, payload:any){
  const db = await getDB()
  await db.put('progress',{id,...payload})
}

export async function loadProgress(id:string){
  const db = await getDB()
  return db.get('progress',id)
}
