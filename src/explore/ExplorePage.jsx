import { Suspense, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Loader } from '@react-three/drei'
import { Link } from 'react-router-dom'
import Scene from './Scene'
import TouchControls from './TouchControls'
import InteractionOverlay from './InteractionOverlay'
import { useExplore } from './useExplore'
import { NPC } from './interactables'
import './explore.css'

/* ------------------------------------------------------------------
 * STEP 1 SPIKE — page shell
 * Full-screen fixed layer that sits ABOVE the normal site chrome.
 * Responsibilities: WebGL capability check + graceful fallback, a
 * clear "how to move" intro card, the mobile touch joystick (must live
 * OUTSIDE the Canvas), a loading screen, and an exit back to the site.
 * ------------------------------------------------------------------ */

// Touch devices get the on-screen joystick; desktop gets keyboard.
const isTouch =
  typeof window !== 'undefined' &&
  window.matchMedia('(pointer: coarse)').matches

function hasWebGL() {
  try {
    const canvas = document.createElement('canvas')
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    )
  } catch {
    return false
  }
}

export default function ExplorePage() {
  const [supported] = useState(hasWebGL)
  const [started, setStarted] = useState(false)
  // Only full-screen panels hide the joystick — the NPC speech bubble doesn't,
  // so Max talking never interrupts moving around (esp. the auto-greet on load).
  const activeType = useExplore((s) => s.active?.type)
  const panelOpen = activeType != null && activeType !== 'npc'

  // Let the intro card be dismissed with Enter (in addition to the button).
  useEffect(() => {
    if (started) return
    const onKey = (e) => {
      if (e.key === 'Enter') setStarted(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [started])

  // Auto-greet: open Max's welcome dialogue once, as soon as you enter the world.
  useEffect(() => {
    if (started) useExplore.getState().open(NPC)
  }, [started])

  // No WebGL → never show a blank canvas; send them back to the real site.
  if (!supported) {
    return (
      <div className="explore-fallback">
        <h1>This device can&apos;t run the 3D world</h1>
        <p>
          Your browser or device doesn&apos;t support WebGL. No worries —
          everything is available on the classic site.
        </p>
        <Link to="/" className="explore-fallback__link">
          ← Back to maxbassettcreative.com
        </Link>
      </div>
    )
  }

  return (
    <div className="explore-root">
      {/* Mobile joystick must render outside the R3F Canvas. Hidden while a
          content panel is open so it doesn't sit on top of the panel. */}
      {isTouch && !panelOpen && <TouchControls />}

      {/* Proximity prompt / interact button / content panel */}
      <InteractionOverlay isTouch={isTouch} />

      <Canvas shadows camera={{ position: [0, 4, 8], fov: 50 }}>
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>

      {/* drei's asset-loading overlay (tracks the GLB download). */}
      <Loader />

      {/* Persistent movement hint. */}
      <div className="explore-hint">
        {isTouch
          ? 'Joystick to move · drag screen to look · button to jump'
          : 'WASD / arrows to move · Shift to sprint · drag to look · Space to jump'}
      </div>

      <Link to="/" className="explore-exit" aria-label="Exit the 3D world">
        ✕ Exit
      </Link>

      {/* Intro card — explains controls before they start. */}
      {!started && (
        <div className="explore-intro">
          <div className="explore-card">
            <p className="explore-card__eyebrow">An experiment</p>
            <h1 className="explore-card__title">Explore the World</h1>
            <p className="explore-card__text">
              Wander a floating world to discover my work. Walk up to a glowing
              kiosk to view a project.
            </p>
            <ul className="explore-card__controls">
              {isTouch ? (
                <>
                  <li><strong>Move</strong> — joystick (bottom-left)</li>
                  <li><strong>Look</strong> — drag anywhere else</li>
                  <li><strong>Jump</strong> — button (bottom-right)</li>
                </>
              ) : (
                <>
                  <li><strong>Move</strong> — W A S D or arrow keys</li>
                  <li><strong>Sprint</strong> — hold Shift</li>
                  <li><strong>Look</strong> — click and drag</li>
                  <li><strong>Jump</strong> — Space</li>
                </>
              )}
            </ul>
            <button className="explore-card__btn" onClick={() => setStarted(true)}>
              Enter the World
            </button>
            <Link to="/" className="explore-card__skip">
              or skip to the classic site
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
