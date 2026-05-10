import { Link } from 'react-router-dom'
import './Home.css'

// TODO: Add in trailers for PMG and Netherlands conference.
// TODO: Add social media content.
// Each category card links to a page.
// Currently using custom images placed in the /public folder.
// To switch back to YouTube thumbnails, comment out the `image` field
// and uncomment the `youtubeId` field, then swap the CategoryCard
// img src back to the YouTube thumbnail URL (see comment in CategoryCard below).

const categories = [
  {
    to: '/trailers-promos',
    label: 'Trailers & Promos',
    image: '/trailersThumbnail.png',
    // youtubeId: 'REPLACE_WITH_VIDEO_ID',
  },
  {
    to: '/social-short-form',
    label: 'Social & Short Form',
    image: '/socialThumbnail.png',
    // youtubeId: 'REPLACE_WITH_VIDEO_ID',
  },
  {
    to: '/narrative-documentary',
    label: 'Narrative & Documentary',
    image: '/narrativeThumbnail.png',
    // youtubeId: 'REPLACE_WITH_VIDEO_ID',
  },
  {
    to: '/ai',
    label: 'AI',
    image: '/aiThumbnail.png',
    // youtubeId: 'REPLACE_WITH_VIDEO_ID',
  },
]

function CategoryCard({ to, label, image }) {
  // To switch back to YouTube thumbnails, replace the `src` below with:
  // src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`}
  // and update the function signature to accept { to, label, youtubeId }
  return (
    <Link to={to} className="category-card">
      <img src={image} alt={label} className="category-card__img" loading="lazy" />
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
