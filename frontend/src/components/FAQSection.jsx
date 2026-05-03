import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ marginBottom: '15px', borderBottom: '1px solid #e2e8f0' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          width: '100%', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '25px 0', 
          background: 'none', 
          border: 'none', 
          cursor: 'pointer',
          textAlign: 'left'
        }}
      >
        <span style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>{question}</span>
        <span style={{ fontSize: '24px', color: 'var(--accent)', transition: 'transform 0.3s', transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}>+</span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <p style={{ paddingBottom: '25px', color: '#64748b', lineHeight: '1.7', fontSize: '15px' }}>{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FAQSection = () => {
  const faqs = [
    {
      question: "What makes Ranking Anywhere different from other trackers?",
      answer: "We use a distributed network of physical hardware nodes and high-precision UULE injection. While other tools give you broad city data, we provide exact postal code and street-level accuracy."
    },
    {
      question: "How accurate is the ranking data?",
      answer: "Our data is 100% real-time and fetched directly from Google's local search results. By spoofing exact GPS coordinates, we ensure you see the SERP exactly as a user standing at that specific location would."
    },
    {
      question: "What is UULE injection and why is it important?",
      answer: "UULE is a specialized base64 encoded parameter used by Google to determine a user's precise location. We generate unique UULE keys for every request to bypass generic data centers and get hyper-local results."
    },
    {
      question: "Can I track Google Maps and Local Pack rankings?",
      answer: "Absolutely. Our engine specifically targets the Local 3-Pack and Google Maps results, tracking your business's visibility in the map results across various geographic points."
    },
    {
      question: "How often can I scan my keywords?",
      answer: "You can set custom schedules for Daily or Weekly scans. Additionally, you can trigger 'On-Demand' manual scans at any time for instant rank verification."
    },
    {
      question: "Do you support mobile and desktop rank tracking?",
      answer: "Yes. Every keyword can be tracked on both Desktop and Mobile devices. Mobile results account for mobile-first indexing and specific mobile SERP features."
    },
    {
      question: "What is the difference between API Stream and Direct Proxy?",
      answer: "API Stream is our high-speed distributed cloud service for rapid scaling. Direct Proxy uses dedicated hardware nodes that simulate real-browser interactions for maximum stealth and precision."
    },
    {
      question: "Can I export my ranking data for clients?",
      answer: "Yes, you can export your keyword ranking history and comparison matrices directly to CSV/Excel formats for professional client reporting."
    },
    {
      question: "How do you handle proxy failures or CAPTCHAs?",
      answer: "Our system features an automated failover system. If a node is challenged or fails, the request is instantly rerouted through a different hardware cluster to ensure zero data gaps."
    },
    {
      question: "Is my data and project information secure?",
      answer: "Security is our priority. All project data, keyword lists, and API configurations are encrypted with enterprise-grade SSL and stored in secure, isolated databases."
    }
  ];

  return (
    <section style={{ padding: '100px 24px', background: '#fff' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div style={{ fontSize: '12px', fontWeight: '900', color: 'var(--accent)', letterSpacing: '3px', marginBottom: '15px' }}>KNOWLEDGE BASE</div>
          <h2 style={{ fontSize: '36px', fontWeight: '900', color: '#0f172a' }}>Frequently Asked Questions</h2>
        </div>
        <div>
          {faqs.map((f, i) => (
            <FAQItem key={i} question={f.question} answer={f.answer} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
