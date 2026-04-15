import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Bot, MessageSquare, Send, Sparkles, X } from 'lucide-react';
import api from '@/lib/apiClient';
import '@/styles/JagrukChatbot.css';

const starterMessages = [
  {
    role: 'assistant',
    content: 'Hi, I am Jagruk. I can help you report an issue, track a complaint, choose the right civic/social flow, or explain login and NGO routes.',
  },
];

const quickPrompts = [
  'How do I report a pothole?',
  'Where do social issues go?',
  'How do I track my complaint?',
  'How do I sign in?',
  'What is /impact?',
];

const JagrukChatbot = () => {
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState(starterMessages);
  const [loading, setLoading] = useState(false);
  const [impact, setImpact] = useState(null);
  const bodyRef = useRef(null);

  useEffect(() => {
    const loadImpact = async () => {
      try {
        const response = await api.get('/public/impact');
        setImpact(response.data);
      } catch {
        setImpact(null);
      }
    };

    loadImpact();
  }, []);

  useEffect(() => {
    const openHandler = () => setIsOpen(true);
    window.addEventListener('jagruk:open', openHandler);
    return () => window.removeEventListener('jagruk:open', openHandler);
  }, []);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const appContext = useMemo(() => {
    const routeContext = `Current route: ${location.pathname}${location.search || ''}`;
    const roleContext = user?.role ? `Current user role: ${user.role}` : 'Current user role: guest';
    const impactContext = impact
      ? `Live platform stats: resolved ${impact.resolvedTotal || 0}, NGOs ${impact.ngosActive || 0}, resolution rate ${impact.resolutionRate || 0}%.`
      : 'Live platform stats unavailable right now.';

    return [routeContext, roleContext, impactContext].join(' ');
  }, [impact, location.pathname, location.search, user?.role]);

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const nextMessages = [...messages, { role: 'user', content: trimmed }];
    setMessages(nextMessages);
    setMessage('');
    setLoading(true);

    try {
      const response = await api.post('/public/chatbot', {
        message: trimmed,
        history: nextMessages.slice(-6),
        context: appContext,
      });

      setMessages((current) => [
        ...current,
        { role: 'assistant', content: response.data?.reply || 'I could not generate a reply right now.' },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: error.response?.data?.message || 'Jagruk is unavailable right now.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await sendMessage(message);
  };

  return (
    <>
      <button type="button" className="jagruk-launcher" onClick={() => setIsOpen(true)} aria-label="Open Jagruk chatbot">
        <span className="jagruk-launcher__pulse" />
        <Bot size={18} />
        <span>Jagruk</span>
      </button>

      {isOpen && (
        <div className="jagruk-shell" role="dialog" aria-modal="true" aria-label="Jagruk chatbot">
          <div className="jagruk-panel glass">
            <header className="jagruk-header">
              <div>
                <div className="jagruk-kicker">
                  <Sparkles size={14} />
                  Civic assistant
                </div>
                <h3>Jagruk</h3>
                <p>Ask me about reporting, tracking, or the right flow for civic and social issues.</p>
              </div>
              <button type="button" className="jagruk-close" onClick={() => setIsOpen(false)} aria-label="Close chatbot">
                <X size={18} />
              </button>
            </header>

            <div className="jagruk-body" ref={bodyRef}>
              {messages.map((entry, index) => (
                <div key={`${entry.role}-${index}`} className={`jagruk-bubble ${entry.role}`}>
                  {entry.role === 'assistant' ? <MessageSquare size={15} /> : null}
                  <span>{entry.content}</span>
                </div>
              ))}
              {loading ? <div className="jagruk-bubble assistant loading">Thinking...</div> : null}
            </div>

            <div className="jagruk-prompts">
              {quickPrompts.map((prompt) => (
                <button key={prompt} type="button" onClick={() => sendMessage(prompt)} disabled={loading}>
                  {prompt}
                </button>
              ))}
            </div>

            <form className="jagruk-form" onSubmit={handleSubmit}>
              <input
                type="text"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Ask Jagruk anything about the app..."
              />
              <button type="submit" disabled={loading || !message.trim()}>
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default JagrukChatbot;