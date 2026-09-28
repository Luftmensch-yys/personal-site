import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { PROJECT_ITEMS } from '../lib/routes'
import { goToPage } from '../lib/navigation'

const COUNT = PROJECT_ITEMS.length
const VISIBLE_ROUNDS = 5
const CENTER_ROUND = Math.floor(VISIBLE_ROUNDS / 2)
const MASK_IMAGE =
  'url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNDQwIiBoZWlnaHQ9IjUwMCIgdmlld0JveD0iMCAwIDE0NDAgNTAwIiBpZD0iaiI+CiAgPHBhdGggZmlsbD0icmdiKDIwMCwyMDAsMjAwKSIgZmlsbC1ydWxlPSJldmVub2RkIiBkPSJNMCAwczI3NS4wNCAxMDAgNzIwIDEwMFMxNDQwIDAgMTQ0MCAwdjUwMHMtMjc1LjA0LTEwMC03MjAtMTAwUzAgNTAwIDAgNTAwVjB6Ii8+Cjwvc3ZnPgo=")'
const MOVE_TRANSITION = { type: 'spring', stiffness: 120, damping: 22, mass: 0.9 }

function wrapIndex(index) {
  return ((index % COUNT) + COUNT) % COUNT
}

function getLayout() {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1280
  const isSmall = vw < 760
  const cardWidth = isSmall ? Math.min(vw * 0.68, 320) : Math.min(Math.max(vw * 0.25, 290), 430)
  const spacing = isSmall ? 18 : Math.min(Math.max(vw * 0.018, 18), 30)
  const cardHeight = cardWidth / 0.72
  const bannerHeight = cardHeight + (isSmall ? 44 : 70)
  const sideInset = isSmall ? vw * 0.16 : vw * 0.13
  return { cardWidth, spacing, cardHeight, bannerHeight, sideInset, viewportWidth: vw }
}

