import { Link } from 'react-router-dom'
import './Home.css'

// Each category card links to a page and shows a representative YouTube thumbnail.
// Replace the youtubeId values with a video from that category to use as the cover image.
const categories = [
  {
    to: '/trailers-promos',
    label: 'Trailers & Promos',
    youtubeId: 'dQw4w9WgXcQ', // ← Replace with a video ID from this category
  },
  {
    to: '/social-short-form',
    label: 'Social & Short Form',
    youtubeId: 'dQw4w9WgXcQ', // ← Replace with a video ID from this category
  },
  {
    to: '/narrative-documentary',
    label: 'Narrative & Documentary',
    youtubeId: 'dQw4w9WgXcQ', // ← Replace with a video ID from this category
  },
  {
    to: '/ai',
    label: 'AI',
    youtubeId: 'dQw4w9WgXcQ', // ← Replace with a video ID from this category
  },
]

function CategoryCard({ to, label, youtubeId }) {
  const thumb = `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`
  return (
    <Link to={to} className="category-card">
      <img src={thumb} alt={label} className="category-card__img" loading="lazy" />
      <div className="category-card__overlay">
        <span className="category-card__label">{label}</span>
        <span className="category-card__arrow">→</span>
      </div>
    </Link>
  )
}

export default function Home() {
  return (
    <div className="home">
      {/* Hero */}
      <section className="home__hero">
        <div className="home__hero-inner">
          <p className="home__eyebrow">Filmmaker · Editor · Creator</p>
          <h1 className="home__headline">
            MAX BASSETT<br />
            <span className="home__headline-accent">CREATIVE</span>
          </h1>
          <div className="accent-line" />
          <p className="home__tagline">
            Visual storytelling across every format — from trailers to AI films.
          </p>
        </div>
      </section>

      {/* Category grid */}
      <section className="home__categories">
        <div className="home__categories-inner">
          <p className="home__section-label">Browse by Category</p>
          <div className="home__grid">
            {categories.map(cat => (
              <CategoryCard key={cat.to} {...cat} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
