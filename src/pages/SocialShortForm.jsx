import VideoGrid from '../components/VideoGrid'
import { socialShortForm } from '../data/videos'
import './SocialShortForm.css'

export default function SocialShortForm() {
  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">Social <span>&</span> Short Form</h1>
        <div className="accent-line" />
        <p className="social-disclaimer">
          Portfolio demos — these previews were uploaded for display purposes.
        </p>
      </header>
      <VideoGrid videos={socialShortForm} vertical />
    </div>
  )
}
