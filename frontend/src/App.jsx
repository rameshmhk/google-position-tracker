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
      <Route path="/keywords" element={<KeywordExplorer />} />
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
