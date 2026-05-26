import { useState } from 'react'
import './Contact.css'

// Your Formspree endpoint — already set to your form URL
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/maqvnpgn'

export default function Contact() {
  const [status, setStatus] = useState('idle') // idle | sending | success | error
  const [form, setForm] = useState({ name: '', email: '', message: '' })

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('sending')

    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(form),
      })

      if (res.ok) {
        setStatus('success')
        setForm({ name: '', email: '', message: '' })
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">Get in <span>Touch</span></h1>
        <div className="accent-line" />
        <p className="page-subtitle">Let's build something together</p>
      </header>

      <div className="contact__layout">
        <div className="contact__intro">
          <p className="contact__text">
            Have a project in mind? Whether it's a website, a web app, an
            internal tool, or a video project — I'd love to hear about it.
          </p>
          <p className="contact__email-label">Or reach me directly at</p>
          {/*
            Email is rendered entirely via a CSS pseudo-element drawn from
            reversed data attributes. The actual address never appears in
            the DOM as text, and there is no "@" anywhere in the markup —
            so email-harvesting bots that scan HTML can't pick it up.
            Visitors see "maxrbassett@gmail.com" normally because the
            element uses RTL direction with unicode-bidi override.
          */}
          <span
            className="contact__email"
            data-user="ttessabrxam"
            data-domain="liamg"
            data-tld="moc"
          />
          <p className="contact__email-note">
            (please type the address manually — no copy/paste)
          </p>
        </div>

        <form className="contact__form" onSubmit={handleSubmit} noValidate>
          <div className="contact__field">
            <label className="contact__label" htmlFor="name">Name</label>
            <input
              id="name"
              name="name"
              type="text"
              className="contact__input"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="Your name"
            />
          </div>

          <div className="contact__field">
            <label className="contact__label" htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              className="contact__input"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="your@email.com"
            />
          </div>

          <div className="contact__field">
            <label className="contact__label" htmlFor="message">Message</label>
            <textarea
              id="message"
              name="message"
              className="contact__input contact__textarea"
              value={form.message}
              onChange={handleChange}
              required
              placeholder="Tell me about your project..."
              rows={6}
            />
          </div>

          <button
            type="submit"
            className="contact__submit"
            disabled={status === 'sending'}
          >
            {status === 'sending' ? 'Sending...' : 'Send Message'}
          </button>

          {status === 'success' && (
            <p className="contact__feedback contact__feedback--success">
              Message sent! I'll be in touch soon.
            </p>
          )}
          {status === 'error' && (
            <p className="contact__feedback contact__feedback--error">
              Something went wrong. Please try again or email me directly.
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
