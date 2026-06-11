import { Howl, Howler } from 'howler'

/* ------------------------------------------------------------------
 * Audio for the 3D world. A tiny Howler-based singleton: ambient beds
 * (crossfaded inside↔outside), footsteps (grass vs hard), a UI chime, an
 * NPC greeting, and a music loop. Everything is gated behind a user gesture
 * (the "Enter the World" button) because browsers block autoplay.
 *
 * Files live in /public/audio/. Missing files fail quietly (onloaderror) so
 * the world still works before the real assets are dropped in.
 * ------------------------------------------------------------------ */

const BASE = '/audio/'

// Music playlist — played in order, looping back to the first. Drop any of these
// into /public/audio/ to add songs; missing ones are skipped automatically.
const MUSIC_FILES = ['music.mp3', 'music-2.mp3', 'music-3.mp3']

// Footstep variations per surface — one is picked at random each step (avoiding
// an immediate repeat) for variety. Add/remove files here to match what's in
// /public/audio/; any that fail to load are simply silent.
const FOOTSTEP_SETS = {
  grass: [1, 2, 3, 4, 5].map((n) => `footstep-grass-${n}.mp3`),
  stone: [1, 2, 3, 4, 5].map((n) => `footstep-stone-${n}.mp3`),
  glass: [1, 2, 3, 4, 5].map((n) => `footstep-glass-${n}.mp3`),
}

// Per-sound base volumes. ambientOutDucked is the outdoor bed's level while
// you're inside a building (muffled, not silent).
const VOL = {
  music: 0.22,
  ambientOut: 0.5,
  ambientOutDucked: 0, // fully silent once through the tunnel / inside
  ambientIn: 0.35,
  foot: 0.2,
  chime: 0.5,
  switchOn: 0.4, // layered under the chime on kiosk open for a richer "pop"
  greeting: 0.85,
}

const lerp = (a, b, t) => a + (b - a) * t

const mk = (file, opts) =>
  new Howl({ src: [BASE + file], onloaderror: () => {}, onplayerror: () => {}, ...opts })

class WorldAudio {
  constructor() {
    this.created = false
    this.playing = false
    this._musicIndex = 0
    this._musicFailed = []
    this._lastStep = {} // last-played index per surface (avoid repeats)
    this._muted =
      typeof localStorage !== 'undefined' && localStorage.getItem('explore-muted') === '1'
  }

  // Build the Howls once (lazy — on first user gesture).
  ensure() {
    if (this.created) return
    this.created = true
    // Looping beds use Web Audio (default) so they loop gaplessly.
    this.ambientOut = mk('ambient-outdoor.mp3', { loop: true, volume: 0 })
    // Indoor room tone disabled for now (testing the outdoor-bed-only feel).
    // Re-enable by uncommenting:
    // this.ambientIn = mk('ambient-indoor.mp3', { loop: true, volume: 0 })
    // Playlist: each track advances to the next on end (no per-track loop), so
    // they cycle. A track that fails to load is flagged and skipped.
    this.musicTracks = MUSIC_FILES.map((f, i) =>
      mk(f, {
        volume: 0,
        onend: () => this._advanceMusic(),
        onloaderror: () => {
          this._musicFailed[i] = true
        },
        onplayerror: () => this._advanceMusic(),
      })
    )
    // Footstep pools: surface -> array of Howls (one chosen at random per step).
    this.footsteps = {}
    for (const surface of Object.keys(FOOTSTEP_SETS)) {
      this.footsteps[surface] = FOOTSTEP_SETS[surface].map((f) => mk(f, { volume: VOL.foot }))
    }
    this.chime = mk('chime.mp3', { volume: VOL.chime })
    this.switchOn = mk('switch-on.mp3', { volume: VOL.switchOn })
    this.greeting = mk('max-hello.mp3', { volume: VOL.greeting })
  }

  // Called on the "Enter the World" gesture: unlock + start the beds.
  enter() {
    this.ensure()
    Howler.mute(this._muted)
    if (this.playing) return
    this.playing = true
    this.ambientOut.play() // volume driven by setAmbient()
    this.ambientIn?.play()
    this._play(0, 1600) // music eases in
  }

  // Play music track i, fading it in over `dur` ms.
  _play(i, dur) {
    this._musicIndex = i
    const h = this.musicTracks[i]
    const id = h.play()
    h.fade(0, VOL.music, dur, id)
  }

  // Advance to the next available track (skipping any that failed to load),
  // wrapping back to the start so the playlist loops forever.
  _advanceMusic() {
    const n = this.musicTracks.length
    for (let step = 1; step <= n; step++) {
      const i = (this._musicIndex + step) % n
      if (!this._musicFailed[i]) {
        this._play(i, 1200)
        return
      }
    }
  }

  // duck = how much to quiet the outdoor bed (0 open-air → 1 deep indoors),
  // inLevel = how much interior room tone to mix in (0 outside → 1 inside).
  setAmbient(duck, inLevel) {
    if (!this.playing) return
    this.ambientOut.volume(lerp(VOL.ambientOut, VOL.ambientOutDucked, duck))
    this.ambientIn?.volume(VOL.ambientIn * inLevel)
  }

  playFootstep(surface) {
    if (!this.playing) return
    const set = this.footsteps[surface] || this.footsteps.grass
    if (!set || !set.length) return
    // Random variation, avoiding an immediate repeat of the same sample.
    let i = Math.floor(Math.random() * set.length)
    if (set.length > 1 && i === this._lastStep[surface]) i = (i + 1) % set.length
    this._lastStep[surface] = i
    const id = set[i].play()
    set[i].rate(0.92 + Math.random() * 0.16, id) // a little pitch variation too
  }

  playChime() {
    if (!this.playing) return
    this.chime.play()
    this.switchOn.play() // layered for a richer "pop"
  }

  playGreeting() {
    if (this.playing) this.greeting.play()
  }

  // Halt everything (called when leaving the 3D world). Resets `playing` so a
  // later enter() restarts the beds cleanly.
  stop() {
    if (!this.created) return
    Howler.stop() // stops every currently-playing sound across all Howls
    this.playing = false
  }

  get muted() {
    return this._muted
  }

  toggleMute() {
    this._muted = !this._muted
    Howler.mute(this._muted)
    if (typeof localStorage !== 'undefined')
      localStorage.setItem('explore-muted', this._muted ? '1' : '0')
    return this._muted
  }
}

export const audio = new WorldAudio()
