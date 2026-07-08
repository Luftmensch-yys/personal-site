import { useEffect, useRef, useState } from 'react'
import SiteNav from './components/SiteNav'
import PageWipe from './components/PageWipe'
import useEnterTransition from './hooks/useEnterTransition'
import { goToPage } from './lib/navigation'
import { ROUTES } from './lib/routes'

const AWARDS = [
  { title: '大数据竞赛', note: '一等奖' },
  { title: 'Python 编程挑战赛', note: '二等奖' },
  { title: '数据库设计大赛', note: '三等奖' },
  { title: '专业综合测评', note: '优秀奖' },
  { title: '校园技术创新', note: '提名奖' },
]

function Reveal({ children, className = '' }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('is-visible')
          observer.unobserve(el)
        }
      },
      { threshold: 0.18 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={ref} className={`about-reveal ${className}`}>
      {children}
    </section>
  )
}

export default function AboutApp() {
  const bgRef = useRef(null)
  const [leaving, setLeaving] = useState(false)
  const { entering, enterDone } = useEnterTransition()

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      if (!bgRef.current) return
      bgRef.current.style.setProperty('--sy1', `${y * 0.05}px`)
      bgRef.current.style.setProperty('--sy2', `${y * 0.12}px`)
      bgRef.current.style.setProperty('--sy3', `${y * 0.2}px`)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const shellClass = [
    'page-shell about-shell min-h-screen bg-[#06060c] font-serif text-[#e8eaef]',
    leaving ? 'is-leaving' : '',
    entering ? 'is-entering' : '',
    enterDone ? 'is-entering-done' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <main className={shellClass}>
      <div ref={bgRef} className="about-parallax pointer-events-none fixed inset-0 overflow-hidden">
        <span className="about-cloud about-cloud-1" />
        <span className="about-cloud about-cloud-2" />
        <span className="about-cloud about-cloud-3" />
      </div>

      <SiteNav active="about" onNavigate={() => setLeaving(true)} />
      <PageWipe />

      <div className="relative z-10">
        <section className="flex min-h-screen flex-col items-center justify-center px-6 pt-28 text-center md:px-12">
          <p className="about-reveal is-visible mb-5 text-xs tracking-[0.4em] text-white/38 uppercase">
            profile / soft orbit
          </p>
          <h1 className="about-reveal is-visible max-w-3xl text-4xl font-light leading-[1.18] tracking-[0.03em] md:text-6xl">
            关于 yiyisa，和正在生成中的自己。
          </h1>
          <p className="about-reveal is-visible mt-8 max-w-lg text-sm leading-[2.2] text-white/48 md:text-base">
            把个人介绍、学习轨迹和一点点空想感放在同一个页面里，让它和封面保持同一种流动的蓝色呼吸。
          </p>
        </section>

        <Reveal className="mx-auto max-w-2xl px-6 py-28 text-center md:px-12">
          <p className="mb-5 text-xs tracking-[0.36em] text-white/36 uppercase">About Me</p>
          <h2 className="mb-10 text-2xl font-light tracking-wide text-white/92 md:text-3xl">Yan Yisha</h2>
          <p className="text-sm leading-[2.5] text-white/58 md:text-base">
            我是深圳职业技术大学大数据技术专业的学生，目前正在系统学习大数据相关专业课程，包括数据结构、数据库原理、Python数据分析等，逐步夯实专业基础。制作这个个人网页，是希望通过实践巩固前端相关知识，同时也作为个人学习与成长的记录。后续会继续深耕专业领域，探索大数据技术的实际应用，也欢迎大家交流学习心得～
          </p>
        </Reveal>

        <Reveal className="mx-auto max-w-xl px-6 py-24 text-center md:px-12">
          <p className="mb-12 text-xs tracking-[0.36em] text-white/36 uppercase">Awarding</p>
          <ul className="space-y-10">
            {AWARDS.map((item) => (
              <li key={item.title} className="border-b border-white/8 pb-8 last:border-0">
                <p className="text-lg font-light tracking-wide text-white/88">{item.title}</p>
                <p className="mt-2 text-sm text-white/40">{item.note}</p>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal className="mx-auto max-w-xl px-6 py-32 text-center md:px-12">
          <p className="mb-8 text-xs tracking-[0.36em] text-white/36 uppercase">See More</p>
          <a
            href={ROUTES.project}
            className="inline-block text-sm tracking-[0.28em] text-white/48 uppercase transition-colors hover:text-[#91defe]"
            onClick={(e) => {
              setLeaving(true)
              goToPage(e, ROUTES.project)
            }}
          >
            Click →
          </a>
          <footer className="about-reveal mt-24 space-y-3 text-xs leading-relaxed text-white/32">
            <p>© 2026 Yan Yisha</p>
            <p>邮箱:Luftmensch@OUTLOOK.com | GitHub:github.com/yanyisha | 学习交流：仅限技术探讨</p>
            <button
              type="button"
              className="mt-4 text-white/40 transition-colors hover:text-white/70"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              回到顶部
            </button>
          </footer>
        </Reveal>
      </div>
    </main>
  )
}
