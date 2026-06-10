import * as THREE from 'three'

/* ------------------------------------------------------------------
 * Generated "poster" screens for kiosks that have no thumbnail (internal
 * tools, leadership work, image-less projects) — instead of a blank panel.
 *
 * Each poster is a canvas-drawn 16:9 image: a dark gradient ground, a
 * decorative motif, a category eyebrow, and the title in bold. The palette +
 * motif are chosen deterministically from the item's id, so every screen looks
 * distinct yet shares one professional style. Returns a THREE.CanvasTexture.
 * ------------------------------------------------------------------ */

const W = 1280
const H = 762 // ≈ the 4.2×2.5 (16:9-ish) screen plane aspect
const PAD = 84
const FONT = '"Helvetica Neue", Helvetica, Arial, sans-serif'

// Dark, rich backgrounds (corner-to-corner gradient) each with one bright
// accent — curated so any pick reads as professional.
const PALETTES = [
  { a: '#1b2a4a', b: '#0d1426', accent: '#5fd0ff' }, // navy / sky
  { a: '#13322e', b: '#0a1a18', accent: '#54e0b0' }, // teal / mint
  { a: '#2a1b40', b: '#150d24', accent: '#c08bff' }, // violet / lilac
  { a: '#3a1626', b: '#1d0c15', accent: '#ff8aa6' }, // plum / rose
  { a: '#242a33', b: '#11151b', accent: '#ffc04d' }, // slate / amber
  { a: '#103040', b: '#081820', accent: '#46d6e0' }, // deep cyan
  { a: '#1c3320', b: '#0c1810', accent: '#9be15a' }, // forest / lime
  { a: '#322033', b: '#170c18', accent: '#ff9d57' }, // mulberry / orange
]

const MOTIFS = ['dots', 'rings', 'diagonals', 'plus', 'waves', 'circuit', 'triangles', 'bokeh']

// FNV-1a string hash → uint32, for deterministic palette/motif/seed picks.
function hash(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

// Small seeded RNG (mulberry32) for the scattered motifs.
function rng(seed) {
  let s = seed >>> 0
  return () => {
    s |= 0
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function drawMotif(ctx, motif, accent, seed) {
  ctx.save()
  ctx.strokeStyle = accent
  ctx.fillStyle = accent
  switch (motif) {
    case 'dots': {
      ctx.globalAlpha = 0.16
      for (let y = 60; y < H; y += 64)
        for (let x = 60; x < W; x += 64) {
          ctx.beginPath()
          ctx.arc(x, y, 4, 0, Math.PI * 2)
          ctx.fill()
        }
      break
    }
    case 'rings': {
      ctx.globalAlpha = 0.14
      ctx.lineWidth = 6
      const cx = W * 0.8
      const cy = H * 0.26
      for (let r = 40; r < 520; r += 48) {
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.stroke()
      }
      break
    }
    case 'diagonals': {
      ctx.globalAlpha = 0.1
      ctx.lineWidth = 10
      for (let x = -H; x < W; x += 64) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x + H, H)
        ctx.stroke()
      }
      break
    }
    case 'plus': {
      ctx.globalAlpha = 0.16
      ctx.lineWidth = 6
      const s = 13
      for (let y = 70; y < H; y += 88)
        for (let x = 70; x < W; x += 88) {
          ctx.beginPath()
          ctx.moveTo(x - s, y)
          ctx.lineTo(x + s, y)
          ctx.moveTo(x, y - s)
          ctx.lineTo(x, y + s)
          ctx.stroke()
        }
      break
    }
    case 'waves': {
      ctx.globalAlpha = 0.13
      ctx.lineWidth = 5
      for (let row = 0; row < 7; row++) {
        const y0 = 90 + row * 100
        ctx.beginPath()
        for (let x = 0; x <= W; x += 12) {
          const y = y0 + Math.sin((x / W) * Math.PI * 4 + row) * 26
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }
        ctx.stroke()
      }
      break
    }
    case 'circuit': {
      ctx.globalAlpha = 0.08
      ctx.lineWidth = 2
      for (let x = 80; x < W; x += 80) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, H)
        ctx.stroke()
      }
      for (let y = 80; y < H; y += 80) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(W, y)
        ctx.stroke()
      }
      ctx.globalAlpha = 0.22
      const r = rng(seed)
      for (let i = 0; i < 26; i++) {
        const x = Math.round((r() * (W - 160)) / 80) * 80 + 80
        const y = Math.round((r() * (H - 160)) / 80) * 80 + 80
        ctx.beginPath()
        ctx.arc(x, y, 5, 0, Math.PI * 2)
        ctx.fill()
      }
      break
    }
    case 'triangles': {
      ctx.globalAlpha = 0.16
      ctx.lineWidth = 4
      const r = rng(seed)
      for (let i = 0; i < 16; i++) {
        const x = r() * W
        const y = r() * H
        const s = 30 + r() * 80
        const rot = r() * Math.PI * 2
        ctx.beginPath()
        for (let k = 0; k < 3; k++) {
          const a = rot + (k / 3) * Math.PI * 2
          const px = x + Math.cos(a) * s
          const py = y + Math.sin(a) * s
          k === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
        }
        ctx.closePath()
        ctx.stroke()
      }
      break
    }
    case 'bokeh':
    default: {
      const r = rng(seed)
      for (let i = 0; i < 22; i++) {
        const x = r() * W
        const y = r() * H
        const rad = 24 + r() * 120
        ctx.globalAlpha = 0.05 + r() * 0.12
        ctx.beginPath()
        ctx.arc(x, y, rad, 0, Math.PI * 2)
        ctx.fill()
      }
      break
    }
  }
  ctx.restore()
}

