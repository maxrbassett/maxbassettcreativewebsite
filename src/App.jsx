import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Videography from './pages/Videography'
import TrailersPromos from './pages/TrailersPromos'
import SocialShortForm from './pages/SocialShortForm'
import NarrativeDocumentary from './pages/NarrativeDocumentary'
import AI from './pages/AI'
import SoftwareDev from './pages/SoftwareDev'
import SoftwareDevProject from './pages/SoftwareDevProject'
import About from './pages/About'
import Contact from './pages/Contact'

export default function App() {
  return (
    <Router>
      <div className="app-shell">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/software-dev" element={<SoftwareDev />} />
            <Route path="/software-dev/:slug" element={<SoftwareDevProject />} />
            <Route path="/videography" element={<Videography />} />
            <Route path="/trailers-promos" element={<TrailersPromos />} />
            <Route path="/social-short-form" element={<SocialShortForm />} />
            <Route path="/narrative-documentary" element={<NarrativeDocumentary />} />
            <Route path="/ai" element={<AI />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  )
}
