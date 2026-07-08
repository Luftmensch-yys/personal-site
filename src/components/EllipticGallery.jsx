import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { PROJECT_ITEMS } from '../lib/routes'
import { goToPage } from '../lib/navigation'

const COUNT = PROJECT_ITEMS.length
const SLOT_RANGE = 14
const OFFSETS = Array.from({ length: SLOT_RANGE * 2 + 1 }, (_, index) => index - SLOT_RANGE)
const CAROUSEL_TRANSITION = { type: 'tween', duration: 0.5, ease: [0.22, 1, 0.36, 1] }
const WHEEL_COOLDOWN_MS = 480

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
  const wheelLock = useRef(false)
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

  const rotateStep = useCallback(
    (dir) => {
      if (wheelLock.current) return

      wheelLock.current = true
      setRotation((prev) => {
        const currentSlot = Math.round(-prev / layout.angleStep)
        const nextSlot = currentSlot - dir
        return -nextSlot * layout.angleStep
      })
      window.setTimeout(() => {
        wheelLock.current = false
      }, WHEEL_COOLDOWN_MS)
    },
    [layout.angleStep],
  )

  const handleWheel = useCallback(
    (event) => {
      event.preventDefault()
      const dir = event.deltaY > 0 ? 1 : -1
      rotateStep(dir)
    },
    [rotateStep],
  )

  useEffect(() => {
    const node = rootRef.current
    if (!node) return undefined

    // 手机竖直滑动切换环形导航（替代滚轮）
    let touchStartY = 0
    const onTouchStart = (event) => {
      touchStartY = event.touches[0].clientY
    }
    const onTouchMove = (event) => {
      const y = event.touches[0].clientY
      const delta = touchStartY - y
      if (Math.abs(delta) >= 40) {
        rotateStep(delta > 0 ? 1 : -1)
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
  }, [handleWheel, rotateStep])

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
