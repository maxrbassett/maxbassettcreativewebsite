import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useExplore } from './useExplore'
import { INTERACTABLES } from './interactables'
import VideoGrid from '../components/VideoGrid'

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

function VideoPanel({ category, onClose }) {
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
          <h2 className="explore-panel__title">{category.label}</h2>
          <VideoGrid videos={category.videos} vertical={category.vertical} />
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
    const cur = useExplore.getState().nearby
    if (!cur) return
    const it = INTERACTABLES.find((i) => i.id === cur.id)
    if (it) open(it)
  }

  // Desktop: E to open the nearby kiosk, Esc to close an open panel.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && useExplore.getState().active) {
        close()
      } else if ((e.key === 'e' || e.key === 'E') && !useExplore.getState().active) {
        interact()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      {nearby && !active && (
        isTouch ? (
          <button className="explore-interact" onClick={interact}>
            View<br />
            <span>{nearby.title}</span>
          </button>
        ) : (
          <div className="explore-prompt">
            Press <kbd>E</kbd> to view <strong>{nearby.title}</strong>
          </div>
        )
      )}
      {active &&
        (active.type === 'videoCategory' ? (
          <VideoPanel category={active.category} onClose={close} />
        ) : active.type === 'about' ? (
          <AboutPanel about={active.about} onClose={close} />
        ) : (
          <ProjectPanel project={active.project} onClose={close} />
        ))}
    </>
  )
}
