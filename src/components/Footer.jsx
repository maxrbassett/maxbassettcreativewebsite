import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <span className="footer__name">MAX BASSETT CREATIVE</span>
        <span className="footer__copy">© {new Date().getFullYear()} All rights reserved.</span>
      </div>
    </footer>
  )
}
