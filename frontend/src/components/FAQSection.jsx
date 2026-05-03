import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FAQItem = ({ question, answer, icon, index }) => {
  const [isOpen, setIsOpen] = useState(false);
  const colors = ['#eff6ff', '#fff7ed', '#f0fdf4', '#f5f3ff', '#fdf2f8'];
  const bg = colors[index % colors.length];

  return (
    <div style={{ 
      marginBottom: '15px', 
      borderRadius: '16px', 
      overflow: 'hidden', 
      border: '1px solid #e2e8f0',
      background: isOpen ? bg : '#fff',
      transition: 'all 0.3s ease'
    }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          width: '100%', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '20px 25px', 
          background: 'none', 
          border: 'none', 
          cursor: 'pointer',
          textAlign: 'left'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ fontSize: '20px' }}>{icon}</span>
          <span style={{ fontSize: '17px', fontWeight: '800', color: '#1e293b' }}>{question}</span>
        </div>
        <div style={{ 
          width: '32px', 
          height: '32px', 
          borderRadius: '50%', 
          background: isOpen ? 'var(--accent)' : '#f1f5f9', 
          color: isOpen ? '#fff' : '#64748b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          fontWeight: '900',
          transition: 'all 0.3s',
          transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)'
        }}>+</div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <p style={{ padding: '0 25px 25px 60px', color: '#475569', lineHeight: '1.8', fontSize: '15px', fontWeight: '500' }}>{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FAQSection = () => {
  const faqs = [
    {
      icon: "🚀",
      question: "How is this different from other SEO tools?",
      answer: "Most SEO tools show you general data from huge data centers, which is often not what real customers see. Ranking Anywhere is different because we use a special network that mimics a real person's location. This means we bypass the 'filter' of data centers and show you the exact search results for any city or street. It is like having thousands of local people checking Google for you from their own homes or offices, giving you the most honest data possible."
    },
    {
      icon: "🎯",
      question: "How accurate is the ranking information?",
      answer: "Our accuracy is unmatched because we don't use old or 'cached' data. Every time you start a scan, our system goes live to Google's search engine and performs a fresh search. We use high-precision geographic telemetry to make sure the results are exactly what they should be. This ensures that the position you see in your dashboard is the same position a real user would see at that exact moment in their local search results."
    },
    {
      icon: "📍",
      question: "Can I check rankings for a specific area or city?",
      answer: "Yes, this is one of our best features! You can choose any country, city, or even a very specific postal code area. For example, if you own a pizza shop, you can see how you rank for someone standing right outside your shop versus someone standing 5 kilometers away. This level of detail helps you understand your 'local dominance' and where you need to improve your SEO efforts to beat local competitors."
    },
    {
      icon: "🗺️",
      question: "Does it track Google Maps results?",
      answer: "Absolutely. We know that for local businesses, the Google Maps 'Local 3-Pack' is where all the phone calls and foot traffic come from. Our system specifically tracks these map positions. We will show you if your business is in the top 3 results, or if it is buried deeper in the 'More Places' section. This allows you to track your local visibility across multiple different points on the map simultaneously."
    },
    {
      icon: "⏰",
      question: "How often do the rankings update?",
      answer: "The choice is entirely yours. You can set up an automatic schedule so the system checks your rankings every single day or once a week. If you are working on a new SEO strategy and want to see the impact immediately, you can simply click the 'Check Now' button for any keyword. This gives you total control over your data frequency so you can spot ranking drops early and fix them before they hurt your business."
    },
    {
      icon: "📱",
      question: "Does it work for both Mobile and Desktop?",
      answer: "Yes, we track both. Google often shows completely different results to a person on a smartphone versus someone on a laptop. Our system lets you monitor both versions so you can ensure your website is performing well across all devices. This is especially important for local SEO, as most local searches happen on mobile phones while people are on the go."
    },
    {
      icon: "🛠️",
      question: "What is API Stream and Direct Proxy?",
      answer: "These are just two different ways our engine fetches data for you. API Stream is designed for speed and large volumes of keywords - it is very efficient and fast. Direct Proxy is our premium 'Real Browser' method. It uses physical hardware nodes to simulate a person actually typing a query into a browser. While it takes a little longer, it provides the highest level of verification and is almost impossible for Google to detect as a bot."
    },
    {
      icon: "📊",
      question: "Can I download my reports for clients?",
      answer: "Yes, you can easily export all your ranking data. We provide professional CSV and Excel-style downloads that you can use to create your own reports or send directly to your clients. These reports include the keyword, its current position, and its historical movement over time. This makes it very easy to prove the value of your SEO work and build long-term trust with your business partners."
    },
    {
      icon: "🛡️",
      question: "What happens if a scan fails?",
      answer: "Our system is built to be 'self-healing.' If a specific proxy node or network path fails for any reason, the system detects it within milliseconds and automatically tries a different route. We have multiple failover layers to make sure you get your ranking data even if one part of the internet is having issues. This redundancy ensures that your daily and weekly ranking charts always have complete data with no gaps."
    },
    {
      icon: "🔒",
      question: "Is my project data safe with you?",
      answer: "We take your privacy very seriously. All your project details, keyword lists, and business information are stored in a secure, encrypted database. We do not share or sell your data to any third parties. Your ranking intelligence is your competitive advantage, and we make sure it stays that way. Our infrastructure is protected by enterprise-grade SSL security to keep your account safe at all times."
    }
  ];

  return (
    <section style={{ padding: '80px 24px', background: '#f8fafc' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div style={{ fontSize: '11px', fontWeight: '900', color: 'var(--accent)', letterSpacing: '3px', marginBottom: '15px' }}>HELP CENTER</div>
          <h2 style={{ fontSize: '36px', fontWeight: '900', color: '#0f172a', letterSpacing: '-1.5px' }}>Simple Answers to Common Questions</h2>
        </div>
        <div>
          {faqs.map((f, i) => (
            <FAQItem key={i} index={i} question={f.question} answer={f.answer} icon={f.icon} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
