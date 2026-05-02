import './About.css'

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
          {/*
            Replace the placeholder div below with:
            <img src="/your-photo.jpg" alt="Max Bassett" className="about__photo" />
            Place your image in the /public folder of the project.
          */}
          <div className="about__photo-placeholder">
            <span>Your Photo Here</span>
          </div>
        </div>

        {/* Bio */}
        <div className="about__bio">
          <h2 className="about__name">Max Bassett</h2>
          <p className="about__text">
            {/*
              Replace this placeholder text with your own bio.
              Keep it 2–4 sentences — short and punchy works best on a portfolio.
            */}
            I'm a filmmaker and video editor based in [Your City]. I create
            everything from high-energy trailers and promo reels to intimate
            documentary films and social content — and lately, I've been pushing
            into the world of AI-generated cinema.
          </p>
          <p className="about__text">
            With a background in [your background], I bring both technical
            precision and a genuine love of storytelling to every project.
          </p>
          <a href="/contact" className="about__cta">
            Get in Touch <span>→</span>
          </a>
        </div>
      </div>
    </div>
  )
}
