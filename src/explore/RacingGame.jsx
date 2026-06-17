import { useEffect, useRef, useState } from 'react'
import { audio } from './audio'

/* Grand Prix — a top-down lap circuit. You steer a hot rod (auto-throttle;
 * left/right only) around an oval track for LAPS laps, racing three AI rivals;
 * finish ahead of them. Off the asphalt the grass slows you down, so the line
 * you drive matters. Rendered on a <canvas> with a requestAnimationFrame loop
 * (game state lives in refs; React state only drives the intro/result UI).
 * Best finishing position persists in localStorage. */

// Canvas + track geometry (logical pixels).
const W = 360
const H = 300
const CX = 180
const CY = 150
const A = 130 // mid-line ellipse radii
const B = 100
const TW = 30 // half track width
const OA = A + TW
const OB = B + TW
const IA = A - TW
const IB = B - TW
const LAPS = 3
const TWO_PI = Math.PI * 2
const BEST_KEY = 'explore-race-best'

const shortAngle = (d) => Math.atan2(Math.sin(d), Math.cos(d))
// Heading tangent to the mid-line for increasing theta (the racing direction).
const tangentHeading = (t) => Math.atan2(B * Math.cos(t), -A * Math.sin(t))

// Approx "on the asphalt?": distance to the nearest mid-line point < half width.
function onTrack(x, y) {
  const th = Math.atan2((y - CY) / B, (x - CX) / A)
  const mx = CX + A * Math.cos(th)
  const my = CY + B * Math.sin(th)
  return Math.hypot(x - mx, y - my) <= TW
}

