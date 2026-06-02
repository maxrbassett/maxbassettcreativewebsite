import { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Loader } from '@react-three/drei'
import { Link } from 'react-router-dom'
import Scene from './Scene'
import TouchControls from './TouchControls'
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
      {/* Mobile joystick must render outside the R3F Canvas. */}
      {isTouch && <TouchControls />}

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
          ? 'Drag the joystick to move · tap the button to jump'
          : 'WASD or arrow keys to move · Space to jump'}
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
              Wander a 3D world to discover my work. This is an early preview —
              right now you can just walk around.
            </p>
            <ul className="explore-card__controls">
              {isTouch ? (
                <>
                  <li><strong>Move</strong> — drag the joystick (bottom-left)</li>
                  <li><strong>Jump</strong> — tap the button (bottom-right)</li>
                </>
              ) : (
                <>
                  <li><strong>Move</strong> — W A S D or arrow keys</li>
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
