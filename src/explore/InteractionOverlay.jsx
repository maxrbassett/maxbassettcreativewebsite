import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useExplore } from './useExplore'
import { INTERACTABLES } from './interactables'
import { makePosterDataURL } from './screenPoster'
import { TREATS, pickTreat } from './vending'
import { newDeck } from './matching'
import { WARDROBE, DEFAULT_OUTFIT, randomOutfit, DressUpBear } from './DressUpBear'
import { RacingPanel } from './RacingGame'
import { audio } from './audio'

function AboutPanel({ about, onClose }) {
  return (
    <div className="explore-panel-backdrop" onClick={onClose}>
      <div className="explore-panel" onClick={(e) => e.stopPropagation()}>
        <button className="explore-panel__close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <div className="explore-panel__img">
          <img src={about.photo} alt={about.name} />
        </div>
        <div className="explore-panel__body">
          <h2 className="explore-panel__title">{about.name}</h2>
          {about.paragraphs.map((p, i) => (
            <p key={i} className="explore-panel__desc">{p}</p>
          ))}
          <h3 className="explore-panel__subhead">Get in Touch</h3>
          <p className="explore-panel__desc">{about.contactText}</p>
          <Link className="explore-panel__link" to="/contact">Open the contact form →</Link>
        </div>
      </div>
    </div>
  )
}

