import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';

// Core components that we know exist
import AnnouncementBar from './components/AnnouncementBar';
import Header from './components/Header';
import Hero from './components/Hero';
import TrustBar from './components/TrustBar';
import HowItWorksTabs from './components/HowItWorksTabs';
import FeaturedCoaches from './components/FeaturedCoaches';
import FeaturedResources from './components/FeaturedResources';
import Footer from './components/Footer';

// Lazy load larger pages
const BrowseResources = React.lazy(() => import('./components/BrowseResources'));
const UserProfilePage = React.lazy(() => import('./components/UserProfilePage'));
const AccountPage = React.lazy(() => import('./components/AccountPage'));
const UploadResource = React.lazy(() => import('./components/UploadResource'));
const CreateSellerProfile = React.lazy(() => import('./components/CreateSellerProfile'));
const ResourceDetailPage = React.lazy(() => import('./components/ResourceDetailPage'));
const BecomeSeller = React.lazy(() => import('./components/BecomeSeller'));
const CommunityHub = React.lazy(() => import('./components/CommunityHub'));
const About = React.lazy(() => import('./components/About'));
const AdminDashboard = React.lazy(() => import('./components/AdminDashboard'));
const PurchaseSuccess = React.lazy(() => import('./components/PurchaseSuccess'));

// Legal pages
const TermsOfService = React.lazy(() => import('./components/TermsOfService'));
const PrivacyPolicy = React.lazy(() => import('./components/PrivacyPolicy'));
const CopyrightPolicy = React.lazy(() => import('./components/CopyrightPolicy'));
const DMCAPolicy = React.lazy(() => import('./components/DMCAPolicy'));
const RefundPolicy = React.lazy(() => import('./components/RefundPolicy'));

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

// Home page layout
const HomePage: React.FC = () => {
  return (
    <>
      <Hero />
      <TrustBar />
      <HowItWorksTabs />
      <FeaturedResources />
      <FeaturedCoaches />
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" />
        <div className="min-h-screen bg-gray-50">
          <AnnouncementBar />
          <Header />
          <main>
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/browse" element={<BrowseResources />} />
                <Route path="/resource/:id" element={<ResourceDetailPage />} />
                <Route path="/profile" element={<UserProfilePage />} />
                <Route path="/complete-profile" element={<CreateSellerProfile />} />
                <Route path="/account" element={<AccountPage />} />
                <Route path="/upload" element={<UploadResource />} />

                {/* Content & Community Pages */}
                <Route path="/become-seller" element={<BecomeSeller />} />
                <Route path="/community-hub" element={<CommunityHub />} />
                <Route path="/about" element={<About />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/purchase-success" element={<PurchaseSuccess />} />

                {/* Legal Pages */}
                <Route path="/legal/terms" element={<TermsOfService />} />
                <Route path="/legal/privacy" element={<PrivacyPolicy />} />
                <Route path="/legal/copyright" element={<CopyrightPolicy />} />
                <Route path="/legal/dmca" element={<DMCAPolicy />} />
                <Route path="/legal/refund" element={<RefundPolicy />} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
