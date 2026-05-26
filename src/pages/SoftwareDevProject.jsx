import { useParams, Link } from 'react-router-dom'
import { projects } from '../data/projects'
import './SoftwareDev.css'

export default function SoftwareDevProject() {
  const { slug } = useParams()
  const project = projects.find((p) => p.slug === slug)

  if (!project) {
    return (
      <div className="project-detail">
        <Link to="/software-dev" className="project-detail__back">← All Work</Link>
        <p className="project-detail__not-found">Project not found.</p>
      </div>
    )
  }

  const { title, url, image, year, role, description, stack } = project

  return (
    <div className="project-detail">
      <Link to="/software-dev" className="project-detail__back">← All Work</Link>

      <div className="project-detail__hero">
        <div className="project-detail__hero-placeholder" aria-hidden="true">
          {title}
        </div>
        <img
          src={image}
          alt={title}
          className="project-detail__hero-img"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      </div>

      <div className="project-detail__layout">
        <div>
          <h1 className="project-detail__title">{title}</h1>
          <p className="project-detail__description">{description}</p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="project-detail__visit"
          >
            Visit Site <span>→</span>
          </a>
        </div>

        <aside className="project-detail__sidebar">
          {role && (
            <div className="project-detail__meta-block">
              <span className="project-detail__meta-label">Role</span>
              <span className="project-detail__meta-value">{role}</span>
            </div>
          )}
          {year && (
            <div className="project-detail__meta-block">
              <span className="project-detail__meta-label">Year</span>
              <span className="project-detail__meta-value">{year}</span>
            </div>
          )}
          {stack && stack.length > 0 && (
            <div className="project-detail__meta-block">
              <span className="project-detail__meta-label">Stack</span>
              <div className="project-detail__stack">
                {stack.map((tag) => (
                  <span key={tag} className="project-detail__stack-tag">{tag}</span>
                ))}
              </div>
            </div>
          )}
          <div className="project-detail__meta-block">
            <span className="project-detail__meta-label">Live URL</span>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="project-detail__meta-value"
              style={{ color: 'var(--color-accent)' }}
            >
              {url.replace(/^https?:\/\//, '')}
            </a>
          </div>
        </aside>
      </div>
    </div>
  )
}
