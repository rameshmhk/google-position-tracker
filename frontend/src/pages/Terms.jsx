import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Terms = () => {
  return (
    <div className="info-page">
      <Navbar />
      <div className="info-content">
        <h1>Terms and Conditions</h1>
        <p>Last updated: April 16, 2026</p>
        
        <section>
          <h2>1. Use of Service</h2>
          <p>By accessing RankTracker Pro, you agree to comply with all local and international search engine scraping policies. You are responsible for ensuring your use of our API keys complies with their respective terms of service.</p>
        </section>
        
        <section>
          <h2>2. Account Security</h2>
          <p>You are responsible for maintaining the confidentiality of your login credentials. We are not liable for any loss resulting from unauthorized access to your account.</p>
        </section>

        <section>
          <h2>3. Data Accuracy</h2>
          <p>While we strive for 100% accuracy, search engine results pages (SERPs) are volatile. We do not guarantee the permanence of any specific ranking positions.</p>
        </section>

        <section>
          <h2>4. Termination</h2>
          <p>We reserve the right to terminate access to the tool for any user found to be abusing the system or violating search engine guidelines.</p>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default Terms;
