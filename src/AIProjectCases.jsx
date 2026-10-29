import { useState } from 'react'
import { ArrowUpRight, Download, GitBranch } from 'lucide-react'

const BASE = import.meta.env.BASE_URL
const ASSETS = `${BASE}projects/dify/`
const FLOWS = [
  { id: 'clean', name: '数据清洗', number: '01', title: '让不同格式的资料，说同一种语言。', input: '结构化数据、半结构化文档与图片 / 文本资料', steps: ['文档提取与图片分流', '非结构化内容标准化', '代码解析与字段整理', '质量报告 / 字段字典 / JSON'], output: '结构化结果、数据质量报告、字段字典与样例', image: 'cleaning-workflow.png', alt: 'Dify 数据清洗工作流实际截图，包含文档提取、条件分支、图片识别、代码节点和文件输出', file: 'field-dictionary.md', fileLabel: '字段字典示例' },
  { id: 'dashboard', name: '可视化看板', number: '02', title: '从一份数据，到可以查看的看板。', input: '旅游景点数据与可视化需求', steps: ['接收资料与需求', '文档提取', 'LLM 生成看板代码', '保存 HTML 文件'], output: '可在浏览器打开的旅游数据看板', image: 'dashboard-preview.png', alt: 'Dify 历史输出的旅游数据看板，展示筛选项和四组图表', link: 'tourism-dashboard.html', linkLabel: '打开看板示例' },
  { id: 'report', name: '分析报告', number: '03', title: '先看清数据，再组织分析。', input: '景点资料与分析问题', steps: ['文档提取', 'LLM 数据分析', '整理质量问题与分析结论', '保存报告'], output: '包含数据范围、质量问题与探索性分析的 Markdown 报告', image: 'dashboard-preview.png', alt: '与报告同属旅游数据练习的看板输出示例', file: 'analysis-report.md', fileLabel: '分析报告示例' },
  { id: 'agent', name: '智能问答', number: '04', title: '先识别问题，再选择回答路径。', input: '日常对话或旅游咨询问题', steps: ['问题分类', '时间工具 / 知识检索', '按场景组织回答', '回复并保存旅游报告'], output: '分场景回答与旅游行程报告', image: 'agent-workflow.png', alt: 'Dify 智能问答工作流实际截图，展示分类器、时间工具、知识检索和回答分支', file: 'travel-answer.md', fileLabel: '问答输出示例' },
  { id: 'image', name: 'AI 生图', number: '05', title: '把旅游场景，转换成视觉表达。', input: '景点宣传、路线预览、季节氛围、美食人文或海报需求', steps: ['识别图像需求', '选择提示词模板', '调用生图服务', '下载并返回图片'], output: '按不同用途组织的旅游主题 AI 图像', image: 'generated-travel.png', alt: 'Dify 生图工作流保存的海湾与沙滩图像，AI 生成示例，并非实拍照片', link: 'generated-travel.png', linkLabel: '查看生图原图' },
]

function OutLink({ href, children, className = '' }) {
  return <a className={className} href={href} target="_blank" rel="noopener noreferrer">{children}<ArrowUpRight size={16} /></a>
}