// Greedy word-wrap that shrinks the font until the title fits ≤3 lines.
function layoutTitle(ctx, text, maxWidth, maxHeight) {
  for (let size = 96; size >= 46; size -= 4) {
    ctx.font = `800 ${size}px ${FONT}`
    const words = text.split(' ')
    const lines = []
    let line = ''
    for (const w of words) {
      const test = line ? `${line} ${w}` : w
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line)
        line = w
      } else {
        line = test
      }
    }
    if (line) lines.push(line)
    const lh = size * 1.08
    if (lines.length <= 3 && lines.length * lh <= maxHeight) return { size, lines, lh }
  }
  // Fallback: smallest size, hard cap at 3 lines.
  ctx.font = `800 46px ${FONT}`
  return { size: 46, lines: text.split(' ').slice(0, 12).join(' ').match(/.{1,40}/g) || [text], lh: 50 }
}

// Draw a poster onto a fresh canvas and return it. Shared by the in-world TV
// texture (makePosterTexture) and the opened-card image (makePosterDataURL), so
// a kiosk's screen and its panel header look identical.
export function makePosterCanvas({ key, title, eyebrow }) {
  const seed = hash(key || title || 'x')
  const palette = PALETTES[seed % PALETTES.length]
  const motif = MOTIFS[(seed >>> 5) % MOTIFS.length]

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  // Background: corner-to-corner gradient.
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, palette.a)
  bg.addColorStop(1, palette.b)
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  drawMotif(ctx, motif, palette.accent, seed)

  // Bottom scrim so the title stays readable over a busy motif.
  const scrim = ctx.createLinearGradient(0, H * 0.4, 0, H)
  scrim.addColorStop(0, 'rgba(0,0,0,0)')
  scrim.addColorStop(1, 'rgba(0,0,0,0.62)')
  ctx.fillStyle = scrim
  ctx.fillRect(0, 0, W, H)

  // --- Title + eyebrow block, anchored to the bottom-left. ---
  const maxW = W - PAD * 2
  const { lines, lh } = layoutTitle(ctx, title, maxW, H * 0.5)
  const eyebrowSize = 30
  const barH = 7
  const gap1 = 20 // accent bar → eyebrow
  const gap2 = 18 // eyebrow → title
  const titleH = lines.length * lh
  const blockH = barH + gap1 + eyebrowSize + gap2 + titleH
  let y = H - PAD - blockH
  ctx.textBaseline = 'top'

  // Accent bar.
  ctx.fillStyle = palette.accent
  ctx.fillRect(PAD, y, 64, barH)
  y += barH + gap1

  // Eyebrow (uppercase, letter-spaced, accent color).
  if (eyebrow) {
    ctx.fillStyle = palette.accent
    ctx.font = `700 ${eyebrowSize}px ${FONT}`
    try {
      ctx.letterSpacing = '6px'
    } catch {
      /* older browsers: no letterSpacing, still fine */
    }
    ctx.fillText(eyebrow.toUpperCase(), PAD, y)
    try {
      ctx.letterSpacing = '0px'
    } catch {
      /* no-op */
    }
  }
  y += eyebrowSize + gap2

  // Title (bold white, drop shadow for separation from the motif).
  ctx.fillStyle = '#ffffff'
  ctx.shadowColor = 'rgba(0,0,0,0.45)'
  ctx.shadowBlur = 16
  ctx.shadowOffsetY = 3
  ctx.font = `800 ${lh / 1.08}px ${FONT}`
  for (const ln of lines) {
    ctx.fillText(ln, PAD, y)
    y += lh
  }

  return canvas
}

// In-world TV screen texture.
export function makePosterTexture(opts) {
  const tex = new THREE.CanvasTexture(makePosterCanvas(opts))
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  tex.needsUpdate = true
  return tex
}

// Same poster as a PNG data URL, for the opened-card panel's <img>.
export function makePosterDataURL(opts) {
  return makePosterCanvas(opts).toDataURL('image/png')
}
