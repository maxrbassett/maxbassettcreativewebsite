import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useExplore } from './useExplore'
import { INTERACTABLES } from './interactables'

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

function ProjectPanel({ project, onClose }) {
  return (
    <div className="explore-panel-backdrop" onClick={onClose}>
      <div className="explore-panel" onClick={(e) => e.stopPropagation()}>
        <button className="explore-panel__close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <div className="explore-panel__img">
          <img src={project.image} alt={project.title} />
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
              Visit site →
            </a>
          )}
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

  // Prompt verb: NPC = "talk to", screens = "view".
  const nearbyType = nearby ? INTERACTABLES.find((i) => i.id === nearby.id)?.type : null

  return (
    <>
      {nearby && !active && (
        isTouch ? (
          <button className="explore-interact" onClick={interact}>
            {nearbyType === 'npc' ? 'Talk' : 'View'}<br />
            <span>{nearby.title}</span>
          </button>
        ) : (
          <div className="explore-prompt">
            Press <kbd>E</kbd> to {nearbyType === 'npc' ? 'talk to' : 'view'}{' '}
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
        ) : (
          <ProjectPanel project={active.project} onClose={close} />
        ))}
    </>
  )
}
