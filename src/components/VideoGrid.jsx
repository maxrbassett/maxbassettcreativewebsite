import VideoCard from './VideoCard'
import './VideoGrid.css'

export default function VideoGrid({ videos, vertical = false }) {
  if (!videos || videos.length === 0) {
    return (
      <div className="video-grid__construction">
        <div className="video-grid__construction-inner">
          <span className="video-grid__construction-icon">🎬</span>
          <h3 className="video-grid__construction-title">Page Under Construction</h3>
          <p className="video-grid__construction-text">Videos coming soon — check back shortly.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`video-grid ${vertical ? 'video-grid--vertical' : ''}`}>
      {videos.map(video => (
        <VideoCard
          key={video.id}
          youtubeId={video.youtubeId}
          title={video.title}
          description={video.description}
          vertical={vertical}
        />
      ))}
    </div>
  )
}
