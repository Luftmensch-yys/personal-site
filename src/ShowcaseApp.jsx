import { useState } from 'react'
import { ArrowUpRight, ArrowLeft, Github } from 'lucide-react'
import SiteNav from './components/SiteNav'
import PageWipe from './components/PageWipe'
import useEnterTransition from './hooks/useEnterTransition'
import { ROUTES } from './lib/routes'
import { goToPage } from './lib/navigation'
import './showcase.css'

const BASE = import.meta.env.BASE_URL
const DEMO = `${BASE}projects/shenzhen-rental/index.html`
const PREVIEW = `${BASE}projects/shenzhen-rental-preview.png`
const SOURCE = 'https://github.com/Luftmensch-yys/shenzhen_rental_visualization'

export default function ShowcaseApp() {
  const { entering, enterDone } = useEnterTransition()
  const [leaving, setLeaving] = useState(false)
  const shellClass = ['page-shell showcase-shell min-h-screen bg-white font-geist text-neutral-900', leaving && 'is-leaving', entering && 'is-entering', enterDone && 'is-entering-done'].filter(Boolean).join(' ')

  return (
    <main className={shellClass}>
      <SiteNav active="project" onNavigate={() => setLeaving(true)} />
      <PageWipe />
      <div className="showcase-content">
        <header className="showcase-hero page-block">
          <a className="showcase-back" href={ROUTES.project} onClick={(event) => { setLeaving(true); goToPage(event, ROUTES.project) }}><ArrowLeft size={15} /> 返回作品分类</a>
          <p className="showcase-eyebrow">Selected projects · 01</p>
          <h1>项目展示<span>Projects in practice.</span></h1>
          <p className="showcase-intro">把实际问题变成可以体验的工具。这里记录我的应用项目，以及它们解决问题的方式。</p>
        </header>

        <article className="showcase-project page-block" aria-labelledby="rental-title">
          <div className="showcase-project-heading"><span>01 / DATA VISUALIZATION</span><span>深圳 · 租房与通勤</span></div>
          <div className="showcase-summary">
            <div><h2 id="rental-title">深圳租房决策看板</h2><p className="showcase-subtitle">在租金、收入和通勤之间，找到更适合自己的选择。</p></div>
            <a className="showcase-action" href={DEMO} target="_blank" rel="noopener noreferrer">在线体验 <ArrowUpRight size={19} /></a>
          </div>
          <a className="showcase-preview" href={DEMO} target="_blank" rel="noopener noreferrer" aria-label="打开深圳租房决策看板在线体验">
            <div className="showcase-browser"><span /><span /><span /><p>SHENZHEN RENTAL DASHBOARD</p><ArrowUpRight size={16} /></div>
            <img src={PREVIEW} alt="深圳租房看板的实际界面：房源地图、区域平均租金、通勤与租金散点图和租金分段分布" width="1600" height="1010" fetchPriority="high" />
          </a>
          <div className="showcase-details">
            <section><p className="showcase-label">THE PROBLEM / 用户痛点</p><h3>便宜的房子，真的适合我吗？</h3><p>刚到深圳找房，往往要在房租、收入负担和每天的通勤时间之间反复权衡。只比较价格，很难看清不同区域的取舍。</p></section>
            <section><p className="showcase-label">THE APPROACH / 解决方式</p><h3>让预算与通勤一起参与比较。</h3><p>输入月薪、租金上限和通勤偏好，通过地图与图表联动查看房源，结合租金负担和通勤时间的加权评分缩小选择范围。</p></section>
          </div>
          <div className="showcase-features"><span>预算与偏好筛选</span><span>地图与图表联动</span><span>区域租金比较</span><span>通勤成本分析</span></div>
          <div className="showcase-project-footer"><div className="showcase-stack">Python / pandas <span>·</span> ECharts <span>·</span> HTML / JavaScript</div><a href={SOURCE} target="_blank" rel="noopener noreferrer"><Github size={16} /> 查看源码 <ArrowUpRight size={14} /></a></div>
          <p className="showcase-data-note">当前为静态样本演示，数据不实时更新。通勤以南山高新园为终点，评分按项目设定的权重计算。</p>
        </article>
        <footer className="showcase-footer page-block"><span>yiyisa&apos;s space / Projects</span><span>持续记录，持续完善。</span></footer>
      </div>
    </main>
  )
}
