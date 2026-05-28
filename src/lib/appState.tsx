import React, { createContext, useContext, useEffect, useState } from 'react'
import { loadState, saveState } from './storage'
import { getLessons } from './memory'
import { getProgress } from './progress'
import { generateRoadmap } from './lessonEngine'
import translations from './translations'
import { createGeminiProvider } from './geminiProvider'
import { setProvider } from './aiProvider'
import { loadState as loadKV } from './storage'

type AppStateType = {
  profile: any | null
  setProfile: (p: any) => Promise<void>

  lessons: any[]
  refreshLessons: () => Promise<any[]>

  progress: any | null
  refreshProgress: () => Promise<any>

  language: string
  setLanguage: (l: string) => Promise<void>

  t: (k: string) => string
}

const AppStateContext = createContext<AppStateType | null>(null)

export function useAppState() {
  const c = useContext(AppStateContext)

  if (!c) {
    throw new Error('useAppState must be used within AppStateProvider')
  }

  return c
}

export function AppStateProvider({
  children
}: {
  children: React.ReactNode
}) {
  const [profile, setProfileState] = useState<any | null>(null)
  const [lessons, setLessons] = useState<any[]>([])
  const [progress, setProgressState] = useState<any | null>(null)
  const [language, setLanguageState] = useState<string>('en')

  // Update document language for screen readers and a11y whenever language changes
  useEffect(()=>{
    try{ document.documentElement.lang = language || 'en' }catch(e){/* ignore */}
  },[language])

  function t(key: string) {
    const dict = translations?.[language] || translations?.en || {}
    return dict[key] || key
  }

  useEffect(() => {
    let mounted = true

    ;(async () => {
      try {
        const p = await loadState('profile')
        const savedLang = await loadState('app_language')

        const l = (await getLessons()) || []
        const pr = await getProgress('local-user')

        if (!mounted) return

        if (savedLang) {
          setLanguageState(savedLang)
        }

        setProfileState(p || null)
        setLessons(l)
        setProgressState(pr)

        if (l.length === 0) {
          try {
            const seedProfile = {
              name: 'Learner',
              langs: 'python',
              level: 'Beginner'
            }

            await generateRoadmap(seedProfile)

            const refreshed = await getLessons()

            if (mounted) {
              setLessons(refreshed || [])
            }
          } catch (err) {
            console.error('generateRoadmap failed', err)
          }
        }

        // attempt to restore provider config
        try{
          (async ()=>{
            const pc = await loadKV('provider_config')
            if(pc && (pc.apiKey || pc.proxyUrl)){
              try{
                const prov = createGeminiProvider({ apiKey: pc.apiKey })
                setProvider(prov)
              }catch(e){
                console.warn('Failed to restore AI provider', e)
              }
            }
          })()
        }catch(e){
          console.warn('No provider config to restore')
        }
      } catch (err) {
        console.error('AppState init failed', err)
      }
    })()

    return () => {
      mounted = false
    }
  }, [])

  async function setProfile(p: any) {
    setProfileState(p)

    try {
      await saveState('profile', p)
    } catch (err) {
      console.error(err)
    }
  }

  async function refreshLessons() {
    try {
      const l = (await getLessons()) || []
      setLessons(l)
      return l
    } catch (err) {
      console.error(err)
      return []
    }
  }

  async function refreshProgress() {
    try {
      const pr = await getProgress('local-user')
      setProgressState(pr)
      return pr
    } catch (err) {
      console.error(err)
      return null
    }
  }

  async function setLanguage(l: string) {
    setLanguageState(l)

    try {
      await saveState('app_language', l)
    } catch (err) {
      console.error(err)
    }
  }

  const value: AppStateType = {
    profile,
    setProfile,

    lessons,
    refreshLessons,

    progress,
    refreshProgress,

    language,
    setLanguage,

    t
  }

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  )
}