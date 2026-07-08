import { useCallback, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import SiteNav from './components/SiteNav'
import PageWipe from './components/PageWipe'
import EllipticGallery from './components/EllipticGallery'
import CookieBanner from './components/CookieBanner'
import useEnterTransition from './hooks/useEnterTransition'
import { PROJECT_ITEMS } from './lib/routes'

export default function InterestsApp() {
  const [leaving, setLeaving] = useState(false)
  const [activeCard, setActiveCard] = useState(PROJECT_ITEMS[0])
  const { entering, enterDone } = useEnterTransition()

  const handleActiveCard = useCallback((card) => setActiveCard(card), [])

  const shellClass = [
    'page-shell interests-shell relative min-h-screen overflow-hidden bg-[#06060c] font-geist text-white',
    leaving ? 'is-leaving' : '',
    entering ? 'is-entering' : '',
    enterDone ? 'is-entering-done' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <main className={shellClass}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_100%,rgba(90,100,150,0.14),transparent_60%),linear-gradient(180deg,#06060c,#0a0a12)]" />

      <SiteNav active="project" />
      <PageWipe />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="page-block flex flex-[0.88] flex-col items-center justify-center px-6 pt-24 text-center md:pt-28">
          <p className="mb-2 text-xs tracking-[0.32em] text-white/42 uppercase">Portfolio</p>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCard.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4 }}
            >
              <h1 className="text-3xl font-medium tracking-tight md:text-5xl">{activeCard.title}</h1>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-white/50 md:text-base">{activeCard.desc}</p>
            </motion.div>
          </AnimatePresence>
        </header>

        <div className="page-block -mt-2 flex w-full shrink-0 flex-col items-center pb-20 md:-mt-4">
          <EllipticGallery onActiveCardChange={handleActiveCard} onLeave={() => setLeaving(true)} />
          <p className="mt-4 text-[11px] tracking-[0.24em] text-white/28 uppercase">
            Scroll to orbit · Click center to enter
          </p>
        </div>
      </div>

      <CookieBanner />
    </main>
  )
}
