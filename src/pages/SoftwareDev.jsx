import { useState, useMemo, useEffect } from 'react'
import { projects } from '../data/projects'
import { personalProjects } from '../data/personalProjects'
import { internalTools } from '../data/internalTools'
import { management } from '../data/management'
import { makePosterDataURL } from '../lib/poster'
import './SoftwareDev.css'

/* The Software Development page: one page, grouped into the same sections as the
 * 3D world (Public Web, Personal Projects, Internal Tools, Management). Each
 * item is a card; clicking opens a detail popup. Items without a screenshot use
 * the same generated poster their in-world TV shows (keyed to match exactly). */

const GROUPS = [
  {
    label: 'Public Web',
    kind: 'project',
    eyebrow: 'Project',
    items: projects.map((p) => ({ ...p, posterKey: p.slug })),
  },
  {
    label: 'Personal Projects',
    kind: 'project',
    eyebrow: 'Project',
    items: personalProjects.map((p) => ({ ...p, posterKey: `personal-${p.slug}` })),
  },
  {
    label: 'Internal Tools',
    kind: 'internal',
    eyebrow: 'Internal Tool',
    items: internalTools.map((t) => ({ ...t, posterKey: t.id })),
  },
  {
    label: 'Management',
    kind: 'management',
    eyebrow: 'Leadership',
    items: management.map((m) => ({ ...m, posterKey: m.id })),
  },
]

function Card({ item, kind, eyebrow, onOpen }) {
  // Generated poster: the card image for items with no screenshot, and the
  // fallback if a screenshot 404s.
  const poster = useMemo(
    () => makePosterDataURL({ key: item.posterKey, title: item.title, eyebrow }),
    [item.posterKey, item.title, eyebrow]
  )
  const [src, setSrc] = useState(item.image || poster)
  useEffect(() => setSrc(item.image || poster), [item.image, poster])

  return (
    <button
      type="button"
      className="project-card"
      onClick={() => onOpen({ item, kind, eyebrow, hero: src })}
    >
      <div className="project-card__img-wrap">
        <img
          src={src}
          alt={item.title}
          className="project-card__img"
          loading="lazy"
          onError={() => src !== poster && setSrc(poster)}
        />
      </div>
      <div className="project-card__meta">
        <span className="project-card__title">{item.title}</span>
        {item.role && <span className="project-card__role">{item.role}</span>}
        <span className="project-card__arrow">View Details →</span>
      </div>
    </button>
  )
}

function DevModal({ data, onClose }) {
  const { item, kind, eyebrow, hero } = data

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div className="dev-modal-backdrop" onClick={onClose}>
      <div className="dev-modal" onClick={(e) => e.stopPropagation()}>
        <button className="dev-modal__close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <div className="dev-modal__img">
          <img src={hero} alt={item.title} />
        </div>
        <div className="dev-modal__body">
          <p className="dev-modal__eyebrow">{eyebrow}</p>
          <h2 className="dev-modal__title">{item.title}</h2>
          {item.role && <p className="dev-modal__role">{item.role}</p>}
          {item.stack?.length > 0 && (
            <div className="dev-modal__stack">
              {item.stack.map((s) => (
                <span key={s} className="dev-modal__chip">{s}</span>
              ))}
            </div>
          )}

          {kind === 'project' && (
            <>
              {item.description && <p className="dev-modal__desc">{item.description}</p>}
              {item.url && (
                <a
                  className="dev-modal__link"
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {/github\.com/.test(item.url) ? 'View on GitHub →' : 'Visit site →'}
                </a>
              )}
            </>
          )}

          {kind === 'internal' && (
            <>
              {item.problem && (
                <>
                  <h3 className="dev-modal__subhead">Problem</h3>
                  <p className="dev-modal__desc">{item.problem}</p>
                </>
              )}
              {item.approach && (
                <>
                  <h3 className="dev-modal__subhead">Approach</h3>
                  <p className="dev-modal__desc">{item.approach}</p>
                </>
              )}
              {item.impact?.length > 0 && (
                <>
                  <h3 className="dev-modal__subhead">Impact</h3>
                  <ul className="dev-modal__impact">
                    {item.impact.map((x, i) => <li key={i}>{x}</li>)}
                  </ul>
                </>
              )}
            </>
          )}

          {kind === 'management' && (
            <>
              {item.summary && <p className="dev-modal__desc">{item.summary}</p>}
              {item.highlights?.length > 0 && (
                <ul className="dev-modal__impact">
                  {item.highlights.map((x, i) => <li key={i}>{x}</li>)}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SoftwareDev() {
  const [active, setActive] = useState(null)

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">Software <span>Development</span></h1>
        <div className="accent-line" />
        <p className="page-subtitle">Web projects, internal tools &amp; team leadership</p>
      </header>

      {GROUPS.map((g) => (
        <section key={g.label} className="dev-group">
          <div className="dev-group__head">
            <h2 className="dev-group__title">{g.label}</h2>
            <div className="accent-line" />
          </div>
          <div className="projects-grid">
            {g.items.map((item, i) => (
              <Card
                key={item.slug || item.id || i}
                item={item}
                kind={g.kind}
                eyebrow={g.eyebrow}
                onOpen={setActive}
              />
            ))}
          </div>
        </section>
      ))}

      {active && <DevModal data={active} onClose={() => setActive(null)} />}
    </div>
  )
}
