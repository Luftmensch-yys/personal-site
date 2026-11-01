import './project-index.css'

export const APPLICATION_PROJECTS = [
  { id: 'screening', tag: 'FDE / DDDR', title: '简历初筛辅助应用', desc: '从业务询问与需求澄清出发，通过 AI 协作实现辅助招聘初筛的应用。', status: '项目入口与实践说明', href: 'showcase.html#screening' },
  { id: 'rag', tag: 'LangGraph / Chroma', title: '多产品知识库智能客服', desc: '将知识检索、相关性判断、回答检查与问题改写连接起来，展示回答来源。', status: '架构与个人实现', href: 'showcase.html#rag' },
  { id: 'dify', tag: 'Dify / Workflow', title: '文档分析与智能体工作流', desc: '清洗、看板、报告、问答与生图五类工作流，附实际配置与历史输出。', status: '可交互成果与流程', href: 'showcase.html#dify' },
  { id: 'rental', tag: '数据分析 / ECharts', title: '深圳租房决策看板', desc: '把预算、租金负担与通勤偏好放在一起比较，辅助租房选择。', status: '静态样本在线体验', href: 'showcase.html#rental' },
  { id: 'p5r', tag: 'PHP / MySQL', title: 'P5R · 怪盗留言板', desc: '通过主题投票、留言回复与个人发言记录，为同好提供交流入口。', status: '实际界面与源码', href: 'showcase.html#p5r' },
]

export default function ProjectIndex() {
  return <section id="all-projects" className="project-index" aria-labelledby="all-projects-title">
    <header><p>APPLICATIONS & EXPERIMENTS</p><h2 id="all-projects-title">全部应用项目</h2><span>按问题和实践整理，每个项目都有独立入口。</span></header>
    <div className="project-index-grid">{APPLICATION_PROJECTS.map((project, index) => <a id={project.id} key={project.id} className="project-index-card" href={project.href}>
      <div className="project-index-meta"><span>{project.tag}</span><span>{String(index + 1).padStart(2, '0')}</span></div>
      <h3>{project.title}</h3><p>{project.desc}</p><footer>{project.status}<span aria-hidden="true">↗</span></footer>
    </a>)}</div>
    <div className="project-creative-links"><span>更多创作</span><a href="films.html">视频剪辑与 AIGC ↗</a><a href="modeling.html">三维建模 ↗</a><a href="gallery.html">绘画与摄影 ↗</a></div>
  </section>
}
