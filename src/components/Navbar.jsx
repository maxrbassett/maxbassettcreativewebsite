import { useState, useEffect } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'
import './Navbar.css'

const videoNavLinks = [
  { to: '/trailers-promos', label: 'Trailers & Promos' },
  { to: '/social-short-form', label: 'Social & Short Form' },
  { to: '/narrative-documentary', label: 'Narrative & Documentary' },
  { to: '/ai', label: 'AI' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

const devNavLinks = [
  { to: '/software-dev', label: 'Work' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

// Routes that belong to the videography "section" of the site.
const videoRoutes = [
  '/videography',
  '/trailers-promos',
  '/social-short-form',
  '/narrative-documentary',
  '/ai',
]

function isVideoSection(pathname) {
  return videoRoutes.some(
    (r) => pathname === r || pathname.startsWith(r + '/')
  )
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark'
  return (
    <button
      type="button"
      className="navbar__theme-toggle"
      onClick={onToggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const { theme, toggle: toggleTheme } = useTheme()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  const handleNavClick = () => setMenuOpen(false)

  const inVideoSection = isVideoSection(location.pathname)
  const navLinks = inVideoSection ? videoNavLinks : devNavLinks
  const logoHome = inVideoSection ? '/videography' : '/'

  return (
    <header className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__inner">
        {/* Logo */}
        <Link to={logoHome} className="navbar__logo" onClick={handleNavClick}>
          <img
            src={theme === 'dark' ? '/logo-dark.png' : '/logo.png'}
            alt="Max Bassett Creative"
            className="navbar__logo-img"
          />
        </Link>

        <div className="navbar__right">
          {/* Desktop nav */}
          <nav className="navbar__links">
            {navLinks.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/software-dev'}
                className={({ isActive }) =>
                  `navbar__link ${isActive ? 'navbar__link--active' : ''}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* 3D world entry point (always visible) */}
          <Link to="/explore" className="navbar__explore" onClick={handleNavClick}>
            3D Experience
          </Link>

          {/* Theme toggle (always visible) */}
          <ThemeToggle theme={theme} onToggle={toggleTheme} />

          {/* Mobile hamburger */}
          <button
            className={`navbar__hamburger ${menuOpen ? 'navbar__hamburger--open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`navbar__mobile-menu ${menuOpen ? 'navbar__mobile-menu--open' : ''}`}>
        {navLinks.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/software-dev'}
            className={({ isActive }) =>
              `navbar__mobile-link ${isActive ? 'navbar__mobile-link--active' : ''}`
            }
            onClick={handleNavClick}
          >
            {link.label}
          </NavLink>
        ))}
        <Link to="/explore" className="navbar__mobile-explore" onClick={handleNavClick}>
          3D Experience
        </Link>
      </div>
    </header>
  )
}
