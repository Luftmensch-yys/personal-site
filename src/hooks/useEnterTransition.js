import { useEffect, useState } from 'react'

export default function useEnterTransition() {
  const [entering, setEntering] = useState(false)
  const [enterDone, setEnterDone] = useState(false)

  useEffect(() => {
    const fromTransition =
      document.documentElement.classList.contains('from-page-transition') ||
      sessionStorage.getItem('pageTransition') === 'forward'

    sessionStorage.removeItem('pageTransition')
    if (!fromTransition) return undefined

    setEntering(true)
    const t1 = window.setTimeout(() => {
      setEnterDone(true)
      document.documentElement.classList.remove('from-page-transition')
    }, 30)
    const t2 = window.setTimeout(() => setEntering(false), 620)

    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [])

  return { entering, enterDone }
}
