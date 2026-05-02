import VideoCard from './VideoCard'
import './VideoGrid.css'

export default function VideoGrid({ videos }) {
  if (!videos || videos.length === 0) {
    return (
      <p className="video-grid__empty">No videos yet — check back soon.</p>
    )
  }

  return (
    <div className="video-grid">
      {videos.map(video => (
        <VideoCard
          key={video.id}
          youtubeId={video.youtubeId}
          title={video.title}
          description={video.description}
        />
      ))}
    </div>
  )
}
