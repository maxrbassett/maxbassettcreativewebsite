import { useState } from 'react'
import './VideoCard.css'

// YouTube generates several thumbnail sizes. We try maxresdefault first,
// then fall back to hqdefault if it doesn't exist.
function getThumbnailUrl(youtubeId, quality = 'maxresdefault') {
  return `https://img.youtube.com/vi/${youtubeId}/${quality}.jpg`
}

export default function VideoCard({ youtubeId, title, description }) {
  const [playing, setPlaying] = useState(false)
  const [imgSrc, setImgSrc] = useState(getThumbnailUrl(youtubeId, 'hqdefault'))

  const handleImgError = () => {
    // Fall back to hqdefault (always exists for every YouTube video)
    setImgSrc(getThumbnailUrl(youtubeId, 'hqdefault'))
  }

  return (
    <div className="video-card">
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
              src={imgSrc}
              alt={title}
              loading="lazy"
              onError={handleImgError}
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
