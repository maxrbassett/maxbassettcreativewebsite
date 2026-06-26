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

// Music playlists — played in order, looping back to the first. Drop any of
// these into /public/audio/ to add songs; missing ones are skipped automatically.
const MUSIC_FILES = ['music.mp3', 'music-2.mp3', 'music-3.mp3'] // main world
const SECRET_MUSIC_FILES = ['music-secret.mp3', 'music-secret-2.mp3'] // secret level

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
  whoosh: 0.6, // launch-pad teleport
  greeting: 0.85,
}

const lerp = (a, b, t) => a + (b - a) * t

// Web Audio Howl: the file is fetched in full and decoded up front. Use for
// short, latency-sensitive SFX (footsteps, chime, whoosh) and the gaplessly
// looping ambient bed — small files where instant, seamless playback matters.
const mk = (file, opts) =>
  new Howl({ src: [BASE + file], onloaderror: () => {}, onplayerror: () => {}, ...opts })

// HTML5-streaming Howl: playback starts as soon as enough has buffered and the
// file is never fully decoded on the main thread. Use for the big music tracks
// so they stream progressively instead of downloading megabytes up front and
// saturating bandwidth while the 3D world is still loading.
const mkStream = (file, opts) =>
  new Howl({ src: [BASE + file], html5: true, onloaderror: () => {}, onplayerror: () => {}, ...opts })

class WorldAudio {
  constructor() {
    this.created = false
    this.playing = false
    this._secret = false // currently on the secret-level playlist?
    this._musicPaused = false // music ducked for an open kiosk video?
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
    // Two music playlists: the main world and the upbeat secret level. setSecret
    // crossfades between them (pausing the inactive one so it doesn't drift).
    this.music = this._buildPlaylist(MUSIC_FILES)
    this.secretMusic = this._buildPlaylist(SECRET_MUSIC_FILES)
    // Footstep pools: surface -> array of Howls (one chosen at random per step).
    this.footsteps = {}
    for (const surface of Object.keys(FOOTSTEP_SETS)) {
      this.footsteps[surface] = FOOTSTEP_SETS[surface].map((f) => mk(f, { volume: VOL.foot }))
    }
    this.chime = mk('chime.mp3', { volume: VOL.chime })
    this.switchOn = mk('switch-on.mp3', { volume: VOL.switchOn })
    this.whoosh = mk('whoosh.mp3', { volume: VOL.whoosh })
    this.greeting = mk('max-hello.mp3', { volume: VOL.greeting })
  }

  // Called on the "Enter the World" gesture: unlock + start the beds.
  enter() {
    this.ensure()
    Howler.mute(this._muted)
    if (this.playing) return
    this.playing = true
    this._secret = false
    this.ambientOut.play() // volume driven by setAmbient()
    this.ambientIn?.play()
    this._plPlay(this.music, 1600) // music eases in
  }

  // Build a playlist: { index, files, failed, tracks }. This holds only the file
  // NAMES — each track's Howl is constructed lazily by _track() the first time
  // it's played, so constructing a playlist downloads nothing. The big music
  // files therefore don't fetch until they're actually about to be heard (the
  // next track only after the current one is ending, the secret playlist only
  // when you reach the secret area), keeping bandwidth free for the 3D assets.
  _buildPlaylist(files) {
    return { index: 0, files, failed: [], tracks: new Array(files.length).fill(null) }
  }

  // Lazily construct + cache the streaming Howl for track i of a playlist.
  _track(pl, i) {
    if (pl.tracks[i]) return pl.tracks[i]
    const h = mkStream(pl.files[i], {
      volume: 0,
      onend: () => this._plAdvance(pl),
      // A missing/broken file is marked failed and skipped; _plAdvance only plays
      // tracks that haven't failed, so if every track is missing it just goes quiet
      // (no infinite advance loop).
      onloaderror: () => {
        pl.failed[i] = true
        this._plAdvance(pl)
      },
      onplayerror: () => this._plAdvance(pl),
    })
    pl.tracks[i] = h
    return h
  }

  // Play (or resume) a playlist's current track, fading it in over `dur` ms.
  _plPlay(pl, dur) {
    const h = this._track(pl, pl.index)
    const id = h.play()
    h.fade(0, VOL.music, dur, id)
  }

  // Advance to the next loadable track (wrapping), so the playlist loops forever.
  _plAdvance(pl) {
    const n = pl.files.length
    for (let step = 1; step <= n; step++) {
      const i = (pl.index + step) % n
      if (!pl.failed[i]) {
        pl.index = i
        this._plPlay(pl, 1200)
        return
      }
    }
  }

  // Fade out + pause a playlist's current track (so it doesn't advance while away).
  // No-op if the current track was never built/played (nothing to pause).
  _plPause(pl) {
    const h = pl.tracks[pl.index]
    if (!h) return
    h.fade(h.volume(), 0, 700)
    h.once('fade', () => h.pause())
  }

  // The playlist currently in play (secret level vs main world).
  _activePlaylist() {
    return this._secret ? this.secretMusic : this.music
  }

  // Duck the world music while external media (a YouTube kiosk video) plays, so
  // the two don't talk over each other. pauseMusic fades + pauses the current
  // track; resumeMusic fades it back in. Safe to call before audio is unlocked
  // or when nothing is playing (no-ops), and idempotent if called twice.
  pauseMusic() {
    if (!this.playing || this._musicPaused) return
    this._musicPaused = true
    this._plPause(this._activePlaylist())
  }

  resumeMusic() {
    if (!this.playing || !this._musicPaused) return
    this._musicPaused = false
    this._plPlay(this._activePlaylist(), 700)
  }

  // Crossfade between the main playlist and the secret-level playlist.
  setSecret(on) {
    if (!this.playing || on === this._secret) return
    this._secret = on
    if (on) {
      this._plPause(this.music)
      this._plPlay(this.secretMusic, 700)
    } else {
      this._plPause(this.secretMusic)
      this._plPlay(this.music, 700)
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

  playWhoosh() {
    if (this.playing) this.whoosh.play()
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
    this._secret = false
    this._musicPaused = false
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
