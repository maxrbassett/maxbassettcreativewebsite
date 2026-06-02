import { useEffect, useRef } from 'react'
import { useJoystickControls } from 'ecctrl'

/* ------------------------------------------------------------------
 * TouchControls — a custom on-screen joystick + jump button for mobile.
 *
 * Replaces ecctrl's built-in EcctrlJoystick, which attaches its drag
 * listeners via document.querySelector during its first render (before
 * its own DOM exists) and so never wires up touch movement in our setup.
 *
 * This writes directly to ecctrl's global useJoystickControls store,
 * which Ecctrl reads every frame — so movement "just works" regardless
 * of where the values come from. Listeners attach via refs (guaranteed
 * to exist in the effect) and the drag is tracked on window, so it keeps
 * following even if the finger slides off the pad.
 *
 * Angle/!direction convention matches EcctrlJoystick exactly:
 *   dx = touchX - centerX,  dy = -(touchY - centerY)   (up = positive)
 *   ang = atan2(dy, dx) normalized to [0, 2π)
 * ------------------------------------------------------------------ */

const MAX_DIST = 48 // px the knob can travel from center
const RUN_THRESHOLD = 0.9 // fraction of MAX_DIST that counts as "running"

export default function TouchControls() {
  const baseRef = useRef(null)
  const knobRef = useRef(null)
  const jumpRef = useRef(null)

  const setJoystick = useJoystickControls((s) => s.setJoystick)
  const resetJoystick = useJoystickControls((s) => s.resetJoystick)
  const pressButton1 = useJoystickControls((s) => s.pressButton1)
  const releaseAllButtons = useJoystickControls((s) => s.releaseAllButtons)

  useEffect(() => {
    const base = baseRef.current
    const knob = knobRef.current
    const jump = jumpRef.current
    if (!base || !jump) return

    let activeId = null
    let center = { x: 0, y: 0 }

    const applyKnob = (kx, ky) => {
      if (knob) knob.style.transform = `translate(${kx}px, ${ky}px)`
    }

    const updateFromTouch = (touch) => {
      const dx = touch.clientX - center.x
      const dy = -(touch.clientY - center.y) // invert: up is positive
      const dist = Math.min(Math.hypot(dx, dy), MAX_DIST)
      let ang = Math.atan2(dy, dx)
      if (ang < 0) ang += Math.PI * 2
      const runState = dist > MAX_DIST * RUN_THRESHOLD
      setJoystick(dist, ang, runState)
      // Visual knob: screen Y is inverted relative to our math Y.
      applyKnob(Math.cos(ang) * dist, -Math.sin(ang) * dist)
    }

    // ---- Joystick ----
    const onBaseStart = (e) => {
      if (activeId !== null) return
      const touch = e.changedTouches[0]
      const rect = base.getBoundingClientRect()
      center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
      activeId = touch.identifier
      updateFromTouch(touch)
      e.preventDefault()
    }
    const onMove = (e) => {
      if (activeId === null) return
      for (const touch of e.changedTouches) {
        if (touch.identifier === activeId) {
          updateFromTouch(touch)
          e.preventDefault()
          break
        }
      }
    }
    const onEnd = (e) => {
      if (activeId === null) return
      for (const touch of e.changedTouches) {
        if (touch.identifier === activeId) {
          activeId = null
          resetJoystick()
          applyKnob(0, 0)
          break
        }
      }
    }

    // ---- Jump button ----
    const onJumpStart = (e) => {
      pressButton1()
      e.preventDefault()
    }
    const onJumpEnd = () => releaseAllButtons()

    base.addEventListener('touchstart', onBaseStart, { passive: false })
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onEnd, { passive: false })
    window.addEventListener('touchcancel', onEnd, { passive: false })
    jump.addEventListener('touchstart', onJumpStart, { passive: false })
    jump.addEventListener('touchend', onJumpEnd)
    jump.addEventListener('touchcancel', onJumpEnd)

    return () => {
      base.removeEventListener('touchstart', onBaseStart)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
      window.removeEventListener('touchcancel', onEnd)
      jump.removeEventListener('touchstart', onJumpStart)
      jump.removeEventListener('touchend', onJumpEnd)
      jump.removeEventListener('touchcancel', onJumpEnd)
    }
  }, [setJoystick, resetJoystick, pressButton1, releaseAllButtons])

  return (
    <>
      <div ref={baseRef} className="touch-joystick" aria-hidden="true">
        <div ref={knobRef} className="touch-joystick__knob" />
      </div>
      <button ref={jumpRef} className="touch-jump" aria-label="Jump" type="button">
        JUMP
      </button>
    </>
  )
}
