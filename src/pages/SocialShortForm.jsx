import VideoGrid from '../components/VideoGrid'
import { socialShortForm } from '../data/videos'
import '../styles/VideoPage.css'

export default function SocialShortForm() {
  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">Social <span>&</span> Short Form</h1>
        <div className="accent-line" />
        <p className="page-subtitle">Scroll-stopping content for social platforms</p>
      </header>
      <VideoGrid videos={socialShortForm} />
    </div>
  )
}
