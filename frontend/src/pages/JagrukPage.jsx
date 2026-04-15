import React from 'react';
import { Bot, Sparkles, MessageSquare } from 'lucide-react';
import JagrukChatbot from '@/components/JagrukChatbot';
import '@/styles/JagrukPage.css';

const JagrukPage = () => {
  return (
    <div className="jagruk-page">
      <section className="jagruk-hero glass">
        <div className="jagruk-hero__copy">
          <div className="jagruk-hero__kicker">
            <Sparkles size={14} /> Jagruk assistant
          </div>
          <h1>Ask Jagruk about CivicVoice.</h1>
          <p>
            Get help with reporting, tracking, login roles, NGO routing, community support, and where to go next.
          </p>
          <div className="jagruk-hero__chips">
            <span><MessageSquare size={14} /> Reporting guidance</span>
            <span><Bot size={14} /> App-wide chatbot</span>
          </div>
        </div>
      </section>

      <section className="jagruk-embedded-panel">
        <JagrukChatbot />
      </section>
    </div>
  );
};

export default JagrukPage;