function VideoPlayerPanel({ video, onClose }) {
  return (
    <div className="explore-panel-backdrop" onClick={onClose}>
      <div
        className="explore-panel explore-panel--video"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="explore-panel__close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <div className="explore-panel__body">
          <h2 className="explore-panel__title">{video.title}</h2>
          <div className="explore-video-embed">
            <iframe
              src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1`}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function InternalToolPanel({ tool, onClose }) {
  return (
    <div className="explore-panel-backdrop" onClick={onClose}>
      <div className="explore-panel" onClick={(e) => e.stopPropagation()}>
        <button className="explore-panel__close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <div className="explore-panel__body">
          <p className="explore-panel__eyebrow">Internal Tool</p>
          <h2 className="explore-panel__title">{tool.title}</h2>
          {tool.role && <p className="explore-panel__role">{tool.role}</p>}
          {tool.stack?.length > 0 && (
            <div className="explore-panel__stack">
              {tool.stack.map((s) => (
                <span key={s} className="explore-panel__chip">{s}</span>
              ))}
            </div>
          )}
          {tool.problem && (
            <>
              <h3 className="explore-panel__subhead">Problem</h3>
              <p className="explore-panel__desc">{tool.problem}</p>
            </>
          )}
          {tool.approach && (
            <>
              <h3 className="explore-panel__subhead">Approach</h3>
              <p className="explore-panel__desc">{tool.approach}</p>
            </>
          )}
          {tool.impact?.length > 0 && (
            <>
              <h3 className="explore-panel__subhead">Impact</h3>
              <ul className="explore-panel__impact">
                {tool.impact.map((x, i) => <li key={i}>{x}</li>)}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function ManagementPanel({ item, onClose }) {
  return (
    <div className="explore-panel-backdrop" onClick={onClose}>
      <div className="explore-panel" onClick={(e) => e.stopPropagation()}>
        <button className="explore-panel__close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <div className="explore-panel__body">
          <p className="explore-panel__eyebrow">Leadership</p>
          <h2 className="explore-panel__title">{item.title}</h2>
          {item.role && <p className="explore-panel__role">{item.role}</p>}
          {item.summary && <p className="explore-panel__desc">{item.summary}</p>}
          {item.highlights?.length > 0 && (
            <ul className="explore-panel__impact">
              {item.highlights.map((x, i) => <li key={i}>{x}</li>)}
            </ul>
          )}
          {item.stack?.length > 0 && (
            <div className="explore-panel__stack">
              {item.stack.map((s) => (
                <span key={s} className="explore-panel__chip">{s}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ProjectPanel({ project, posterKey, onClose }) {
  // The same generated poster the in-world TV shows (keyed to match it exactly).
  // Used when a project has no screenshot, and as a fallback if its image 404s.
  const poster = useMemo(
    () => makePosterDataURL({ key: posterKey, title: project.title, eyebrow: 'Project' }),
    [posterKey, project.title]
  )
  const [imgSrc, setImgSrc] = useState(project.image || poster)
  useEffect(() => setImgSrc(project.image || poster), [project, poster])
  return (
    <div className="explore-panel-backdrop" onClick={onClose}>
      <div className="explore-panel" onClick={(e) => e.stopPropagation()}>
        <button className="explore-panel__close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <div className="explore-panel__img">
          <img
            src={imgSrc}
            alt={project.title}
            onError={() => imgSrc !== poster && setImgSrc(poster)}
          />
        </div>
        <div className="explore-panel__body">
          <h2 className="explore-panel__title">{project.title}</h2>
          {project.role && <p className="explore-panel__role">{project.role}</p>}
          {project.stack?.length > 0 && (
            <div className="explore-panel__stack">
              {project.stack.map((s) => (
                <span key={s} className="explore-panel__chip">{s}</span>
              ))}
            </div>
          )}
          <p className="explore-panel__desc">{project.description}</p>
          {project.url && (
            <a
              className="explore-panel__link"
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {/github\.com/.test(project.url) ? 'View on GitHub →' : 'Visit site →'}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

/* The Treat-O-Matic giveaway game. A little gacha: hit DISPENSE, the window
 * shuffles through treats, then lands on a random toy or candy that drops into
 * your haul. Every pull is a win — the meta-goal is to collect all of them. The
 * collection persists in localStorage so progress carries across visits. */
const TREATS_KEY = 'explore-treats'
const loadCollected = () => {
  try {
    return JSON.parse(localStorage.getItem(TREATS_KEY)) || {}
  } catch {
    return {}
  }
}

function VendingMachinePanel({ onClose }) {
  const [collected, setCollected] = useState(loadCollected)
  const [phase, setPhase] = useState('idle') // idle | rolling | reveal
  const [result, setResult] = useState(null)
  const [spinEmoji, setSpinEmoji] = useState('🎁')
  const [tray, setTray] = useState([]) // recent haul, newest first (this session)
  const timers = useRef([])
  const spinInterval = useRef(null)

  // Clear any pending timers when the panel unmounts (walk away / close).
  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout)
      clearInterval(spinInterval.current)
    },
    []
  )

  const uniqueCount = Object.keys(collected).filter((k) => collected[k] > 0).length
  const complete = uniqueCount >= TREATS.length

  const dispense = () => {
    if (phase === 'rolling') return
    setPhase('rolling')
    setResult(null)
    audio.playChime() // satisfying ka-chunk as it works

    // Shuffle the window through random treats for suspense.
    spinInterval.current = setInterval(() => {
      setSpinEmoji(TREATS[Math.floor(Math.random() * TREATS.length)].emoji)
    }, 80)

    const stop = setTimeout(() => {
      clearInterval(spinInterval.current)
      const won = pickTreat(Math.random())
      setResult(won)
      setSpinEmoji(won.emoji)
      setPhase('reveal')
      audio.playChime() // the "clunk" as it drops into the tray
      setCollected((prev) => {
        const next = { ...prev, [won.id]: (prev[won.id] || 0) + 1 }
        try {
          localStorage.setItem(TREATS_KEY, JSON.stringify(next))
        } catch {
          /* storage may be unavailable; the game still works in-session */
        }
        return next
      })
      setTray((prev) => [won, ...prev].slice(0, 8))
    }, 1150)
    timers.current.push(stop)
  }

  return (
    <div className="explore-panel-backdrop" onClick={onClose}>
      <div className="explore-vm" onClick={(e) => e.stopPropagation()}>
        <button className="explore-panel__close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className="explore-vm__marquee">TREAT-O-MATIC</div>
        <p className="explore-vm__tagline">Free toys &amp; candy — pull as many as you like!</p>

        {/* Display window: idle invites a pull, rolling shuffles, reveal shows the prize. */}
        <div className={`explore-vm__window explore-vm__window--${phase}`}>
          {phase === 'reveal' && result ? (
            <>
              <div className={`explore-vm__prize${result.kind === 'toy' ? ' explore-vm__prize--rare' : ''}`}>
                {result.emoji}
              </div>
              <div className="explore-vm__prize-name">{result.name}</div>
              <div className="explore-vm__prize-tag">
                {result.kind === 'toy' ? '✨ Rare toy!' : '🍬 Sweet treat'}
              </div>
            </>
          ) : phase === 'rolling' ? (
            <div className="explore-vm__prize explore-vm__prize--spin">{spinEmoji}</div>
          ) : (
            <div className="explore-vm__idle">🎁</div>
          )}
        </div>

        <button className="explore-vm__lever" onClick={dispense} disabled={phase === 'rolling'}>
          {phase === 'rolling' ? 'Dispensing…' : phase === 'reveal' ? 'Pull again' : 'Pull the lever'}
        </button>

        {/* Collection progress */}
        <div className="explore-vm__progress">
          <div className="explore-vm__progress-bar">
            <span style={{ width: `${(uniqueCount / TREATS.length) * 100}%` }} />
          </div>
          <span className="explore-vm__progress-label">
            {complete ? '🎉 Full set collected!' : `Collected ${uniqueCount} / ${TREATS.length} treats`}
          </span>
        </div>

        {/* Recent haul (this session) */}
        {tray.length > 0 && (
          <div className="explore-vm__tray" aria-label="Your haul">
            {tray.map((t, i) => (
              <span key={i} className="explore-vm__tray-item" title={t.name}>
                {t.emoji}
              </span>
            ))}
          </div>
        )}

        {/* Prize index — fills in as you discover each treat. */}
        <h3 className="explore-vm__index-head">Prize Index</h3>
        <div className="explore-vm__index">
          {TREATS.map((t) => {
            const n = collected[t.id] || 0
            const found = n > 0
            return (
              <div
                key={t.id}
                className={`explore-vm__slot${found ? ' is-found' : ''}${
                  found && t.kind === 'toy' ? ' is-rare' : ''
                }`}
                title={found ? t.name : 'Undiscovered'}
              >
                <span className="explore-vm__slot-emoji">{found ? t.emoji : '?'}</span>
                {n > 1 && <span className="explore-vm__slot-count">×{n}</span>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* Memory Match — a classic concentration game. Flip two cards: a pair stays
 * face-up, a miss flips back. Clear the 4×4 board in as few moves as possible;
 * each board's best score persists in localStorage under its own key. `game`
 * supplies the symbol set + theme colors (see MATCHING_GAMES). */
const matchBestKey = (gameId) => `explore-match-best-${gameId}`
const loadBest = (gameId) => {
  const n = Number(localStorage.getItem(matchBestKey(gameId)))
  return Number.isFinite(n) && n > 0 ? n : null
}

function MatchingGamePanel({ game, onClose }) {
  const pairCount = game.symbols.length
  const [deck, setDeck] = useState(() => newDeck(game.symbols))
  const [flipped, setFlipped] = useState([]) // indices currently face-up (0–2)
  const [matched, setMatched] = useState(0) // pairs found
  const [moves, setMoves] = useState(0)
  const [locked, setLocked] = useState(false) // input frozen during a mismatch flip-back
  const [best, setBest] = useState(() => loadBest(game.id))
  const timer = useRef(null)

  const won = matched === pairCount

  useEffect(() => () => clearTimeout(timer.current), [])

  // Record the best (fewest-moves) completion once the board is cleared. By the
  // time `won` flips true the final move is already committed, so `moves` is the
  // finished score. No more flips happen after a win, so `moves` won't change.
  useEffect(() => {
    if (!won) return
    setBest((b) => {
      if (b == null || moves < b) {
        try {
          localStorage.setItem(matchBestKey(game.id), String(moves))
        } catch {
          /* storage may be unavailable */
        }
        return moves
      }
      return b
    })
  }, [won, moves, game.id])

  const reset = () => {
    clearTimeout(timer.current)
    setDeck(newDeck(game.symbols))
    setFlipped([])
    setMatched(0)
    setMoves(0)
    setLocked(false)
  }

  const flip = (idx) => {
    if (locked || won) return
    if (flipped.includes(idx) || deck[idx].matched) return

    if (flipped.length === 0) {
      setFlipped([idx])
      return
    }
    // Second card → resolve this turn. Lock input until it resolves so a fast
    // third click can't start a turn mid-animation.
    const first = flipped[0]
    setFlipped([first, idx])
    setMoves((m) => m + 1)
    setLocked(true)

    if (deck[first].symbol === deck[idx].symbol) {
      // Match — lock the pair in. (The win/best-score check is handled by the
      // `won` effect above once `matched` reaches the full count.)
      audio.playChime()
      timer.current = setTimeout(() => {
        setDeck((d) => d.map((c, i) => (i === first || i === idx ? { ...c, matched: true } : c)))
        setFlipped([])
        setMatched((n) => n + 1)
        setLocked(false)
      }, 360)
    } else {
      // Miss — flip both back after a beat.
      timer.current = setTimeout(() => {
        setFlipped([])
        setLocked(false)
      }, 850)
    }
  }

  const themeStyle = {
    '--mm-top': game.panel.top,
    '--mm-bottom': game.panel.bottom,
    '--mm-deep': game.panel.deep,
    '--mm-accent': game.panel.accent,
    '--mm-btn-text': game.panel.btnText,
  }

  return (
    <div className="explore-panel-backdrop" onClick={onClose}>
      <div className="explore-mm" style={themeStyle} onClick={(e) => e.stopPropagation()}>
        <button className="explore-panel__close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className="explore-mm__marquee">{game.marquee}</div>
        <p className="explore-mm__tagline">Find every pair in as few moves as you can!</p>

        <div className="explore-mm__stats">
          <span>Moves: <strong>{moves}</strong></span>
          <span>Pairs: <strong>{matched}/{pairCount}</strong></span>
          <span>Best: <strong>{best ?? '—'}</strong></span>
        </div>

        <div className="explore-mm__board">
          {deck.map((card, idx) => {
            const shown = card.matched || flipped.includes(idx)
            return (
              <button
                key={card.key}
                className={`explore-mm__card${shown ? ' is-shown' : ''}${card.matched ? ' is-matched' : ''}`}
                onClick={() => flip(idx)}
                aria-label={shown ? card.symbol : 'Hidden card'}
              >
                <span className="explore-mm__inner">
                  <span className="explore-mm__face explore-mm__face--back">★</span>
                  <span className="explore-mm__face explore-mm__face--front">{card.symbol}</span>
                </span>
              </button>
            )
          })}
        </div>

        {won && (
          <div className="explore-mm__win">
            🎉 Cleared in {moves} moves!
            {best === moves && <span> — new best!</span>}
          </div>
        )}

        <button className="explore-mm__btn" onClick={reset}>
          {won ? 'Play again' : 'Shuffle & restart'}
        </button>
      </div>
    </div>
  )
}

/* Dress the Bear — a dress-up boutique. Pick a hat, eyewear, shirt, scarf,
 * pants, and shoes; the bear (a layered SVG) updates live. The outfit persists
 * in localStorage so the bear keeps its look across visits. */
const OUTFIT_KEY = 'explore-bear-outfit'
const BARE_OUTFIT = Object.fromEntries(WARDROBE.map((c) => [c.slot, 'none']))
const loadOutfit = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(OUTFIT_KEY))
    // Merge over defaults so any newly-added slot still has a valid value.
    return saved ? { ...DEFAULT_OUTFIT, ...saved } : { ...DEFAULT_OUTFIT }
  } catch {
    return { ...DEFAULT_OUTFIT }
  }
}

function DressUpPanel({ onClose }) {
  const [outfit, setOutfit] = useState(loadOutfit)

  const persist = (next) => {
    setOutfit(next)
    try {
      localStorage.setItem(OUTFIT_KEY, JSON.stringify(next))
    } catch {
      /* storage may be unavailable; the look still applies in-session */
    }
  }
  const setSlot = (slot, id) => {
    persist({ ...outfit, [slot]: id })
    audio.playChime()
  }
  const surprise = () => {
    persist(randomOutfit())
    audio.playChime()
  }
  const bare = () => persist({ ...BARE_OUTFIT })

  return (
    <div className="explore-panel-backdrop" onClick={onClose}>
      <div className="explore-du" onClick={(e) => e.stopPropagation()}>
        <button className="explore-panel__close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className="explore-du__marquee">BEAR BOUTIQUE</div>
        <p className="explore-du__tagline">Dress the bear — mix and match!</p>

        <div className="explore-du__stage">
          <div className="explore-du__bear">
            <DressUpBear outfit={outfit} />
          </div>
        </div>

        <div className="explore-du__actions">
          <button className="explore-du__action" onClick={surprise}>🎲 Surprise me</button>
          <button className="explore-du__action explore-du__action--ghost" onClick={bare}>Undress</button>
        </div>

        <div className="explore-du__rows">
          {WARDROBE.map((cat) => (
            <div className="explore-du__row" key={cat.slot}>
              <span className="explore-du__cat">{cat.label}</span>
              <div className="explore-du__opts">
                {cat.options.map((opt) => (
                  <button
                    key={opt.id}
                    className={`explore-du__opt${outfit[cat.slot] === opt.id ? ' is-active' : ''}`}
                    onClick={() => setSlot(cat.slot, opt.id)}
                    title={opt.label}
                  >
                    <span className="explore-du__opt-emoji">{opt.emoji}</span>
                    <span className="explore-du__opt-label">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function InteractionOverlay({ isTouch }) {
  const nearby = useExplore((s) => s.nearby)
  const active = useExplore((s) => s.active)
  const open = useExplore((s) => s.open)
  const close = useExplore((s) => s.close)

  const interact = () => {
    const st = useExplore.getState()
    const cur = st.nearby
    if (!cur) return
    const it = INTERACTABLES.find((i) => i.id === cur.id)
    if (it) st.open(it)
  }

  // Desktop keys: E opens the nearby thing OR advances NPC dialogue (the NPC's
  // speech bubble lives in <Npc>); Esc closes.
  useEffect(() => {
    const onKey = (e) => {
      const st = useExplore.getState()
      const a = st.active
      if (e.key === 'Escape' && a) {
        st.close()
      } else if (e.key === 'e' || e.key === 'E') {
        if (a?.type === 'npc') st.advanceDialogue()
        else if (!a) interact()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Prompt verb: NPC = "talk to", games = "play", screens = "view".
  const nearbyType = nearby ? INTERACTABLES.find((i) => i.id === nearby.id)?.type : null
  const isGame =
    nearbyType === 'vending' || nearbyType === 'matching' || nearbyType === 'dressup' || nearbyType === 'racing'
  const verb = nearbyType === 'npc' ? 'talk to' : isGame ? 'play' : 'view'
  const verbShort = nearbyType === 'npc' ? 'Talk' : isGame ? 'Play' : 'View'

  return (
    <>
      {nearby && !active && (
        isTouch ? (
          <button className="explore-interact" onClick={interact}>
            {verbShort}<br />
            <span>{nearby.title}</span>
          </button>
        ) : (
          <div className="explore-prompt">
            Press <kbd>E</kbd> to {verb}{' '}
            <strong>{nearby.title}</strong>
          </div>
        )
      )}
      {/* NPC dialogue renders as a 3D-anchored speech bubble in <Npc>. */}
      {active && active.type !== 'npc' &&
        (active.type === 'video' ? (
          <VideoPlayerPanel video={active.video} onClose={close} />
        ) : active.type === 'about' ? (
          <AboutPanel about={active.about} onClose={close} />
        ) : active.type === 'internal' ? (
          <InternalToolPanel tool={active.internal} onClose={close} />
        ) : active.type === 'management' ? (
          <ManagementPanel item={active.management} onClose={close} />
        ) : active.type === 'vending' ? (
          <VendingMachinePanel onClose={close} />
        ) : active.type === 'matching' ? (
          <MatchingGamePanel game={active.game} onClose={close} />
        ) : active.type === 'dressup' ? (
          <DressUpPanel onClose={close} />
        ) : active.type === 'racing' ? (
          <RacingPanel onClose={close} />
        ) : (
          <ProjectPanel project={active.project} posterKey={active.id} onClose={close} />
        ))}
    </>
  )
}
