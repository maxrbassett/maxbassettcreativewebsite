import VideoGrid from '../components/VideoGrid'
import { aiVideos } from '../data/videos'
import '../styles/VideoPage.css'

export default function AI() {
  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">AI <span>Film</span></h1>
        <div className="accent-line" />
        <p className="page-subtitle">Exploring the frontier of AI-generated cinema</p>
      </header>
      <VideoGrid videos={aiVideos} />
    </div>
  )
}
