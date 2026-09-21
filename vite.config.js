import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        profile: 'about.html',
        interests: 'project.html',
        message: 'contact.html',
        gallery: 'gallery.html',
        music: 'music.html',
        craft: 'handmake.html',
        modeling: 'modeling.html',
        game: 'games.html',
        ff7: 'final-fantasy-vii.html',
        p5r: 'persona-5-royal.html',
        more: 'more.html',
      },
    },
  },
})
