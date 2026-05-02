import VideoGrid from '../components/VideoGrid'
import { narrativeDocumentary } from '../data/videos'
import '../styles/VideoPage.css'

export default function NarrativeDocumentary() {
  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">Narrative <span>&</span> Documentary</h1>
        <div className="accent-line" />
        <p className="page-subtitle">Long-form stories told with intention</p>
      </header>
      <VideoGrid videos={narrativeDocumentary} />
    </div>
  )
}
