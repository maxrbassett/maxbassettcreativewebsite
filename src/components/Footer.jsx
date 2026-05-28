import { useTheme } from '../hooks/useTheme'
import './Footer.css'

export default function Footer() {
  const { theme } = useTheme()
  return (
    <footer className="footer">
      <div className="footer__inner">
        <img
          src={theme === 'dark' ? '/logo-dark.png' : '/logo.png'}
          alt="Max Bassett Creative"
          className="footer__logo"
        />
        <span className="footer__copy">© {new Date().getFullYear()} All rights reserved.</span>
      </div>
    </footer>
  )
}
