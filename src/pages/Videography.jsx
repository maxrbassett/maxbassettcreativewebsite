import VideoGrid from '../components/VideoGrid'
import {
  trailersPromos,
  socialShortForm,
  narrativeDocumentary,
  aiVideos,
} from '../data/videos'
import './Videography.css'

/* One simple page: a header plus a section per category (matching the 3D
 * world's Videography rooms), each listing its videos. Social & Short Form
 * renders vertical (9:16). */
const SECTIONS = [
  { label: 'Trailers & Promos', videos: trailersPromos },
  { label: 'Social & Short Form', videos: socialShortForm, vertical: true },
  { label: 'Narrative & Documentary', videos: narrativeDocumentary },
  { label: 'AI', videos: aiVideos },
]

export default function Videography() {
  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">Video<span>graphy</span></h1>
        <div className="accent-line" />
        <p className="page-subtitle">Trailers, social, narrative &amp; AI films</p>
      </header>

      {SECTIONS.map((s) => (
        <section key={s.label} className="video-section">
          <div className="video-section__head">
            <h2 className="video-section__title">{s.label}</h2>
            <div className="accent-line" />
          </div>
          <VideoGrid videos={s.videos} vertical={s.vertical} />
        </section>
      ))}
    </div>
  )
}