export default function EllipticGallery({ onActiveCardChange, onLeave }) {
  const [layout, setLayout] = useState(getLayout)
  const [index, setIndex] = useState(COUNT * CENTER_ROUND)
  const [isJumping, setIsJumping] = useState(false)
  const rootRef = useRef(null)
  const itemStride = layout.cardWidth + layout.spacing
  const activeItem = PROJECT_ITEMS[wrapIndex(index)]

  const trackItems = useMemo(
    () =>
      Array.from({ length: COUNT * VISIBLE_ROUNDS }, (_, itemIndex) => ({
        ...PROJECT_ITEMS[wrapIndex(itemIndex)],
        trackKey: `${itemIndex}-${PROJECT_ITEMS[wrapIndex(itemIndex)].label}`,
        sourceIndex: wrapIndex(itemIndex),
      })),
    [],
  )

  useEffect(() => {
    const onResize = () => setLayout(getLayout())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    onActiveCardChange?.(activeItem)
  }, [activeItem, onActiveCardChange])

  useEffect(() => {
    const normalizeTo =
      index >= COUNT * (VISIBLE_ROUNDS - 1)
        ? index - COUNT * (VISIBLE_ROUNDS - 2)
        : index < COUNT
          ? index + COUNT * (VISIBLE_ROUNDS - 2)
          : null

    if (normalizeTo === null) return undefined

    const id = window.setTimeout(() => {
      setIsJumping(true)
      setIndex(normalizeTo)
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setIsJumping(false))
      })
    }, 460)
    return () => window.clearTimeout(id)
  }, [index])

  const moveBy = useCallback((amount) => {
    setIndex((prev) => prev + amount)
  }, [])

  const handleWheel = useCallback(
    (event) => {
      event.preventDefault()
      moveBy(event.deltaY > 0 || event.deltaX > 0 ? 1 : -1)
    },
    [moveBy],
  )

  useEffect(() => {
    const node = rootRef.current
    if (!node) return undefined

    let touchStartX = 0
    let touchStartY = 0
    const onTouchStart = (event) => {
      touchStartX = event.touches[0].clientX
      touchStartY = event.touches[0].clientY
    }
    const onTouchMove = (event) => {
      const x = event.touches[0].clientX
      const y = event.touches[0].clientY
      const deltaX = touchStartX - x
      const deltaY = touchStartY - y
      const delta = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY
      if (Math.abs(delta) >= 42) {
        moveBy(delta > 0 ? 1 : -1)
        touchStartX = x
        touchStartY = y
      }
    }

    node.addEventListener('wheel', handleWheel, { passive: false })
    node.addEventListener('touchstart', onTouchStart, { passive: true })
    node.addEventListener('touchmove', onTouchMove, { passive: true })
    return () => {
      node.removeEventListener('wheel', handleWheel)
      node.removeEventListener('touchstart', onTouchStart)
      node.removeEventListener('touchmove', onTouchMove)
    }
  }, [handleWheel, moveBy])

  const handleCardClick = (item, itemIndex) => {
    if (itemIndex !== index) {
      setIndex(itemIndex)
      return
    }
    onLeave?.()
    goToPage(null, item.href)
  }

  const trackX = layout.sideInset - index * itemStride

  return (
    <div ref={rootRef} className="elliptic-gallery-root relative w-full select-none overflow-hidden py-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.16) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.16) 1px, transparent 1px)',
          backgroundSize: '34px 34px',
          maskImage: 'linear-gradient(90deg, transparent, black 12%, black 88%, transparent)',
          WebkitMaskImage: 'linear-gradient(90deg, transparent, black 12%, black 88%, transparent)',
        }}
      />

      <div
        className="relative mx-auto w-screen overflow-hidden"
        style={{
          height: layout.bannerHeight,
          maskImage: MASK_IMAGE,
          WebkitMaskImage: MASK_IMAGE,
          maskRepeat: 'no-repeat',
          WebkitMaskRepeat: 'no-repeat',
          maskPosition: 'center',
          WebkitMaskPosition: 'center',
          maskSize: '100% 100%',
          WebkitMaskSize: '100% 100%',
        }}
      >
        <motion.div
          className="absolute left-0 top-0 flex h-full items-center"
          style={{ gap: layout.spacing }}
          animate={{ x: trackX }}
          transition={isJumping ? { duration: 0 } : MOVE_TRANSITION}
        >
          {trackItems.map((item, itemIndex) => {
            const distance = itemIndex - index
            const isActive = distance === 0
            const bend = Math.max(-2, Math.min(2, distance))
            const rotateY = bend * -7
            const translateY = Math.abs(bend) * 11
            return (
              <button
                key={item.trackKey}
                type="button"
                aria-label={item.label}
                className="group relative shrink-0 overflow-hidden bg-black text-white shadow-[0_28px_70px_rgba(0,0,0,.42)] outline-none transition-[filter,opacity] duration-300 hover:brightness-110 focus-visible:ring-2 focus-visible:ring-white/70"
                style={{
                  width: layout.cardWidth,
                  height: layout.cardHeight,
                  transform: `perspective(1200px) rotateY(${rotateY}deg) translateY(${translateY}px)`,
                  transformOrigin: distance < 0 ? 'right center' : distance > 0 ? 'left center' : 'center center',
                  opacity: Math.abs(distance) > 3 ? 0.45 : 1,
                }}
                onClick={() => handleCardClick(item, itemIndex)}
              >
                <img src={item.img} alt={item.label} draggable={false} className="h-full w-full object-cover object-center" />
                <span className="absolute inset-0 bg-black/35 transition duration-300 group-hover:bg-black/20" />
                <span className="absolute inset-x-4 top-4 flex items-center justify-between text-[10px] tracking-[0.22em] text-white/70 uppercase opacity-0 transition duration-300 group-hover:opacity-100 md:opacity-100">
                  <span>{String(item.sourceIndex + 1).padStart(2, '0')}</span>
                  <span>{isActive ? 'Enter' : 'Focus'}</span>
                </span>
                <span className="absolute inset-x-5 top-1/2 -translate-y-1/2 text-center font-serif text-[clamp(1.05rem,2vw,1.55rem)] font-semibold leading-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,.7)]">
                  {item.label === 'More' ? 'See more' : item.label}
                </span>
              </button>
            )
          })}
        </motion.div>
      </div>

      <div className="relative z-10 mt-7 flex justify-center gap-4">
        <button
          type="button"
          aria-label="Previous project"
          className="grid h-14 w-14 place-items-center rounded-full border border-white/30 bg-white/95 text-2xl text-black shadow-[0_14px_35px_rgba(0,0,0,.24)] transition hover:scale-110 hover:bg-black hover:text-white"
          onClick={() => moveBy(-1)}
        >
          ←
        </button>
        <button
          type="button"
          aria-label="Next project"
          className="grid h-14 w-14 place-items-center rounded-full border border-white/30 bg-white/95 text-2xl text-black shadow-[0_14px_35px_rgba(0,0,0,.24)] transition hover:scale-110 hover:bg-black hover:text-white"
          onClick={() => moveBy(1)}
        >
          →
        </button>
      </div>
    </div>
  )
}
