import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import SoftwareDev from './pages/SoftwareDev'
import Videography from './pages/Videography'
import About from './pages/About'
import Contact from './pages/Contact'

// Lazy-loaded so the entire three.js / R3F bundle only downloads when a
// visitor actually opens /explore — the normal site stays lightweight.
const ExplorePage = lazy(() => import('./explore/ExplorePage'))

export default function App() {
  return (
    <Router>
      <div className="app-shell">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<SoftwareDev />} />
            <Route path="/videography" element={<Videography />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route
              path="/explore"
              element={
                <Suspense fallback={<div className="explore-loading">Loading the world…</div>}>
                  <ExplorePage />
                </Suspense>
              }
            />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  )
}
