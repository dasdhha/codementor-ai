import React, { useEffect, useState } from 'react'
import Layout from './components/Layout'
import Onboarding from './components/Onboarding'
import { loadState, saveState } from './lib/storage'
import ErrorBoundary from './components/ErrorBoundary'
import { AppStateProvider } from './lib/appState'
import { ThemeProvider } from './lib/theme'
import { getLessons } from './lib/memory'
import { generateRoadmap } from './lib/lessonEngine'

export default function App() {
  const [hydrated, setHydrated] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(true)

  useEffect(() => {
    (async () => {
      try{
        const s = await loadState('app')
        if (s?.onboarded) setShowOnboarding(false)
      }catch(err){
        console.error('Failed to load app state', err)
      }finally{
        setHydrated(true)
      }
    })()
  }, [])

  useEffect(()=>{
    ;(async()=>{
      try{
        const lessons = await getLessons()
        if(!lessons || lessons.length===0){
          const profile = (await loadState('profile')) || {name:'Learner',langs:'Python',level:'Beginner'}
          await generateRoadmap(profile)
        }
      }catch(e){
        console.warn('Failed to ensure lessons',e)
      }
    })()
  },[])

  useEffect(() => {
    saveState('app', { onboarded: !showOnboarding })
  }, [showOnboarding])

  if (!hydrated) return <div className="center">Loading…</div>

  return (
    <div className="app-root">
      <ThemeProvider>
        <AppStateProvider>
        <a className="skip-link sr-only" href="#main-content">Skip to main content</a>
        <div id="a11y-live" aria-live="polite" className="sr-only" />
        {showOnboarding ? (
          <ErrorBoundary>
            <Onboarding onFinish={() => setShowOnboarding(false)} />
          </ErrorBoundary>
        ) : null}
        <Layout />
        </AppStateProvider>
      </ThemeProvider>
    </div>
  )
}
