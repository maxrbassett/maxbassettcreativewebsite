3D WORLD AUDIO — drop your .mp3 files here with these exact names.
Missing files fail silently (the world still works), so add them as you go.

Wired up in src/explore/audio.js:

  ambient-outdoor.mp3   Birds + gentle wind. Loops continuously outdoors.
                        (Plays quietly/muffled while inside a building.)
  ambient-indoor.mp3    OPTIONAL quiet interior room tone. Fades in inside
                        buildings. Omit it and only the outdoor bed ducks.
  music.mp3             Background music. Eases in on entry.
  music-2.mp3           OPTIONAL extra songs. The playlist plays music.mp3 →
  music-3.mp3           music-2 → music-3 → back to music.mp3, forever. Missing
                        ones are skipped automatically; add them anytime.
  music-secret.mp3      Upbeat playlist for the SECRET LEVEL. Crossfades in when
  music-secret-2.mp3    you're down there and back to the main playlist when you
                        leave. Plays music-secret → -2 → loop; add more by
                        extending SECRET_MUSIC_FILES in audio.js. Missing ones
                        are skipped.

  footstep-grass-1.mp3 … footstep-grass-5.mp3   Steps on grass (open hub).
  footstep-stone-1.mp3 … footstep-stone-5.mp3   Steps inside the buildings.
  footstep-glass-1.mp3 … footstep-glass-5.mp3   Steps on the bridge decks.
                        5 variations per surface; one is chosen at random each
                        step (no immediate repeat) and slightly pitch-varied, so
                        footsteps don't sound repetitive. Single steps, trimmed
                        tight. (The old footstep-grass.mp3 / footstep-hard.mp3
                        are no longer used — safe to delete.)

  chime.mp3             Short "magic" sparkle — plays when a kiosk (or Max's
                        greeting) opens.
  switch-on.mp3         Layered under the chime on kiosk open for a richer pop.
  whoosh.mp3            Plays on a launch-pad teleport (secret level).
  max-hello.mp3         Gentle "hello" from Max, played once on first entry.
                        (Not added yet — the greeting is wired but silent until
                        this file exists.)

Tips: footsteps as mono ~128 kbps; trim leading silence so they're tight to
the footfall. Ambience/music can be stereo and should loop seamlessly (if not,
ask and we can crossfade-loop them in code). Volumes are tuned in audio.js (VOL).
