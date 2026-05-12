import { useState } from 'react'
import './VideoCard.css'

function getThumbnailUrl(youtubeId) {
  return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
}

export default function VideoCard({ youtubeId, title, description, vertical = false }) {
  const [playing, setPlaying] = useState(false)

  return (
    <div className={`video-card ${vertical ? 'video-card--vertical' : ''}`}>
      <div className="video-card__embed">
        {playing ? (
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            className="video-card__thumbnail"
            onClick={() => setPlaying(true)}
            aria-label={`Play ${title}`}
          >
            <img
              src={getThumbnailUrl(youtubeId)}
              alt={title}
              loading="lazy"
            />
            <div className="video-card__overlay">
              <div className="video-card__play-btn">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </button>
        )}
      </div>

      <div className="video-card__info">
        <h3 className="video-card__title">{title}</h3>
        {description && (
          <p className="video-card__description">{description}</p>
        )}
      </div>
    </div>
  )
}