export function DifyCase() {
  const [active, setActive] = useState('clean')
  const flow = FLOWS.find(item => item.id === active)
  return (
    <article id="dify" className="showcase-project ai-case page-block" aria-labelledby="dify-title">
      <div className="showcase-project-heading"><span>01 / AI WORKFLOW</span><span>Dify · 文档到结果</span></div>
      <div className="showcase-summary"><div><h2 id="dify-title">Dify · 文档分析与智能体工作流</h2><p className="showcase-subtitle">把资料提取、数据处理、分析和文件输出，连接成可以复用的流程。</p></div><a className="showcase-action" href="#dify-evidence">浏览五类工作流 <GitBranch size={18} /></a></div>
      <div className="case-overview"><span>05 <small>类工作流配置</small></span><span>03 <small>类文档处理入口</small></span><span>01 <small>组旅游场景实践</small></span></div>
      <div className="showcase-details"><section><p className="showcase-label">THE PROBLEM / 用户痛点</p><h3>处理资料，常常比分析资料更费周折。</h3><p>面对表格、文本和图片，需要反复提取内容、整理字段、复制到分析工具，再把结果另存成文件。不同输入格式让流程难以复用。</p></section><section><p className="showcase-label">MY CONTRIBUTION / 个人实现</p><h3>在 Dify 中配置节点、分支与输出。</h3><p>围绕旅游资料练习，配置文档提取、条件分流、代码解析、提示词与文件保存；完成清洗、看板、报告、问答、生图五类工作流，并保留配置与输出文件。</p></section></div>
      <div id="dify-evidence" className="dify-evidence">
        <div className="flow-tabs" role="tablist" aria-label="Dify 工作流分类">{FLOWS.map(item => <button key={item.id} id={`tab-${item.id}`} role="tab" aria-selected={item.id === active} aria-controls="flow-panel" onClick={() => setActive(item.id)}>{item.number}<span>{item.name}</span></button>)}</div>
        <section id="flow-panel" role="tabpanel" aria-labelledby={`tab-${active}`} className="flow-panel">
          <div className="flow-description"><p className="showcase-label">WORKFLOW / {flow.number}</p><h3>{flow.title}</h3><p><strong>输入</strong>{flow.input}</p><ol className="flow-steps">{flow.steps.map(step => <li key={step}>{step}</li>)}</ol><p><strong>输出</strong>{flow.output}</p><div className="evidence-links">{flow.file && <a href={`${ASSETS}${flow.file}`} download><Download size={15} />下载{flow.fileLabel}</a>}{flow.link && <OutLink href={`${ASSETS}${flow.link}`}>{flow.linkLabel}</OutLink>}</div></div>
          <a className={`flow-preview ${flow.id === 'image' ? 'generated-preview' : ''}`} href={`${ASSETS}${flow.image}`} target="_blank" rel="noopener noreferrer"><img src={`${ASSETS}${flow.image}`} alt={flow.alt} width="974" height="584" loading="lazy" /><span>{flow.id === 'image' ? 'AI 生成图像 · 非实拍' : flow.id === 'dashboard' || flow.id === 'report' ? '历史输出示例 · 点击放大' : '本地 Dify 实际编排 · 点击放大'} <ArrowUpRight size={14} /></span></a>
        </section>
      </div>
      <div className="case-output-links"><OutLink href={`${ASSETS}tourism-dashboard.html`}>查看可交互的看板输出</OutLink><a href={`${ASSETS}workflow-index.json`} download><Download size={15} />下载五类流程的节点清单</a></div>
      <div className="showcase-project-footer"><div className="showcase-stack">Dify <span>·</span> LLM / 提示词编排 <span>·</span> 文档提取 / 代码节点 <span>·</span> HTTP / 文件工具</div><span className="case-status">本地配置与历史输出展示</span></div>
      <p className="showcase-data-note">以上来自本地工作流配置与已保存的历史输出。本次核对时，部分旧模型节点提示不兼容，未验证当前环境可完整运行；线上展示静态成果，不连接本地 Dify。旅游数据、报告与模拟图表仅作学习示例，AI 生图不作为实拍展示。</p>
    </article>
  )
}

