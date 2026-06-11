import { Suspense, useEffect, useState, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { Loader } from '@react-three/drei'
import { Link } from 'react-router-dom'
import Scene from './Scene'
import TouchControls from './TouchControls'
import InteractionOverlay from './InteractionOverlay'
import { useExplore } from './useExplore'
import { audio } from './audio'
import { NPC } from './interactables'
import './explore.css'

// Flat line icons (white, matching the Exit text) for the mute toggle.
function SpeakerOnIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 5 6 9H3v6h3l5 4z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18.5 6a9 9 0 0 1 0 12" />
    </svg>
  )
}

function SpeakerOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 5 6 9H3v6h3l5 4z" />
      <line x1="16" y1="9" x2="22" y2="15" />
      <line x1="22" y1="9" x2="16" y2="15" />
    </svg>
  )
}

// Full-screen black overlay for launch-pad teleports — fades out, the teleport
// happens while it's opaque, then it fades back in. Its own component so only it
// re-renders as the fade value changes each frame.
function FadeOverlay() {
  const fade = useExplore((s) => s.fade)
  if (fade <= 0) return null
  return <div className="explore-fade" style={{ opacity: fade }} aria-hidden="true" />
}

// Mute/unmute toggle for all world audio (persisted in audio.toggleMute).
function SoundToggle() {
  const [muted, setMuted] = useState(audio.muted)
  return (
    <button
      className="explore-mute"
      onClick={() => setMuted(audio.toggleMute())}
      aria-label={muted ? 'Unmute' : 'Mute'}
      title={muted ? 'Unmute sound' : 'Mute sound'}
    >
      {muted ? <SpeakerOffIcon /> : <SpeakerOnIcon />}
    </button>
  )
}

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
  // If the GPU runs out of memory the browser kills the WebGL context (black
  // screen). We catch that and offer a reload instead of a dead canvas.
  const [contextLost, setContextLost] = useState(false)
  // Only full-screen panels hide the joystick — the NPC speech bubble doesn't,
  // so Max talking never interrupts moving around (esp. the auto-greet on load).
  const activeType = useExplore((s) => s.active?.type)
  const panelOpen = activeType != null && activeType !== 'npc'

  // Enter the world: this click/keypress is the user gesture that unlocks audio
  // (browsers block autoplay), so we start the ambient beds + greeting here.
  const begin = useCallback(() => {
    audio.enter()
    audio.playGreeting()
    setStarted(true)
  }, [])

  // Let the intro card be dismissed with Enter (in addition to the button).
  useEffect(() => {
    if (started) return
    const onKey = (e) => {
      if (e.key === 'Enter') begin()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [started, begin])

  // Stop all world audio when leaving the 3D world (Exit, back button, etc.).
  useEffect(() => () => audio.stop(), [])

  // Auto-greet: open Max's welcome dialogue once, as soon as you enter the world.
  useEffect(() => {
    if (started) useExplore.getState().open(NPC)
  }, [started])

  // Magic chime whenever a panel/dialogue opens (active changes to a new id).
  // Lives here (always mounted) so it fires even while the Scene is still
  // loading. audio.playChime() no-ops until audio has been unlocked on entry.
  useEffect(() => {
    return useExplore.subscribe((state, prevState) => {
      const id = state.active?.id ?? null
      if (id && id !== (prevState.active?.id ?? null)) audio.playChime()
    })
  }, [])

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

      <Canvas
        shadows="soft"
        // Cap pixel ratio: on high-density (esp. mobile) screens, 2x renders 4x
        // the pixels — the heaviest GPU + memory cost. 1.5 still looks crisp.
        dpr={[1, 1.5]}
        camera={{ position: [0, 4, 8], fov: 50, near: 0.3, far: 400 }}
        onCreated={({ gl }) => {
          const canvas = gl.domElement
          canvas.addEventListener('webglcontextlost', (e) => {
            e.preventDefault() // let the browser keep the canvas for a restore
            setContextLost(true)
          })
          canvas.addEventListener('webglcontextrestored', () => setContextLost(false))
        }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>

      {contextLost && (
        <div className="explore-context-lost">
          <p>The 3D world ran low on graphics memory and paused.</p>
          <button onClick={() => window.location.reload()}>Reload the world</button>
        </div>
      )}

      {/* drei's asset-loading overlay (tracks the GLB download). */}
      <Loader />

      {/* Persistent movement hint — desktop only; on mobile the on-screen
          buttons are self-explanatory and the pill just crowds the controls. */}
      {!isTouch && (
        <div className="explore-hint">
          WASD / arrows to move · Shift to sprint · drag to look · Space to jump
        </div>
      )}

      {started && <SoundToggle />}
      <FadeOverlay />

      <Link to="/" className="explore-exit" aria-label="Exit the 3D world">
        ✕ Exit
      </Link>

      {/* Intro card — explains controls before they start. */}
      {!started && (
        <div className="explore-intro">
          <div className="explore-card">
            <p className="explore-card__eyebrow">An experiment</p>
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
            <button className="explore-card__btn" onClick={begin}>
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
