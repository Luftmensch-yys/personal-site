import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import SiteNav from './components/SiteNav'
import PageWipe from './components/PageWipe'
import useEnterTransition from './hooks/useEnterTransition'
import { ROUTES } from './lib/routes'
import { goToPage } from './lib/navigation'

const VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260622_204221_5339e40b-e73d-4ab0-9c65-79c18c66fd50.mp4'

export default function App() {
  const [leaving, setLeaving] = useState(false)
  const { entering, enterDone } = useEnterTransition()

  const shellClass = [
    'page-shell relative h-screen w-full overflow-hidden bg-black font-geist',
    leaving ? 'is-leaving' : '',
    entering ? 'is-entering' : '',
    enterDone ? 'is-entering-done' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const handleNav = (event, href) => {
    if (href === ROUTES.home && (window.location.pathname === '/' || window.location.pathname.endsWith('index.html'))) {
      event.preventDefault()
      return
    }
    setLeaving(true)
    goToPage(event, href)
  }

  return (
    <div className={shellClass}>
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: '70% center' }}
        src={VIDEO_URL}
      />

      <PageWipe />
      <SiteNav active="home" onNavigate={() => setLeaving(true)} />

      <div className="relative z-10 flex h-[calc(100vh-80px)] flex-col justify-between px-6 pb-10 pt-12 sm:pb-12 sm:pt-16 md:px-12 md:pb-16 md:pt-20 lg:px-16">
        <div className="max-w-3xl">
          <p className="mb-4 animate-[fadeSlideUp_0.8s_ease_0.2s_both] text-xs text-white/90 sm:mb-6 sm:text-sm">
            Brand &amp; Visual Storytelling
          </p>
          <h1 className="animate-[fadeSlideUp_0.8s_ease_0.4s_both] text-3xl font-medium leading-[1.1] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
            yiyisa&apos;s space
            <br />
            shaping visual
            <br />
            narratives.
          </h1>
        </div>

        <div>
          <p className="mb-5 max-w-sm animate-[fadeSlideUp_0.8s_ease_0.7s_both] text-sm leading-relaxed text-white/60 sm:mb-6 sm:max-w-lg sm:text-base md:text-lg">
            Turning vision into reality through craft, motion, and an endless pursuit of beauty.
          </p>
          <a
            href={ROUTES.project}
            className="inline-flex animate-[fadeSlideUp_0.8s_ease_0.9s_both] items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black transition-transform hover:scale-105 sm:px-6 sm:py-3"
            onClick={(e) => handleNav(e, ROUTES.project)}
          >
            Explore Work
            <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </div>
  )
}
