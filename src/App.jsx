import { useEffect, useRef, useState } from 'react'
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
  const videoRef = useRef(null)
  const [videoFailed, setVideoFailed] = useState(false)

  useEffect(() => {
    // iOS / 部分安卓浏览器不会因 autoPlay 属性自动播放，需要显式调用 play()
    const v = videoRef.current
    if (!v) return undefined
    const tryPlay = () => v.play().catch(() => {})
    tryPlay()
    // 首屏若仍被拦截，监听首次交互兜底触发播放
    const onFirstInteract = () => tryPlay()
    window.addEventListener('touchstart', onFirstInteract, { once: true, passive: true })
    window.addEventListener('click', onFirstInteract, { once: true })
    return () => {
      window.removeEventListener('touchstart', onFirstInteract)
      window.removeEventListener('click', onFirstInteract)
    }
  }, [])

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
      {/* 视频未加载/加载失败时的兜底背景，避免手机上纯黑或卡住 */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_40%,#3a2f5b_0%,#0a0a10_60%)]" />

      {videoFailed ? null : (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          disablePictureInPicture
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: '70% center' }}
          src={VIDEO_URL}
          onError={() => setVideoFailed(true)}
        />
      )}

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
