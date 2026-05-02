import VideoGrid from '../components/VideoGrid'
import { trailersPromos } from '../data/videos'
import '../styles/VideoPage.css'

export default function TrailersPromos() {
  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">Trailers <span>&</span> Promos</h1>
        <div className="accent-line" />
        <p className="page-subtitle">Cinematic cuts built to captivate</p>
      </header>
      <VideoGrid videos={trailersPromos} />
    </div>
  )
}
