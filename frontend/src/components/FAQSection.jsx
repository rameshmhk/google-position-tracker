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
            <p style={{ padding: '0 25px 25px 60px', color: '#475569', lineHeight: '1.6', fontSize: '15px', fontWeight: '500' }}>{answer}</p>
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
      answer: "Most tools show you general data. We show you exactly what a person sitting in a specific city or street sees on Google. It’s like having a local person check the rankings for you!"
    },
    {
      icon: "🎯",
      question: "How accurate is the ranking information?",
      answer: "It is very accurate! We use real-time data from Google. We don't guess—we check the live results every time you run a scan."
    },
    {
      icon: "📍",
      question: "Can I check rankings for a specific area or city?",
      answer: "Yes! You can choose any city, country, or even a specific area. This is great for local businesses who want to see how they look to nearby customers."
    },
    {
      icon: "🗺️",
      question: "Does it track Google Maps results?",
      answer: "Yes, it does. We track the 'Map Pack' (the top 3 local results with the map) so you can see if your business is showing up there."
    },
    {
      icon: "⏰",
      question: "How often do the rankings update?",
      answer: "You decide! You can set it to check every day, every week, or you can just click a button to check right now."
    },
    {
      icon: "📱",
      question: "Does it work for both Mobile and Desktop?",
      answer: "Yes. You can see how you rank on a computer and how you rank on a mobile phone, as the results are often different."
    },
    {
      icon: "🛠️",
      question: "What is API Stream and Direct Proxy?",
      answer: "Don't worry about the technical names! API Stream is for fast results, and Direct Proxy is for when you want to see the result exactly like a real browser would show it."
    },
    {
      icon: "📊",
      question: "Can I download my reports?",
      answer: "Yes, you can download all your ranking data into an Excel-style sheet to show your clients or keep for your records."
    },
    {
      icon: "🛡️",
      question: "What happens if a scan fails?",
      answer: "Our system is smart. If one way fails, it automatically tries another way immediately to make sure you always get your data."
    },
    {
      icon: "🔒",
      question: "Is my project data safe with you?",
      answer: "Absolutely. Your data is private and encrypted. No one else can see your keywords or your projects."
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
