import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import SiteNav from './components/SiteNav'
import PageWipe from './components/PageWipe'
import useEnterTransition from './hooks/useEnterTransition'
import { ROUTES } from './lib/routes'

const MODEL_URL = `${import.meta.env.BASE_URL}modeling/cat.gltf`

export default function ModelingApp() {
  const { entering, enterDone } = useEnterTransition()
  const [leaving, setLeaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  const canvasWrapRef = useRef(null)
  const stageRef = useRef(null)
  const spinRef = useRef(0) // 目标旋转（由滚轮累积）
  const inStageRef = useRef(false) // 是否在小猫展示区（第二段）内
  const mouseRef = useRef({ x: 0, y: 0 }) // 鼠标归一化坐标 (-1..1)
  const mouseLightRef = useRef(null) // 跟随鼠标的光源

  // ---- Three.js 初始化 ----
  useEffect(() => {
    const wrap = canvasWrapRef.current
    if (!wrap) return undefined

    let w = wrap.clientWidth || window.innerWidth * 0.5
    let h = wrap.clientHeight || window.innerHeight

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100)
    camera.position.set(0, 0, 5.5)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(w, h)
    renderer.setClearColor(0x000000, 0)
    wrap.appendChild(renderer.domElement)

    // 灯光：偏紫蓝的环境 + 暖白主光，和整站氛围一致
    scene.add(new THREE.AmbientLight(0xb8c4ff, 0.55))
    const key = new THREE.DirectionalLight(0xffffff, 1.15)
    key.position.set(3, 4, 5)
    scene.add(key)
    const rim = new THREE.DirectionalLight(0x7b6cff, 1.1)
    rim.position.set(-4, 2, -3)
    scene.add(rim)
    const fill = new THREE.DirectionalLight(0x4fd0ff, 0.5)
    fill.position.set(2, -3, 2)
    scene.add(fill)

    // 跟随鼠标的光源：像一个手电筒照亮小猫
    const mouseLight = new THREE.PointLight(0xfff4e6, 3.0, 20, 1.5)
    mouseLight.position.set(2.5, 1.5, 4.2)
    scene.add(mouseLight)
    mouseLightRef.current = mouseLight

    const pivot = new THREE.Group() // 控制位置与缩放
    scene.add(pivot)
    const modelGroup = new THREE.Group() // 控制旋转
    pivot.add(modelGroup)

    const loader = new GLTFLoader()
    let disposed = false
    loader.load(
      MODEL_URL,
      (gltf) => {
        if (disposed) return
        const model = gltf.scene
        // 居中并归一化到 ~3 单位，让它能占满右半屏
        const box = new THREE.Box3().setFromObject(model)
        const size = box.getSize(new THREE.Vector3())
        const center = box.getCenter(new THREE.Vector3())
        const maxDim = Math.max(size.x, size.y, size.z) || 1
        const s = 3.0 / maxDim
        model.scale.setScalar(s)
        model.position.set(-center.x * s, -center.y * s - 0.6, -center.z * s)
        // 若模型没有材质，补一个温和的标准材质
        model.traverse((o) => {
          if (o.isMesh && (!o.material || (Array.isArray(o.material) && o.material.length === 0))) {
            o.material = new THREE.MeshStandardMaterial({
              color: 0xe9e9f2,
              roughness: 0.45,
              metalness: 0.15,
            })
          }
        })
        modelGroup.add(model)
        setLoading(false)
      },
      undefined,
      (err) => {
        console.error('model load error', err)
        setLoadError(true)
      },
    )

    const onResize = () => {
      w = wrap.clientWidth || window.innerWidth * 0.5
      h = wrap.clientHeight || window.innerHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    // ---- 拖拽旋转（鼠标在 canvas 上按住拖拽直接转动小猫）----
    let dragging = false
    let lastDragX = 0
    const onPointerDown = (e) => {
      dragging = true
      lastDragX = e.clientX
    }
    const onPointerMove = (e) => {
      if (!dragging) return
      const dx = e.clientX - lastDragX
      if (inStageRef.current) {
        spinRef.current -= dx * 0.008
      }
      lastDragX = e.clientX
    }
    const onPointerUp = () => { dragging = false }
    wrap.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)

    // 小猫跟随第二段自然滚动，不缩放远近
    pivot.scale.setScalar(1.0)
    pivot.position.z = 0.5
    const BASE_YAW = 0 // 正面朝向偏移，若小猫正面不正可微调

    let raf
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const stage = stageRef.current
      const vh = window.innerHeight
      let inStage = false
      let enterProgress = 1 // 1 = 已完全进入，0 = 刚触顶
      if (stage) {
        const rect = stage.getBoundingClientRect()
        // stage 与视口有重叠才算「在第二段内」
        inStage = rect.top < vh && rect.bottom > 0
        // 从底部刚进入视口时（stage 顶部从 vh 降到 vh*0.55），progress 从 0 → 1
        const enterStart = vh
        const enterEnd = vh * 0.55
        if (rect.top >= enterEnd) {
          enterProgress = Math.max(0, Math.min(1, 1 - (rect.top - enterEnd) / (enterStart - enterEnd)))
        }
      }
      inStageRef.current = inStage

      // 进入过程中：从背面（180°）转到正面（0°）；离开/超出：回正固定
      if (!inStage) {
        spinRef.current += (0 - spinRef.current) * 0.06
      }
      const targetSpin = spinRef.current
      const entranceRotation = (1 - enterProgress) * Math.PI
      const targetRotation = BASE_YAW + targetSpin + entranceRotation
      modelGroup.rotation.y += (targetRotation - modelGroup.rotation.y) * 0.1

      // 鼠标光源跟随：鼠标在视口左侧时光从左来，右侧时光从右来
      const mouseLight = mouseLightRef.current
      if (mouseLight) {
        const targetX = mouseRef.current.x * 5.5
        const targetY = mouseRef.current.y * 3.5
        mouseLight.position.x += (targetX - mouseLight.position.x) * 0.08
        mouseLight.position.y += (targetY - mouseLight.position.y) * 0.08
        mouseLight.position.z = 3.8 + Math.abs(mouseRef.current.x) * 1.2
      }

      renderer.render(scene, camera)
    }
    tick()

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      renderer.dispose()
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement)
      }
    }
  }, [])

  // ---- 滚轮累积旋转（只在第二段内生效，不拦截页面滚动）----
  useEffect(() => {
    const onWheel = (e) => {
      if (inStageRef.current) {
        spinRef.current += e.deltaY * 0.003
      }
    }
    const onMouseMove = (e) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1
    }
    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('mousemove', onMouseMove, { passive: true })
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('mousemove', onMouseMove)
    }
  }, [])

  const shellClass = [
    'page-shell modeling-shell relative min-h-screen overflow-x-hidden bg-[#06060c] font-geist text-white',
    leaving ? 'is-leaving' : '',
    entering ? 'is-entering' : '',
    enterDone ? 'is-entering-done' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <main className={shellClass}>
      <style>{`
        .modeling-canvas-wrap{position:sticky;top:50%;transform:translateY(-50%);width:50vw;height:80vh;z-index:5;flex-shrink:0;cursor:grab}
        .modeling-canvas-wrap:active{cursor:grabbing}
        .modeling-hero{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:7rem 1.5rem 4rem}
        .modeling-kicker{font-size:.72rem;letter-spacing:.32em;text-transform:uppercase;color:rgba(255,255,255,.42);margin-bottom:1rem}
        .modeling-title{font-size:clamp(2.2rem,6vw,4.6rem);font-weight:500;line-height:1.08;letter-spacing:-.02em;color:#fff;margin-bottom:1.5rem}
        .modeling-desc{max-width:34rem;font-size:clamp(.95rem,1.4vw,1.15rem);line-height:1.85;color:rgba(255,255,255,.55)}
        .modeling-stage{position:relative;min-height:180vh;display:flex;align-items:flex-start}
        .modeling-cat-text{position:sticky;top:50%;transform:translateY(-50%);max-width:25rem;padding:0 1.5rem;margin-left:8vw;flex-shrink:0}
        .modeling-cat-label{font-size:.72rem;letter-spacing:.28em;text-transform:uppercase;color:rgba(255,255,255,.4);margin-bottom:.9rem}
        .modeling-cat-title{font-size:clamp(1.6rem,3vw,2.6rem);font-weight:500;color:#fff;margin-bottom:1.2rem;line-height:1.2}
        .modeling-cat-body{font-size:clamp(.92rem,1.2vw,1.05rem);line-height:1.95;color:rgba(255,255,255,.5)}
        .modeling-outro{min-height:70vh;display:flex;align-items:center;justify-content:flex-start;padding-left:max(8vw,2rem);color:rgba(255,255,255,.28);font-size:.9rem;letter-spacing:.1em}
        .modeling-loading{position:absolute;right:0;top:50%;transform:translateY(-50%);width:50vw;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.4);font-size:.8rem;letter-spacing:.2em;z-index:6}
        @media (max-width:900px){
          .modeling-canvas-wrap{width:100vw;position:relative;top:auto;transform:none;height:60vh;order:-1}
          .modeling-stage{flex-direction:column}
          .modeling-cat-text{margin-left:0;max-width:90%}
          .modeling-loading{width:100vw}
        }
      `}</style>

      {/* 背景光晕 */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_72%_42%,rgba(123,108,255,0.10),transparent_60%),linear-gradient(180deg,#06060c,#0a0a14)]" />

      <SiteNav active="project" onNavigate={() => setLeaving(true)} />
      <PageWipe />

      <div className="relative z-10">
        {/* 顶部：大标题 + 居中描述 —— 不出现小猫 */}
        <section className="modeling-hero page-block">
          <p className="modeling-kicker">3D Modeling / volume &amp; light</p>
          <h1 className="modeling-title">
            把想象捏成
            <br />
            可以转动的形状。
          </h1>
          <p className="modeling-desc">
            这里收藏我用三维软件做的小东西——多边形、光影，和一点点耐心。
            往下滚动进入小猫的展示区，滚动鼠标让它慢慢转身。
          </p>
        </section>

        {/* 小猫展示区：文字偏左，3D 画布偏右，均 sticky 随 section 滚动 */}
        <section ref={stageRef} className="modeling-stage page-block">
          <div className="modeling-cat-text">
            <p className="modeling-cat-label">No.01 · 小猫</p>
            <h2 className="modeling-cat-title">一只会转身的小猫</h2>
            <p className="modeling-cat-body">
            最初只是想捏一个安静的轮廓，后来它有了耳朵、有了弧度，
            也有了在屏幕里慢慢转身的习惯。滚动鼠标，它会顺着你的方向旋转；
            离开这里，它便回正停驻。
            </p>
          </div>
          <div ref={canvasWrapRef} className="modeling-canvas-wrap" aria-hidden="true" style={{ marginLeft: 'auto' }} />
          {loading && !loadError && <div className="modeling-loading">LOADING MODEL…</div>}
          {loadError && <div className="modeling-loading">模型加载失败</div>}
        </section>

        {/* 结尾留白 */}
        <section className="modeling-outro page-block">
          <p>更多作品正在生长中 · scroll back to play</p>
        </section>
      </div>
    </main>
  )
}
