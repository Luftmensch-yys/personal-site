import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { PROJECT_ITEMS } from '../lib/routes'
import { goToPage } from '../lib/navigation'

const COUNT = PROJECT_ITEMS.length
const SLOT_RANGE = 14
const OFFSETS = Array.from({ length: SLOT_RANGE * 2 + 1 }, (_, index) => index - SLOT_RANGE)

/* ── 惯性物理参数 ── */
const FRICTION = 0.955          /* 每帧速度衰减系数 (0~1，越大越滑) */
const WHEEL_ACCEL = 0.0018      /* 滚轮单位 deltaY → 角加速度 */
const TOUCH_ACCEL = 0.0028      /* 触摸单位 px → 角加速度 */
const SNAP_VELOCITY_THRESH = 0.0008 /* 低于此速度开始吸附 */
const SNAP_SPRING = { type: 'spring', stiffness: 180, damping: 24, mass: 0.5 }

/* 卡片位移动画（跟随旋转时用 tween 保持顺滑） */
const CARD_TWEEN = { type: 'tween', duration: 0.12, ease: 'linear' }

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
  const z = Math.cos(angle) - 1 * radiusZ
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

  /* ── 核心状态：用 motionValue 避免每次滚轮都触发 React 重渲染 ── */
  const rotationMotion = useMotionValue(0)
  const [activeIndex, setActiveIndex] = useState(0)
  const rootRef = useRef(null)

  /* ── 惯性物理引擎 ── */
  const velocityRef = useRef(0)
  const isUserActiveRef = useRef(false)   /* 用户正在交互（滚轮/触摸） */
  const isSnappingRef = useRef(false)     /* 正在执行吸附动画 */
  const rafIdRef = useRef(null)
  const lastTimeRef = useRef(0)

  useEffect(() => {
    const onResize = () => {
      const nextLayout = getLayout()
      setLayout(nextLayout)
      rotationMotion.set(snapRotation(rotationMotion.get(), nextLayout.angleStep))
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  /* 从 motionValue 派生 centerSlot（用于渲染） */
  const centerSlot = useMemo(() => {
    // 这里用 state 缓存，在 rAF 里定期同步更新
    return Math.round(-rotationMotion.get() / layout.angleStep)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout.angleStep])

  /* 同步 activeIndex */
  useEffect(() => {
    const next = wrapIndex(centerSlot)
    setActiveIndex((prev) => {
      if (prev !== next) onActiveCardChange?.(PROJECT_ITEMS[next])
      return next
    })
  }, [centerSlot, onActiveCardChange])

  /* ── 物理引擎：rAF 主循环 ── */
  const tick = useCallback(() => {
    if (isSnappingRef.current) return

    const now = performance.now()
    const dt = lastTimeRef.current ? (now - lastTimeRef.current) / 16.67 : 1  // 归一化到 ~60fps
    lastTimeRef.current = now

    if (!isUserActiveRef.current && Math.abs(velocityRef.current) < SNAP_VELOCITY_THRESH) {
      /* 速度足够低 → 吸附到最近格子 */
      const current = rotationMotion.get()
      const target = snapRotation(current, layout.angleStep)
      isSnappingRef.current = true
      animate(rotationMotion, target, SNAP_SPRING).then(() => {
        velocityRef.current = 0
        isSnappingRef.current = false
        /* 吸附完成后刷新 activeIndex */
        const slot = Math.round(-target / layout.angleStep)
        const idx = wrapIndex(slot)
        setActiveIndex((prev) => {
          if (prev !== idx) onActiveCardChange?.(PROJECT_ITEMS[idx])
          return idx
        })
      })
      rafIdRef.current = null
      return
    }

    /* 正常物理步进：位置 += 速度 × dt，速度 *= 摩擦系数 */
    velocityRef.current *= FRICTION
    rotationMotion.set(rotationMotion.get() + velocityRef.current * dt)

    rafIdRef.current = requestAnimationFrame(tick)
  }, [layout.angleStep, rotationMotion, onActiveCardChange])

  /* 用户交互时注入加速度（不直接设位置） */
  const applyImpulse = useCallback((impulse) => {
    velocityRef.current += impulse
    isUserActiveRef.current = true

    /* 如果引擎没在跑就启动它 */
    if (!rafIdRef.current && !isSnappingRef.current) {
      lastTimeRef.current = performance.now()
      rafIdRef.current = requestAnimationFrame(tick)
    }
  }, [tick])

  /* 标记"用户停止交互"——等一小段时间后让引擎自动判断吸附 */
  const idleTimerRef = useRef(null)
  const markIdle = useCallback(() => {
    isUserActiveRef.current = false
  }, [])

  /* ── 滚轮事件 ── */
  const handleWheel = useCallback(
    (event) => {
      event.preventDefault()
      applyImpulse(event.deltaY * WHEEL_ACCEL)

      /* 重置空闲计时器 */
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
      idleTimerRef.current = setTimeout(markIdle, 80)
    },
    [applyImpulse, markIdle],
  )

  /* ── 触摸事件（手机滑动）── 也走惯性引擎 ── */
  const touchHandlers = useMemo(() => {
    let lastY = 0
    let lastT = 0
    const onTouchStart = (event) => {
      lastY = event.touches[0].clientY
      lastT = performance.now()
      /* 触碰瞬间停止当前运动，准备重新开始 */
      velocityRef.current *= 0.3
      isUserActiveRef.current = true
    }
    const onTouchMove = (event) => {
      const y = event.touches[0].clientY
      const t = performance.now()
      const dy = lastY - y
      const dt = t - lastT || 16
      lastY = y
      lastT = t

      /* 瞬时速度 → 加速度 */
      applyImpulse(dy * TOUCH_ACCEL)

      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
      idleTimerRef.current = setTimeout(markIdle, 80)
    }
    const onTouchEnd = () => {
      /* 保持最后速度继续滑行（不归零），让摩擦力自然减速 */
      markIdle()
    }
    return { onTouchStart, onTouchMove, onTouchEnd }
  }, [applyImpulse, markIdle])

  /* 绑定事件 */
  useEffect(() => {
    const node = rootRef.current
    if (!node) return undefined

    node.addEventListener('wheel', handleWheel, { passive: false })
    node.addEventListener('touchstart', touchHandlers.onTouchStart, { passive: true })
    node.addEventListener('touchmove', touchHandlers.onTouchMove, { passive: true })
    node.addEventListener('touchend', touchHandlers.onTouchEnd, { passive: true })

    return () => {
      node.removeEventListener('wheel', handleWheel)
      node.removeEventListener('touchstart', touchHandlers.onTouchStart)
      node.removeEventListener('touchmove', touchHandlers.onTouchMove)
      node.removeEventListener('touchend', touchHandlers.onTouchEnd)
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    }
  }, [handleWheel, touchHandlers])

  const slots = OFFSETS

  const handleCardClick = (item, slotIndex, depth) => {
    /* 用 motionValue 的当前值计算角度 */
    const currentRotation = rotationMotion.get()
    const angle = slotIndex * layout.angleStep + currentRotation
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
            /* 从 motionValue 派生每张卡片的角度 → 位置 */
            const slotAngle = useTransform(rotationMotion,
              (r) => (centerSlot + offset) * angleStep + r
            )
            const xMotion = useTransform(slotAngle, (a) => metricsForAngle(a, layout).x - cardWidth / 2)
            const yMotion = useTransform(slotAngle, () => -cardHeight / 2)
            const zMotion = useTransform(slotAngle, (a) => metricsForAngle(a, layout).z)
            const rotateYMotion = useTransform(slotAngle, (a) => metricsForAngle(a, layout).rotateY)
            const scaleMotion = useTransform(slotAngle, (a) => metricsForAngle(a, layout).scale)
            const opacityMotion = useTransform(slotAngle, (a) => metricsForAngle(a, layout).opacity)

            const slotIndex = centerSlot + offset
            const item = PROJECT_ITEMS[wrapIndex(slotIndex)]
            const m = metricsForAngle((centerSlot + offset) * angleStep + rotationMotion.get(), layout)
            const isClickable = Math.abs(m.rotateY * Math.PI / 180) < angleStep * 0.6 && m.depth > 0.65

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
                  x: xMotion,
                  y: yMotion,
                  z: zMotion,
                  rotateY: rotateYMotion,
                  scale: scaleMotion,
                  opacity: opacityMotion,
                }}
                transition={CARD_TWEEN}
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
