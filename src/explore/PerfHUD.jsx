import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { create } from 'zustand'

/* Tiny dev-only performance HUD (FPS, draw calls, triangles) for tuning the 3D
 * world on simulated weak hardware. Deliberately built from deps we already
 * have (R3F + zustand) instead of r3f-perf, which made Vite pull a second copy
 * of three.js and broke the main renderer.
 *
 * Two parts:
 *   <PerfSampler/> — lives INSIDE the <Canvas>; reads the renderer each frame.
 *   <PerfHUD/>     — a plain DOM overlay OUTSIDE the canvas; reads the store.
 * Both are gated to import.meta.env.DEV by ExplorePage, so nothing ships to
 * production. */

const usePerfStore = create(() => ({ fps: 0, calls: 0, tris: 0 }))

// Sample FPS + draw calls/triangles, pushing a throttled snapshot (~5×/sec) to
// the store. gl.info.render reflects the previous frame's draw — one frame stale
// is fine for a readout. Renders nothing in the 3D scene.
export function PerfSampler() {
  const gl = useThree((s) => s.gl)
  const frames = useRef(0)
  const acc = useRef(0)
  useFrame((_, delta) => {
    frames.current++
    acc.current += delta
    if (acc.current >= 0.2) {
      usePerfStore.setState({
        fps: Math.round(frames.current / acc.current),
        calls: gl.info.render.calls,
        tris: gl.info.render.triangles,
      })
      frames.current = 0
      acc.current = 0
    }
  })
  return null
}

export default function PerfHUD() {
  const { fps, calls, tris } = usePerfStore()
  const color = fps >= 50 ? '#5bd75b' : fps >= 30 ? '#e6c93e' : '#e0552f'
  return (
    <div
      style={{
        position: 'fixed',
        top: 8,
        left: 8,
        zIndex: 50,
        font: '12px/1.45 ui-monospace, SFMono-Regular, Menlo, monospace',
        background: 'rgba(0,0,0,0.6)',
        color: '#fff',
        padding: '6px 9px',
        borderRadius: 6,
        pointerEvents: 'none',
        whiteSpace: 'pre',
      }}
    >
      <span style={{ color, fontWeight: 700 }}>{fps} FPS</span>
      {`\n${calls} draws\n${tris.toLocaleString()} tris`}
    </div>
  )
}
