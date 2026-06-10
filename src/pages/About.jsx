import './About.css'
import maxProfile from '../assets/maxProfile2.jpg'

export default function About() {
  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">About <span>Me</span></h1>
        <div className="accent-line" />
      </header>

      <div className="about__layout">
        {/* Photo */}
        <div className="about__photo-wrap">
            <img src={maxProfile} alt="Max Bassett" className="about__photo" />
        </div>

        {/* Bio */}
        <div className="about__bio">
          <h2 className="about__name">Max Bassett</h2>
          {/*
            TODO (Max): Update the bio paragraphs below. Lead with software dev
            since that's the current focus; mention video work as a side
            practice. Keep it 2–4 sentences — short and punchy works best.
          */}
          <p className="about__text">
            I'm a software developer based in Lancaster, South Carolina. I build web apps,
            sites, and internal tools — combining clean engineering with
            careful attention to design and user experience. I currently work as a Senior Full-stack
            Developer at Chicago Venture Partners and assist in the software development for 
            their portfolio companies, including Typenex Medical, a medical device company supplying 
            hospitals, clinics, and surgery centers with the tools they need to provide better care. 
          </p>
          <p className="about__text">
            A side hobby of mine includes filmmaking and video editing, creating
            trailers, social content, documentary pieces, and AI-driven
            cinema. You can see that work in the{' '}
             <a href="/videography" style={{ color: 'var(--color-accent)' }}>
               videography section
             </a>. 
          </p> 
           <p className="about__text">
            I'm always interested in connecting with new people and learning about interesting projects. 
            If you'd like to chat, feel free to reach out!
          </p>
          <a href="/contact" className="about__cta">
            Get in Touch <span>→</span>
          </a>
        </div>
      </div>
    </div>
  )
}
