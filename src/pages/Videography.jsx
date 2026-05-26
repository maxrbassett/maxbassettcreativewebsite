import { Link } from 'react-router-dom'
import './Videography.css'

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
    // image: '/trailersThumbnail.png',
    youtubeId: 'cHsNJwXd2r4',
  },
  {
    to: '/social-short-form',
    label: 'Social & Short Form',
    // image: '/socialThumbnail.png',
    youtubeId: 'b_ORalcozsU',
  },
  {
    to: '/narrative-documentary',
    label: 'Narrative & Documentary',
    // image: '/narrativeThumbnail.png',
    youtubeId: '4rte6B5TyT0',
  },
  {
    to: '/ai',
    label: 'AI',
    image: '/aiThumbnail.png',
    // youtubeId: 'TQgcGvrH9lE',
  },
]

function CategoryCard({ to, label, image, youtubeId }) {
  // To switch back to YouTube thumbnails, replace the `src` below with:
  // src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`} (or src={image} to use custom images) and make sure to pass the `youtubeId` field in the categories array above.
  // and update the function signature to accept { to, label, youtubeId }
  return (
    <Link to={to} className="category-card">
      <img src={image ? image : `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`} alt={label} className="category-card__img" loading="lazy" />
      <div className="category-card__overlay">
        <span className="category-card__label">{label}</span>
        <span className="category-card__arrow">→</span>
      </div>
    </Link>
  )
}

export default function Videography() {
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
          <Link to="/contact" className="home__cta">Get in Touch</Link>
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
