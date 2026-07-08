import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        profile: '个人页.html',
        interests: '兴趣页.html',
        message: '留言页.html',
        gallery: '绘画摄影.html',
        music: '音乐页.html',
        craft: '手工页.html',
        game: '游戏页.html',
        ff7: 'final-fantasy-vii.html',
        p5r: '女神异闻录5皇家版.html',
        more: 'more.html',
      },
    },
  },
})
