import { MEDIA_BASE } from './media-config.js'

const titles = ['see you again', 'where did you go', 'wine', 'seagull', 'circle']
const grid = document.querySelector('#films')
titles.forEach((title, index) => {
  const article = document.createElement('article')
  article.className = 'film'
  const video = document.createElement('video')
  video.controls = true
  video.playsInline = true
  video.preload = 'none'
  video.poster = `${import.meta.env.BASE_URL}video-posters/${encodeURIComponent(title)}.jpg`
  video.src = `${MEDIA_BASE}/video/${encodeURIComponent(title)}.mp4`
  video.setAttribute('aria-label', title)
  const heading = document.createElement('h2')
  heading.textContent = title
  const caption = document.createElement('p')
  caption.textContent = `${String(index + 1).padStart(2, '0')} / Personal edit`
  article.append(video, heading, caption)
  grid.append(article)
  video.addEventListener('play', () => {
    grid.querySelectorAll('video').forEach(other => { if (other !== video) other.pause() })
  })
})
