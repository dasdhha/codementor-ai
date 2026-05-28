import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type Theme = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'app_theme'

function prefersDark() {
  return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
}

function applyResolvedTheme(resolved: 'light' | 'dark'){
  try{
    const el = document.documentElement
    // add a transition class to animate theme changes
    el.classList.add('theme-transition')
    el.setAttribute('data-theme', resolved)
    // remove the transition helper after animation
    window.setTimeout(()=> el.classList.remove('theme-transition'), 400)
  }catch(e){
    // ignore
  }
}

const ThemeContext = createContext<{
  theme: Theme,
  resolved: 'light'|'dark',
  setTheme: (t: Theme)=>void
}>({ theme: 'system', resolved: prefersDark() ? 'dark' : 'light', setTheme: ()=>{} })

export const ThemeProvider: React.FC<React.PropsWithChildren<{}>> = ({ children })=>{
  const [theme, setThemeState] = useState<Theme>(() => {
    try{
      const stored = localStorage.getItem(STORAGE_KEY)
      return (stored as Theme) || 'system'
    }catch(e){
      return 'system'
    }
  })

  const [resolved, setResolved] = useState<'light'|'dark'>(()=> prefersDark() ? 'dark' : 'light')

  useEffect(()=>{
    function resolveAndApply(t: Theme){
      const r = t === 'system' ? (prefersDark() ? 'dark' : 'light') : t
      setResolved(r)
      applyResolvedTheme(r)
    }

    resolveAndApply(theme)

    // if system, watch for changes
    let m: MediaQueryList | null = null
    if(theme === 'system' && typeof window !== 'undefined' && window.matchMedia){
      m = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = (ev: MediaQueryListEvent|MediaQueryList) => {
        const nowDark = (ev as any).matches
        const r = nowDark ? 'dark' : 'light'
        setResolved(r)
        applyResolvedTheme(r)
      }
      try{ m.addEventListener ? m.addEventListener('change', handler as any) : m.addListener(handler as any) }catch(e){ }
      return ()=>{ try{ m && (m.removeEventListener ? m.removeEventListener('change', handler as any) : m.removeListener(handler as any)) }catch(e){} }
    }
  }, [theme])

  useEffect(()=>{
    try{ localStorage.setItem(STORAGE_KEY, theme) }catch(e){}
  }, [theme])

  const ctx = useMemo(()=>({ theme, setTheme: setThemeState, resolved }), [theme, resolved])

  return (
    <ThemeContext.Provider value={ctx}>{children}</ThemeContext.Provider>
  )
}

export function useTheme(){
  return useContext(ThemeContext)
}

export default ThemeProvider
