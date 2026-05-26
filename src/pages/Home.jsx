import { Link } from 'react-router-dom'
import { projects } from '../data/projects'
import './Home.css'

// TODO (Max): Tweak the hero eyebrow / headline copy below if you want
// different positioning. Current framing leans full-stack/web.

export default function Home() {
  // Show the first 4 projects as a preview on the landing.
  const featured = projects.slice(0, 4)

  return (
    <div className="home">
      {/* Hero */}
      <section className="home__hero">
        <div className="home__hero-inner">
          <p className="home__eyebrow">Software Developer · Web Developer</p>
          <h1 className="home__headline">
            MAX BASSETT<br />
            <span className="home__headline-accent">CREATIVE</span>
          </h1>
          <div className="accent-line" />
          <p className="home__tagline">
            I build fast, well-crafted websites and web tools for small
            businesses and growing teams.
          </p>
          <div className="home__cta-row">
            <Link to="/software-dev" className="home__cta">View Work</Link>
            <Link to="/contact" className="home__cta home__cta--ghost">Get in Touch</Link>
          </div>
        </div>
      </section>

      {/* Featured work preview */}
      <section className="home__work">
        <div className="home__work-inner">
          <div className="home__work-head">
            <p className="home__section-label">Selected Work</p>
            <Link to="/software-dev" className="home__work-all">All Work →</Link>
          </div>
          <div className="home__work-grid">
            {featured.map((p) => (
              <Link key={p.slug} to={`/software-dev/${p.slug}`} className="home__work-card">
                <div className="home__work-card-img-wrap">
                  <div className="home__work-card-placeholder" aria-hidden="true">
                    {p.title}
                  </div>
                  <img
                    src={p.image}
                    alt={p.title}
                    className="home__work-card-img"
                    loading="lazy"
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                </div>
                <span className="home__work-card-title">{p.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