export function RagCase() {
  return (
    <article id="rag" className="showcase-project ai-case page-block" aria-labelledby="rag-title">
      <div className="showcase-project-heading"><span>02 / ADAPTIVE RAG</span><span>多产品知识库 · 智能客服</span></div>
      <div className="showcase-summary"><div><h2 id="rag-title">多产品知识库智能客服</h2><p className="showcase-subtitle">回答不仅要找到资料，也要让人看见依据。</p></div><OutLink href={`${BASE}projects/rag/architecture.png`} className="showcase-action">查看流程图</OutLink></div>
      <div className="showcase-details"><section><p className="showcase-label">THE PROBLEM / 用户痛点</p><h3>产品资料分散，咨询需要反复翻找。</h3><p>同一个问题可能涉及多份产品说明和客服规则。直接让模型回答，难以区分哪些内容来自资料、哪些仍需要核对。</p></section><section><p className="showcase-label">MY CONTRIBUTION / 个人实现</p><h3>配置检索、检查与重检索的问答闭环。</h3><p>基于既有框架整理 30 篇产品文档与客服资料，配置 Chroma 检索及 LangGraph 编排，串联问题路由、文档相关性筛选、回答检查和问题改写；对接多轮对话前端，展示来源与处理步骤。</p></section></div>
      <div className="rag-route" aria-label="知识问答的处理链路">{['问题路由','问题改写','知识检索','相关性筛选','生成与检查','回答 / 重试'].map((step,i) => <div key={step}><small>{String(i+1).padStart(2,'0')}</small><span>{step}</span></div>)}</div>
      <a className="rag-architecture" href={`${BASE}projects/rag/architecture.png`} target="_blank" rel="noopener noreferrer"><img src={`${BASE}projects/rag/architecture.png`} alt="项目目录中的 RAG 流程图：问题路由到日常对话或检索路径，检查生成结果并决定返回或再次检索" width="1333" height="750" loading="lazy" /><span>项目中的架构示意 · 点击查看大图 <ArrowUpRight size={14} /></span></a>
      <div className="showcase-features"><span>多轮问答</span><span>Chroma 向量检索</span><span>相关性判断</span><span>改写与重检索</span><span>来源与步骤展示</span></div>
      <div className="showcase-project-footer"><div className="showcase-stack">Python / FastAPI <span>·</span> LangGraph <span>·</span> Chroma <span>·</span> React / TypeScript</div><span className="case-status">源码结构与方案展示</span></div>
      <p className="showcase-data-note">基于教学骨架和既有框架完成配置、修改与前端对接；本次核对了本地节点编排与接口结构，未验证付费模型的端到端调用，不展示真实客户数据或未经统计的准确率。</p>
    </article>
  )
}

export function ScreeningCase() {
  return (
    <article id="screening" className="showcase-project ai-case page-block" aria-labelledby="screening-title">
      <div className="showcase-project-heading"><span>03 / AI APPLICATION DELIVERY</span><span>简历初筛 · DDDR 实践</span></div>
      <div className="showcase-summary"><div><h2 id="screening-title">简历初筛辅助应用</h2><p className="showcase-subtitle">从业务询问开始，把筛查需求转化为可操作的应用。</p></div><OutLink href="http://101.42.45.121" className="showcase-action">访问演示入口</OutLink></div>
      <a className="showcase-preview" href="http://101.42.45.121" target="_blank" rel="noopener noreferrer"><div className="showcase-browser"><span /><span /><span /><p>RECRUITMENT ASSISTANT / MVP</p><ArrowUpRight size={16} /></div><img src={`${BASE}projects/screening/login.png`} alt="智能招聘辅助平台的公开登录与演示入口，页面说明 AI 用于初筛辅助和信息标注" width="1440" height="900" loading="lazy" /></a>
      <div className="showcase-details"><section><p className="showcase-label">THE PROBLEM / 用户痛点</p><h3>逐份查简历，对照岗位要求。</h3><p>人工初筛需要反复读取资料、比对岗位条件并整理判断依据。先澄清业务流程，再设计应用，比直接堆叠功能更重要。</p></section><section><p className="showcase-label">MY CONTRIBUTION / 个人实践</p><h3>需求澄清、方案共创与 AI 协作实现。</h3><p>通过业务询问梳理初筛需求，按 Discover—Design—Deploy—Review 组织需求和方案，借助 AI 辅助编码将需求转化为应用流程，以辅助人工筛查为目标。</p></section></div>
      <div className="delivery-steps">{[['Discover','业务询问与需求澄清'],['Design','流程与交互方案'],['Deploy','AI 协作实现'],['Review','回看与完善']].map(([title,desc]) => <div key={title}><h3>{title}</h3><p>{desc}</p></div>)}</div>
      <div className="showcase-project-footer"><div className="showcase-stack">业务需求梳理 <span>·</span> DDDR <span>·</span> AI 辅助编码 <span>·</span> 应用原型</div><span className="case-status">公开入口已核对</span></div>
      <p className="showcase-data-note">本次确认公开入口可访问；未登录或上传候选人简历，未验证各角色与后端业务。展示个人需求梳理和 AI 协作实践，不宣称真实招聘效果或效率提升；AI 作为辅助，最终判断由人工完成。</p>
    </article>
  )
}
