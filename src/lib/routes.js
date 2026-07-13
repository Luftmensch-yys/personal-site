export const ROUTES = {
  home: 'index.html',
  project: '兴趣页.html',
  about: '个人页.html',
  contact: '留言页.html',
  gallery: '绘画摄影.html',
  game: '游戏页.html',
  music: '音乐页.html',
  craft: '手工页.html',
  modeling: '建模页.html',
  more: 'more.html',
}

export const NAV_ITEMS = [
  { key: 'home', label: 'Home', href: ROUTES.home },
  { key: 'project', label: 'Project', href: ROUTES.project },
  { key: 'about', label: 'About', href: ROUTES.about },
  { key: 'contact', label: 'Contact', href: ROUTES.contact },
]

export const PROJECT_ITEMS = [
  {
    title: 'Visual Archive',
    label: '绘画摄影',
    desc: '用图像记录瞬间的光影与情绪，像把日记折进一张会呼吸的底片。',
    href: ROUTES.gallery,
    img: 'ff7/c1.jpg',
  },
  {
    title: 'Game Worlds',
    label: '游戏',
    desc: '在虚拟叙事里漫游，收集角色、场景和那些忘不掉的通关瞬间。',
    href: ROUTES.game,
    img: 'ff7/rb.jpg',
  },
  {
    title: 'Sound Shelf',
    label: '音乐',
    desc: '音乐是记忆的载体，某段旋律响起时，时间也会轻轻折返。',
    href: ROUTES.music,
    img: 'music/1.png',
  },
  {
    title: 'Handmade Lab',
    label: '手工',
    desc: '折纸、手作与小实验，让想法从屏幕里探出头来。',
    href: ROUTES.craft,
    img: 'make/cover.png',
  },
  {
    title: '3D Modeling',
    label: '建模',
    desc: '把脑海里的形状捏成可旋转的体积，让光在多边形上找到落点。',
    href: ROUTES.modeling,
    img: 'modeling/cover.png',
  },
  {
    title: 'Next Room',
    label: 'More',
    desc: '还在生长中的空间，留给未来的作品集、日志与灵感碎片。',
    href: ROUTES.more,
    img: 'ff7/s.png',
  },
]
