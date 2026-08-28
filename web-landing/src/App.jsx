import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import SignUp from './pages/SignUp';
import Download from './pages/Download';
import Referral from './pages/Referral';
import PrivacyPolicy from './pages/PrivacyPolicy';
import PaymentPolicy from './pages/PaymentPolicy';
import IntegrityPolicy from './pages/IntegrityPolicy';
import CompliancePolicy from './pages/CompliancePolicy';
import AMLPolicy from './pages/AMLPolicy';
import TermsAndConditions from './pages/TermsAndConditions';
import Contact from './pages/Contact';
import FAQ from './pages/FAQ';
import Careers from './pages/Careers';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-brand-darker transition-colors duration-300">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/"          element={<Home />} />
          <Route path="/signup"    element={<SignUp />} />
          <Route path="/download"  element={<Download />} />
          <Route path="/r/:code"   element={<Referral />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/payment-policy" element={<PaymentPolicy />} />
          <Route path="/integrity-policy" element={<IntegrityPolicy />} />
          <Route path="/compliance-policy" element={<CompliancePolicy />} />
          <Route path="/aml-policy" element={<AMLPolicy />} />
          <Route path="/terms" element={<TermsAndConditions />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="*"          element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
