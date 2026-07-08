import { useEffect, useState } from 'react'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(localStorage.getItem('cookieAccepted') !== '1')
  }, [])

  if (!visible) return null

  return (
    <div className="fixed bottom-5 left-1/2 z-[80] flex w-[min(640px,calc(100%-32px))] -translate-x-1/2 items-center gap-4 rounded-2xl border border-white/10 bg-[#0c0c14]/88 px-5 py-4 backdrop-blur-md">
      <p className="flex-1 text-sm leading-relaxed text-white/55">
        本站使用本地存储记录 Cookie 偏好，仅用于改善浏览体验。
      </p>
      <button
        type="button"
        className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black"
        onClick={() => {
          localStorage.setItem('cookieAccepted', '1')
          setVisible(false)
        }}
      >
        Accept
      </button>
    </div>
  )
}
