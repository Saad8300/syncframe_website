import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ScrollToTop from './components/ScrollToTop'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import FeaturesPage from './pages/FeaturesPage'
import PricingPage from './pages/PricingPage'
import DownloadPage from './pages/DownloadPage'
import ChangelogPage from './pages/ChangelogPage'
import ContactPage from './pages/ContactPage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import UpgradePage from './pages/UpgradePage'
import AdminPage from './pages/AdminPage'

// Legacy /account route — redirect to /login
import { Navigate } from 'react-router-dom'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <div className="flex flex-col min-h-screen bg-[#09090f] text-slate-200">
          <Navbar />
          <main className="flex-1 flex flex-col w-full">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/features" element={<FeaturesPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/download" element={<DownloadPage />} />
              <Route path="/changelog" element={<ChangelogPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/upgrade" element={<UpgradePage />} />
              <Route path="/admin" element={<AdminPage />} />
              {/* Legacy routes */}
              <Route path="/account" element={<Navigate to="/login" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
