import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { PROJECT_ITEMS } from '../lib/routes'
import { goToPage } from '../lib/navigation'

const COUNT = PROJECT_ITEMS.length
const SLOT_RANGE = 14
const OFFSETS = Array.from({ length: SLOT_RANGE * 2 + 1 }, (_, index) => index - SLOT_RANGE)
const CAROUSEL_TRANSITION = { type: 'spring', stiffness: 120, damping: 20, mass: 0.6 }

function wrapIndex(index) {
  return ((index % COUNT) + COUNT) % COUNT
}

function getLayout() {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1280
  const cardWidth = Math.min(Math.max(vw * 0.22, 200), 320)
  const cardHeight = cardWidth * (9 / 16)
  const radiusX = Math.max(vw * 0.62, 520)
  const radiusZ = Math.max(vw * 0.28, 340)
  const angleStep = cardWidth / radiusX
  return { cardWidth, cardHeight, radiusX, radiusZ, angleStep }
}

function snapRotation(rotation, angleStep) {
  const slot = Math.round(-rotation / angleStep)
  return -slot * angleStep
}

function metricsForAngle(angle, layout) {
  const { radiusX, radiusZ } = layout
  const x = Math.sin(angle) * radiusX
  const z = Math.cos(angle) * radiusZ - radiusZ
  const rotateY = (-angle * 180) / Math.PI
  const depth = Math.cos(angle)
  const frontness = Math.max(0, (depth + 1) / 2)
  const opacity = 0.28 + frontness * 0.72
  const blur = depth < 0.55 ? (0.55 - depth) * 14 : 0
  const scale = 0.78 + frontness * 0.22
  const zIndex = Math.round(frontness * 1000)

  return { x, z, rotateY, opacity, blur, scale, zIndex, depth }
}

export default function EllipticGallery({ onActiveCardChange, onLeave, showLabels = false }) {
  const [layout, setLayout] = useState(getLayout)
  const [rotation, setRotation] = useState(0)
  const [activeIndex, setActiveIndex] = useState(0)
  const rootRef = useRef(null)

  useEffect(() => {
    const onResize = () => {
      const nextLayout = getLayout()
      setLayout(nextLayout)
      setRotation((prev) => snapRotation(prev, nextLayout.angleStep))
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const centerSlot = useMemo(() => Math.round(-rotation / layout.angleStep), [rotation, layout.angleStep])

  useEffect(() => {
    const next = wrapIndex(centerSlot)
    setActiveIndex((prev) => {
      if (prev !== next) onActiveCardChange?.(PROJECT_ITEMS[next])
      return next
    })
  }, [centerSlot, onActiveCardChange])

  // 滚轮/触摸松手后自动吸附到最近的格子
  const SNAP_DELAY_MS = 160
  const WHEEL_SENSITIVITY = 0.0026
  const TOUCH_SENSITIVITY = 0.004
  const snapTimer = useRef(null)

  const snapNow = useCallback(() => {
    setRotation((prev) => snapRotation(prev, layout.angleStep))
  }, [layout.angleStep])

  const scheduleSnap = useCallback(() => {
    if (snapTimer.current) clearTimeout(snapTimer.current)
    snapTimer.current = window.setTimeout(snapNow, SNAP_DELAY_MS)
  }, [snapNow])

  // 连续累加旋转角度，由 framer-motion 的弹簧过渡负责丝滑跟随，停止后自动吸附
  const nudge = useCallback(
    (delta) => {
      setRotation((prev) => prev + delta)
      scheduleSnap()
    },
    [scheduleSnap],
  )

  const handleWheel = useCallback(
    (event) => {
      event.preventDefault()
      nudge(event.deltaY * WHEEL_SENSITIVITY)
    },
    [nudge],
  )

  useEffect(() => {
    const node = rootRef.current
    if (!node) return undefined

    // 手机竖直滑动：累加位移连续转动，松手后吸附
    let lastY = 0
    let touchAccum = 0
    const onTouchStart = (event) => {
      lastY = event.touches[0].clientY
      touchAccum = 0
    }
    const onTouchMove = (event) => {
      const y = event.touches[0].clientY
      const delta = lastY - y
      lastY = y
      touchAccum += delta
      if (Math.abs(touchAccum) >= 8) {
        nudge(touchAccum * TOUCH_SENSITIVITY)
        touchAccum = 0
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
  }, [handleWheel, nudge])

  useEffect(
    () => () => {
      if (snapTimer.current) clearTimeout(snapTimer.current)
    },
    [],
  )

  const slots = OFFSETS

  const handleCardClick = (item, slotIndex, depth) => {
    const angle = slotIndex * layout.angleStep + rotation
    const isFront = Math.abs(angle) < layout.angleStep * 0.6
    if (!isFront || depth < 0.65) return
    onLeave?.()
    goToPage(null, item.href)
  }

  const { cardWidth, cardHeight, angleStep, radiusX } = layout
  const galleryHeight = cardHeight + 80
  const perspective = Math.max(radiusX * 1.45, 760)

  return (
    <div
      ref={rootRef}
      className="elliptic-gallery-root relative w-full max-w-full touch-none select-none"
      style={{ height: galleryHeight }}
    >
      <div
        className="elliptic-gallery-stage absolute inset-0 flex items-center justify-center"
        style={{
          perspective,
          perspectiveOrigin: '50% 50%',
        }}
      >
        <div className="elliptic-gallery relative h-full w-full" style={{ transformStyle: 'preserve-3d' }}>
          {slots.map((offset) => {
            const slotIndex = centerSlot + offset
            const item = PROJECT_ITEMS[wrapIndex(slotIndex)]
            const angle = slotIndex * angleStep + rotation
            const m = metricsForAngle(angle, layout)
            const isClickable = Math.abs(angle) < angleStep * 0.6 && m.depth > 0.65

            return (
              <motion.button
                key={offset}
                type="button"
                aria-label={item.label}
                className="elliptic-card absolute left-1/2 top-1/2 overflow-hidden border-0 bg-[#0a0a10] p-0 shadow-[0_24px_60px_rgba(0,0,0,0.55)]"
                style={{
                  width: cardWidth,
                  height: cardHeight,
                  transformStyle: 'preserve-3d',
                  backfaceVisibility: 'hidden',
                  zIndex: m.zIndex,
                  filter: m.blur > 0.2 ? `blur(${m.blur}px)` : 'none',
                  pointerEvents: isClickable ? 'auto' : 'none',
                  cursor: isClickable ? 'pointer' : 'default',
                }}
                animate={{
                  x: m.x - cardWidth / 2,
                  y: -cardHeight / 2,
                  z: m.z,
                  rotateY: m.rotateY,
                  scale: m.scale,
                  opacity: m.opacity,
                }}
                transition={CAROUSEL_TRANSITION}
                onClick={() => handleCardClick(item, slotIndex, m.depth)}
              >
                <img
                  src={item.img}
                  alt={item.label}
                  className="h-full w-full object-cover object-center"
                  draggable={false}
                />
                {showLabels && (
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-2 text-left text-xs text-white/85">
                    {item.label}
                  </span>
                )}
              </motion.button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
