import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Pages
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Terms from './pages/Terms';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Verify from './pages/Auth/Verify';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import Dashboard from './pages/Dashboard';
import FreeChecker from './pages/FreeChecker';
import Settings from './pages/Settings';
import ProjectSettings from './pages/ProjectSettings';
import ProjectInsights from './pages/ProjectInsights';
import SiteAudit from './pages/SiteAudit';
import HowToUse from './pages/HowToUse';
import UserGuide from './pages/UserGuide';
import AdminPortal from './pages/AdminPortal';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import IPChecker from './pages/IPChecker';
import WhoisLookup from './pages/WhoisLookup';
import KeywordExplorer from './pages/KeywordExplorer';
import TrueCaller from './pages/TrueCaller';
import AdTracker from './pages/AdTracker';
import LiveTraffic from './pages/LiveTraffic';
import TrafficDetails from './pages/TrafficDetails';
import IPStory from './pages/IPStory';
import FraudAnalytics from './pages/FraudAnalytics';
import KeywordROI from './pages/KeywordROI';
import CampaignIntel from './pages/CampaignIntel';
import GoldUserIntel from './pages/GoldUserIntel';
import KeywordIntel from './pages/KeywordIntel';
import AdAnalytics from './pages/AdAnalytics';
import CampaignAnalytics from './pages/CampaignAnalytics';
import PlatformAnalytics from './pages/PlatformAnalytics';
import SourceIntel from './pages/SourceIntel';
import AdPositionIntel from './pages/AdPositionIntel';
import LiveSessionMirror from './pages/LiveSessionMirror';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  
  return children;
};

const App = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/free-check" element={<FreeChecker />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify" element={<Verify />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/how-to-use" element={<HowToUse />} />
      <Route path="/guide" element={<UserGuide />} />
      <Route path="/admin-portal" element={<AdminPortal />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/blog/:id" element={<BlogPost />} />
      <Route path="/check-ip" element={<IPChecker />} />
      <Route path="/whois" element={<WhoisLookup />} />
      <Route path="/whois/:domain" element={<WhoisLookup />} />
      <Route path="/keyword-explorer" element={<KeywordExplorer />} />
      <Route path="/truecaller" element={<TrueCaller />} />
      <Route path="/ad-tracker" element={<AdTracker />} />
      <Route path="/live-traffic" element={<LiveTraffic />} />
      <Route path="/traffic-details/:type" element={<TrafficDetails />} />
      <Route path="/ip-story/:ip" element={<IPStory />} />
      <Route path="/ad-analytics" element={<AdAnalytics />} />
      <Route path="/campaign-analytics" element={<CampaignAnalytics />} />
      <Route path="/platform-analytics" element={<PlatformAnalytics />} />
      <Route path="/fraud-analytics" element={<FraudAnalytics />} />
      <Route path="/keyword-roi" element={<KeywordROI />} />
      <Route path="/campaign-intel/:name" element={<CampaignIntel />} />
      <Route path="/source-intel/:source" element={<SourceIntel />} />
      <Route path="/gold-user/:ip" element={<GoldUserIntel />} />
      <Route path="/keyword-intel/:keyword" element={<KeywordIntel />} />
      <Route path="/ad-position-intel" element={<AdPositionIntel />} />
      <Route path="/live-session/:clickId" element={<LiveSessionMirror />} />
      {/* <Route path="/site-audit" element={<SiteAudit />} /> */}

      {/* Private Dashboard Route */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/settings" 
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/project-settings/:id" 
        element={
          <ProtectedRoute>
            <ProjectSettings />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/project-insights/:id" 
        element={
          <ProtectedRoute>
            <ProjectInsights />
          </ProtectedRoute>
        } 
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default App;
