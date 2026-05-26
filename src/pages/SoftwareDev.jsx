import { Link } from 'react-router-dom'
import { projects, internalToolsBlurb } from '../data/projects'
import './SoftwareDev.css'

function ProjectCard({ slug, title, image, role }) {
  return (
    <Link to={`/software-dev/${slug}`} className="project-card">
      <div className="project-card__img-wrap">
        <img
          src={image}
          alt={title}
          className="project-card__img"
          loading="lazy"
          onError={(e) => {
            // Fallback if screenshot hasn't been added yet
            e.currentTarget.style.display = 'none'
          }}
        />
        <div className="project-card__placeholder" aria-hidden="true">
          {title}
        </div>
      </div>
      <div className="project-card__meta">
        <span className="project-card__title">{title}</span>
        {role && <span className="project-card__role">{role}</span>}
        <span className="project-card__arrow">View Case →</span>
      </div>
    </Link>
  )
}

export default function SoftwareDev() {
  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">Full-Stack <span>Development</span></h1>
        <div className="accent-line" />
        <p className="page-subtitle">Selected web projects</p>
      </header>

      <div className="projects-grid">
        {projects.map((p) => (
          <ProjectCard key={p.slug} {...p} />
        ))}
      </div>

      <section className="internal-tools">
        <h2 className="internal-tools__heading">Internal Tools</h2>
        <div className="accent-line" />
        <p className="internal-tools__text">{internalToolsBlurb}</p>
      </section>
    </div>
  )
}
