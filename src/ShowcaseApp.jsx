import { useState } from 'react'
import { ArrowUpRight, ArrowLeft, Github } from 'lucide-react'
import SiteNav from './components/SiteNav'
import PageWipe from './components/PageWipe'
import useEnterTransition from './hooks/useEnterTransition'
import { ROUTES } from './lib/routes'
import { goToPage } from './lib/navigation'
import './showcase.css'
import { DifyCase, RagCase, ScreeningCase } from './AIProjectCases'

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
          <p className="showcase-eyebrow">Application projects · 05</p>
          <h1>项目展示<span>Projects in practice.</span></h1>
          <p className="showcase-intro">从 AI 工作流与知识问答，到业务应用与数据可视化。用实际配置、输出和界面，记录我把问题变成作品的过程。</p>
          <nav className="case-nav" aria-label="项目快速导航"><a href="#dify">Dify 工作流</a><a href="#rag">知识库客服</a><a href="#screening">简历初筛</a><a href="#rental">租房看板</a><a href="#p5r">P5R 社区</a></nav>
        </header>

        <DifyCase />
        <RagCase />
        <ScreeningCase />
        <article id="rental" className="showcase-project ai-case page-block" aria-labelledby="rental-title">
          <div className="showcase-project-heading"><span>04 / DATA VISUALIZATION</span><span>深圳 · 租房与通勤</span></div>
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
        <article id="p5r" className="showcase-project page-block p5r-project" aria-labelledby="p5r-title">
          <div className="showcase-project-heading"><span>05 / INTERACTIVE COMMUNITY</span><span>P5R · 同好交流</span></div>
          <div className="showcase-summary">
            <div><h2 id="p5r-title">P5R · 怪盗留言板</h2><p className="showcase-subtitle">从“你相信怪盗团存在吗”开始，让同好有话可聊。</p></div>
            <a className="showcase-action" href="https://github.com/Luftmensch-yys/p5r-phantom-forum" target="_blank" rel="noopener noreferrer">项目源码 <Github size={19} /></a>
          </div>
          <a className="showcase-preview" href={`${BASE}projects/p5r/vote-v3.png`} target="_blank" rel="noopener noreferrer" aria-label="查看怪盗留言板投票截图大图">
            <div className="showcase-browser"><span /><span /><span /><p>P5R / PHANTOM COMMUNITY</p><ArrowUpRight size={16} /></div>
            <img src={`${BASE}projects/p5r/vote-v3.png`} alt="P5R 红黑主题投票界面：怪盗团是否真实存在，选择按钮和投票比例" width="1440" height="1000" loading="lazy" />
          </a>
          <div className="showcase-details">
            <section><p className="showcase-label">THE PROBLEM / 用户痛点</p><h3>喜欢同一部作品，如何开启交流？</h3><p>单向浏览内容很难形成讨论。同好需要容易参与的话题入口，也需要能接着聊、找到自己发言的交流空间。</p></section>
            <section><p className="showcase-label">THE APPROACH / 解决方式</p><h3>用主题投票开启话题，用回复延续讨论。</h3><p>围绕怪盗团设计主题投票，将结果可视化；结合账号登录、留言回复和个人发言记录，串起参与、交流与回看的过程，并以红黑视觉和星形动画营造作品氛围。</p></section>
          </div>
          <div className="showcase-features"><span>主题投票与比例统计</span><span>留言与回复</span><span>账号与个人资料</span><span>动态星形背景</span></div>
          <div className="p5r-gallery">
            {[['comments','留言与回复'],['profile','个人资料与发言记录'],['login','账号登录']].map(([file,label]) => <a key={file} href={`${BASE}projects/p5r/${file}-v3.png`} target="_blank" rel="noopener noreferrer"><img src={`${BASE}projects/p5r/${file}-v3.png`} alt={`P5R ${label}实际界面`} loading="lazy" /><span>{label} <ArrowUpRight size={13}/></span></a>)}
          </div>
          <div className="showcase-project-footer"><div className="showcase-stack">PHP / MySQL <span>·</span> JavaScript <span>·</span> p5.js</div><a href="https://github.com/Luftmensch-yys/p5r-phantom-forum" target="_blank" rel="noopener noreferrer"><Github size={16}/> 查看源码与运行说明 <ArrowUpRight size={14}/></a></div>
          <p className="showcase-data-note">以上为本地运行截图，账号、留言和投票均为演示数据。当前提供界面展示与源码，完整交互需在 PHP + MySQL 环境运行。</p>
        </article>
        <footer className="showcase-footer page-block"><span>yiyisa&apos;s space / Projects</span><span>持续记录，持续完善。</span></footer>
      </div>
    </main>
  )
}