const ordinal = (n) => (n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`)

function drawCar(ctx, x, y, h, color) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(h)
  ctx.fillStyle = '#1c1c22' // wheels
  ctx.fillRect(-7, -7, 5, 3)
  ctx.fillRect(-7, 4, 5, 3)
  ctx.fillRect(3, -7, 5, 3)
  ctx.fillRect(3, 4, 5, 3)
  ctx.fillStyle = color // body
  ctx.fillRect(-8, -5, 16, 10)
  ctx.fillStyle = 'rgba(210,240,255,0.5)' // windshield toward front
  ctx.fillRect(1, -3.5, 5, 7)
  ctx.restore()
}

function drawTrack(ctx) {
  ctx.fillStyle = '#6fae54' // grass
  ctx.fillRect(0, 0, W, H)
  // asphalt ring = outer ellipse minus infield
  ctx.fillStyle = '#36363d'
  ctx.beginPath()
  ctx.ellipse(CX, CY, OA, OB, 0, 0, TWO_PI)
  ctx.fill()
  ctx.fillStyle = '#6fae54'
  ctx.beginPath()
  ctx.ellipse(CX, CY, IA, IB, 0, 0, TWO_PI)
  ctx.fill()
  // edge stripes
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.ellipse(CX, CY, OA, OB, 0, 0, TWO_PI)
  ctx.stroke()
  ctx.beginPath()
  ctx.ellipse(CX, CY, IA, IB, 0, 0, TWO_PI)
  ctx.stroke()
  // start/finish checker (radial band at theta=0, the right side)
  const x0 = CX + IA
  const sq = (OA - IA) / 5
  for (let c = 0; c < 5; c++) {
    for (let r = 0; r < 2; r++) {
      ctx.fillStyle = (r + c) % 2 ? '#f4f4f4' : '#171717'
      ctx.fillRect(x0 + c * sq, CY - 12 + r * 12, sq, 12)
    }
  }
}

export function RacingPanel({ onClose }) {
  const canvasRef = useRef(null)
  const touchRef = useRef(0) // -1 / 0 / 1 from on-screen buttons
  const [phase, setPhase] = useState('intro') // intro | racing | done
  const [runId, setRunId] = useState(0)
  const [result, setResult] = useState(null)
  const [best, setBest] = useState(() => {
    const n = Number(localStorage.getItem(BEST_KEY))
    return Number.isFinite(n) && n > 0 ? n : null
  })

  const start = () => {
    setResult(null)
    setPhase('racing')
    setRunId((r) => r + 1)
  }

  useEffect(() => {
    if (runId === 0) return
    const ctx = canvasRef.current.getContext('2d')

    const startTheta = -0.28
    const player = {
      x: CX + A * Math.cos(startTheta),
      y: CY + B * Math.sin(startTheta),
      heading: tangentHeading(startTheta),
      speed: 0,
      thetaPrev: startTheta,
      prog: startTheta,
      progStart: startTheta,
    }
    const ais = [
      { color: '#4d96ff', omega: 1.1, lane: -14 },
      { color: '#3a7d5a', omega: 1.2, lane: 0 },
      { color: '#c77dff', omega: 1.28, lane: 14 },
    ].map((d, i) => {
      const th = startTheta - 0.14 * (i + 1)
      return { ...d, prog: th, progStart: th }
    })

    const keys = { left: false, right: false }
    const onKey = (down) => (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        keys.left = down
        e.preventDefault()
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        keys.right = down
        e.preventDefault()
      }
    }
    const kd = onKey(true)
    const ku = onKey(false)
    window.addEventListener('keydown', kd)
    window.addEventListener('keyup', ku)

    const norm = (r) => r.prog - r.progStart
    const finishAt = LAPS * TWO_PI
    let raf
    let last = null
    let mode = 'count'
    let clock = 0
    let goPlayed = false

    const frame = (ts) => {
      if (last == null) last = ts
      let dt = (ts - last) / 1000
      last = ts
      if (dt > 0.05) dt = 0.05
      clock += dt

      if (mode === 'count' && clock >= 3.2) {
        mode = 'go'
        if (!goPlayed) {
          audio.playWhoosh()
          goPlayed = true
        }
      }

      if (mode === 'go') {
        const steer = touchRef.current !== 0 ? touchRef.current : (keys.right ? 1 : 0) - (keys.left ? 1 : 0)
        const target = onTrack(player.x, player.y) ? 165 : 55
        player.speed += (target - player.speed) * Math.min(1, dt * 3)
        player.heading += steer * 2.7 * dt
        player.x = Math.max(12, Math.min(W - 12, player.x + Math.cos(player.heading) * player.speed * dt))
        player.y = Math.max(12, Math.min(H - 12, player.y + Math.sin(player.heading) * player.speed * dt))
        const thNow = Math.atan2((player.y - CY) / B, (player.x - CX) / A)
        player.prog += shortAngle(thNow - player.thetaPrev)
        player.thetaPrev = thNow
        for (const a of ais) {
          const noise = Math.sin(clock * 3 + a.omega * 10) * 0.03
          a.prog += (a.omega + noise) * dt
        }
        if (norm(player) >= finishAt) {
          mode = 'done'
          const pos = 1 + ais.filter((a) => norm(a) > norm(player)).length
          setResult({ pos })
          setPhase('done')
          setBest((b) => {
            if (b == null || pos < b) {
              try {
                localStorage.setItem(BEST_KEY, String(pos))
              } catch {
                /* storage unavailable */
              }
              return pos
            }
            return b
          })
          if (pos === 1) audio.playChime()
        }
      }

      // ---- draw ----
      drawTrack(ctx)
      for (const a of ais) {
        const th = a.prog
        const ax = CX + (A + a.lane) * Math.cos(th)
        const ay = CY + (B + a.lane) * Math.sin(th)
        drawCar(ctx, ax, ay, tangentHeading(th), a.color)
      }
      drawCar(ctx, player.x, player.y, player.heading, '#e63946')

      // HUD
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 15px sans-serif'
      ctx.textBaseline = 'top'
      const lap = Math.max(1, Math.min(LAPS, Math.floor(norm(player) / TWO_PI) + 1))
      const pos = 1 + ais.filter((a) => norm(a) > norm(player)).length
      ctx.textAlign = 'left'
      ctx.fillText(`LAP ${lap}/${LAPS}`, 10, 10)
      ctx.textAlign = 'right'
      ctx.fillText(`${ordinal(pos)} / 4`, W - 10, 10)

      // countdown
      if (mode === 'count') {
        const n = Math.floor(clock)
        const label = clock >= 3 ? 'GO!' : String(3 - n)
        ctx.fillStyle = 'rgba(0,0,0,0.35)'
        ctx.fillRect(0, 0, W, H)
        ctx.fillStyle = '#fff3b0'
        ctx.font = 'bold 64px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(label, CX, CY)
      }

      if (mode !== 'done') raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', kd)
      window.removeEventListener('keyup', ku)
    }
  }, [runId])

  const press = (dir) => (e) => {
    e.preventDefault()
    touchRef.current = dir
  }
  const release = (e) => {
    e.preventDefault()
    touchRef.current = 0
  }

  return (
    <div className="explore-panel-backdrop" onClick={onClose}>
      <div className="explore-rc" onClick={(e) => e.stopPropagation()}>
        <button className="explore-panel__close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <div className="explore-rc__marquee">GRAND PRIX</div>
        <p className="explore-rc__tagline">Steer the hot rod — finish ahead of your rivals! ({LAPS} laps)</p>

        <div className="explore-rc__stage">
          <canvas ref={canvasRef} width={W} height={H} className="explore-rc__canvas" />
          {phase === 'intro' && (
            <div className="explore-rc__overlay">
              <p className="explore-rc__hint">
                Steer with ← → (or A / D) or the buttons below. You auto-accelerate — stay on the asphalt; the grass slows you.
              </p>
              <button className="explore-rc__btn" onClick={start}>Start race</button>
              {best && <p className="explore-rc__best">Best finish: {ordinal(best)}</p>}
            </div>
          )}
          {phase === 'done' && result && (
            <div className="explore-rc__overlay">
              <div className="explore-rc__result">
                {result.pos === 1 ? '🏆' : '🏁'} You finished {ordinal(result.pos)}!
              </div>
              {result.pos === 1 && <p>First place — nice driving! 🎉</p>}
              {best && <p className="explore-rc__best">Best finish: {ordinal(best)}</p>}
              <button className="explore-rc__btn" onClick={start}>Race again</button>
            </div>
          )}
        </div>

        <div className="explore-rc__controls">
          <button
            className="explore-rc__steer"
            onPointerDown={press(-1)}
            onPointerUp={release}
            onPointerLeave={release}
            onPointerCancel={release}
            aria-label="Steer left"
          >
            ◀
          </button>
          <button
            className="explore-rc__steer"
            onPointerDown={press(1)}
            onPointerUp={release}
            onPointerLeave={release}
            onPointerCancel={release}
            aria-label="Steer right"
          >
            ▶
          </button>
        </div>
      </div>
    </div>
  )
}
