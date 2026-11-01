const CASES = [
  { id: 'career-agent', category: 'LOCAL CAREER AGENT', title: '本地求职 Agent', subtitle: '把散落的经历和岗位要求，整理为可核对的求职材料。', problem: '经历材料分散，面对不同岗位需要反复选材、改简历，还需要记录投递准备和面试进度。', action: '梳理可跳过步骤的模块流程与基础资料入口，使用 Codex 协作实现本地网页工作台；通过 Python / SQLite 保存资料，使用 Node.js 与 Chrome CDP 读取已登录页面的职位信息，接入模型完成分析与问候语草拟。', result: '提供可编辑 HTML 简历、逐岗材料选择和本地进度记录；模型分析和投递准备保留人工修改与确认。', note: '本地原型展示。投递准备与实际平台发送分别记录，未将自动发送或实际投递效果作为已完成能力。', tags: ['Python / SQLite', 'Chrome CDP', 'LLM', 'HTML 简历', '人工确认'] },
  { id: 'coze', category: 'VIDEO WORKFLOW', title: 'Coze · 视频生成与字幕工作流', subtitle: '把片段、声音和字幕连接成制作流程。', problem: '视频制作涉及片段组合、配音、字幕生成与烧录，重复操作容易分散在多个环节。', action: '在 Coze 中组织视频片段、TTS 配音、自动字幕与字幕烧录链路，配置批量制作流程。', result: '以工作流串联素材到成片的步骤，作为 AIGC 内容制作实践。', note: '此处展示已确认的流程实践；未提供公开视频样片或经过统计的制作效率数据。', tags: ['Coze', 'TTS', '自动字幕', '字幕烧录'] },
  { id: 'story-to-gal', category: 'TEAM / HACKATHON', title: 'StoryToGal', subtitle: '团队协作中的前端与 AI 编码实践。', problem: '团队项目需要将应用想法转化为用户能够浏览和操作的页面。', action: '参与黑客松团队项目，使用 AI 辅助编码实现前端页面与交互，配合团队完成界面部分。', result: '个人贡献集中在前端实现与页面交互。', note: '团队项目，按个人实际参与范围展示；后端与模型能力不计为个人独立实现。', tags: ['团队协作', '前端交互', 'AI 辅助编码'] },
]
export default function AdditionalCases() {
  return <>{CASES.map(item => <article id={item.id} key={item.id} className="showcase-project ai-case page-block" aria-labelledby={`${item.id}-title`}>
    <div className="showcase-project-heading"><span>{item.category}</span><span>应用实践</span></div>
    <div className="showcase-summary"><div><h2 id={`${item.id}-title`}>{item.title}</h2><p className="showcase-subtitle">{item.subtitle}</p></div></div>
    <div className="showcase-details"><section><p className="showcase-label">THE PROBLEM / 问题</p><h3>从具体需求出发。</h3><p>{item.problem}</p></section><section><p className="showcase-label">MY CONTRIBUTION / 个人实践</p><h3>将需求转化为流程与界面。</h3><p>{item.action}</p><p>{item.result}</p></section></div>
    <div className="showcase-features">{item.tags.map(tag => <span key={tag}>{tag}</span>)}</div>
    <p className="showcase-data-note">{item.note}</p>
  </article>)}</>
}
