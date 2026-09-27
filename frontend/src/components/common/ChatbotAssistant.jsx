import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare, Send, X, Bot, User, Sparkles, CheckCircle2,
  Ticket, ArrowRight, CornerDownRight, ExternalLink, HelpCircle
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export default function ChatbotAssistant({ currentUser, authHeaders, onTicketCreated }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: `Hello ${currentUser?.name ? currentUser.name.split(' ')[0] : 'there'}! I'm DeskAI Assistant. How can I help you today? You can describe an issue, search our Knowledge Base, or submit a support ticket directly from here.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestions: ['VPN connection issues', 'Password reset instructions', 'Printer not responding', 'Request software access']
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const getHeaders = () => {
    const base = authHeaders ? (typeof authHeaders === 'function' ? authHeaders() : authHeaders) : {};
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...base
    };
  };

  const handleSend = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // 1. Query Knowledge Base using Sentence-BERT / semantic search
      const headers = getHeaders();
      const res = await fetch(`${API_BASE_URL}/tickets/ai/recommend-kb`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ title: query, description: query })
      });

      let articles = [];
      if (res.ok) {
        articles = await res.json();
      }

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (Array.isArray(articles) && articles.length > 0) {
        const top = articles[0];
        const botMsg = {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: `I found a Knowledge Base solution that might resolve your issue: **${top.title || 'Solution'}**`,
          article: top,
          moreArticles: articles.slice(1, 3),
          query: query,
          time: timeStr,
          showTicketOption: true
        };
        setMessages(prev => [...prev, botMsg]);
      } else {
        const botMsg = {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: `I couldn't find an existing article matching "${query}". Would you like me to create a support ticket for our engineering team?`,
          query: query,
          time: timeStr,
          showTicketOption: true
        };
        setMessages(prev => [...prev, botMsg]);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: "I'm having trouble connecting to the AI service. You can still create a support ticket directly.",
          query: query,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          showTicketOption: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleConvertChatToTicket = async (issueText) => {
    setLoading(true);
    try {
      const headers = getHeaders();
      const res = await fetch(`${API_BASE_URL}/tickets/channel-ingest`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          source: 'CHAT',
          title: issueText.length > 80 ? issueText.substring(0, 77) + '...' : issueText,
          description: `Ingested via Self-Service AI Chatbot:\n\nUser Question: ${issueText}\n\nChat Session Timestamp: ${new Date().toISOString()}`,
          name: currentUser?.name || 'Chat User',
          email: currentUser?.email || ''
        })
      });

      if (res.ok) {
        const created = await res.json();
        const tktNum = created.ticketNumber || `#TKT-${created.ticketId}`;
        setTicketSuccess(tktNum);

        setMessages(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            sender: 'bot',
            text: `✅ **Ticket Created Successfully!**\n\nTicket ID: **${tktNum}**\nDepartment: **${created.department?.departmentName || created.aiCategory || 'IT Support'}**\nPriority: **${created.priority || 'MEDIUM'}**\n\nOur team has received your request and will address it within the SLA window.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isSuccess: true
          }
        ]);

        if (onTicketCreated) {
          onTicketCreated(created);
        }
      }
    } catch (err) {
      console.error('Failed to create ticket from chat:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="deskai-chatbot-root">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          className="chatbot-launcher-btn"
          onClick={() => setIsOpen(true)}
          title="Open DeskAI Self-Service Assistant"
        >
          <div className="launcher-glow"></div>
          <Sparkles size={18} className="launcher-icon-sparkle" />
          <Bot size={22} className="launcher-icon-bot" />
          <span className="launcher-text">Ask DeskAI</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="chatbot-window glass-card">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-left">
              <div className="chatbot-avatar">
                <Bot size={18} />
                <span className="online-indicator"></span>
              </div>
              <div>
                <h4>DeskAI Assistant</h4>
                <p>Self-Service & Instant Support</p>
              </div>
            </div>
            <button className="chatbot-close-btn" onClick={() => setIsOpen(false)}>
              <X size={18} />
            </button>
          </div>

          {/* Messages Stream */}
          <div className="chatbot-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`chat-bubble-row ${msg.sender === 'user' ? 'user-row' : 'bot-row'}`}>
                {msg.sender === 'bot' && (
                  <div className="bot-avatar-mini">
                    <Bot size={13} />
                  </div>
                )}

                <div className={`chat-bubble ${msg.sender === 'user' ? 'bubble-user' : 'bubble-bot'} ${msg.isSuccess ? 'bubble-success' : ''}`}>
                  <p className="bubble-text">{msg.text}</p>

                  {/* Article Card */}
                  {msg.article && (
                    <div className="chat-article-card">
                      <div className="cat-pill">{msg.article.category || 'Knowledge Base'}</div>
                      <h5>{msg.article.title}</h5>
                      <p>{msg.article.summary || msg.article.content?.substring(0, 160) + '...'}</p>
                    </div>
                  )}

                  {/* Suggestions Chips */}
                  {msg.suggestions && (
                    <div className="chat-suggestions-chips">
                      {msg.suggestions.map((sug, i) => (
                        <button
                          key={i}
                          className="suggestion-chip"
                          onClick={() => handleSend(sug)}
                        >
                          <CornerDownRight size={10} style={{ marginRight: 3 }} /> {sug}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Convert to Ticket Option */}
                  {msg.showTicketOption && !ticketSuccess && (
                    <div className="chat-ticket-prompt">
                      <span>Didn't solve your issue?</span>
                      <button
                        className="btn-create-ticket-chat"
                        onClick={() => handleConvertChatToTicket(msg.query || input || 'Assistance requested')}
                        disabled={loading}
                      >
                        <Ticket size={13} style={{ marginRight: 5 }} />
                        Create Support Ticket
                      </button>
                    </div>
                  )}

                  <span className="bubble-time">{msg.time}</span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="chat-bubble-row bot-row">
                <div className="bot-avatar-mini">
                  <Bot size={13} />
                </div>
                <div className="chat-bubble bubble-bot typing-bubble">
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <form
            className="chatbot-input-bar"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <input
              type="text"
              className="chat-input"
              placeholder="Ask anything or describe your issue..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button type="submit" className="chat-send-btn" disabled={loading || !input.trim()}>
              <Send size={15} />
            </button>
          </form>
        </div>
      )}

      <style>{`
        .deskai-chatbot-root {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 9999;
          font-family: inherit;
        }
        .chatbot-launcher-btn {
          position: relative;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          border-radius: 99px;
          background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%);
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.25);
          box-shadow: 0 10px 25px -5px rgba(124, 58, 237, 0.5), 0 0 20px rgba(59, 130, 246, 0.3);
          cursor: pointer;
          font-weight: 700;
          font-size: 0.9rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .chatbot-launcher-btn:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 14px 30px -5px rgba(124, 58, 237, 0.65), 0 0 25px rgba(59, 130, 246, 0.5);
        }
        .launcher-glow {
          position: absolute;
          inset: -2px;
          border-radius: 99px;
          background: linear-gradient(135deg, #a855f7, #60a5fa);
          opacity: 0.4;
          filter: blur(8px);
          z-index: -1;
        }
        .chatbot-window {
          width: 380px;
          height: 520px;
          border-radius: 20px;
          background: var(--bg-card, #0f172a);
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.6), 0 0 30px rgba(124, 58, 237, 0.25);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: chatPop 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes chatPop {
          from { opacity: 0; transform: scale(0.9) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .chatbot-header {
          padding: 14px 16px;
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.25), rgba(59, 130, 246, 0.15));
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .chatbot-header-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .chatbot-avatar {
          position: relative;
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: linear-gradient(135deg, #7c3aed, #2563eb);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
        }
        .online-indicator {
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #10b981;
          border: 2px solid #0f172a;
        }
        .chatbot-header h4 {
          margin: 0;
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-primary, #fff);
        }
        .chatbot-header p {
          margin: 0;
          font-size: 0.72rem;
          color: var(--text-muted, #94a3b8);
        }
        .chatbot-close-btn {
          background: transparent;
          border: none;
          color: var(--text-muted, #94a3b8);
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          transition: all 0.2s;
        }
        .chatbot-close-btn:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.1);
        }
        .chatbot-messages {
          flex: 1;
          padding: 14px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .chat-bubble-row {
          display: flex;
          gap: 8px;
          align-items: flex-end;
        }
        .user-row {
          justify-content: flex-end;
        }
        .bot-row {
          justify-content: flex-start;
        }
        .bot-avatar-mini {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #7c3aed;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          flex-shrink: 0;
          margin-bottom: 2px;
        }
        .chat-bubble {
          max-width: 82%;
          padding: 10px 14px;
          border-radius: 14px;
          font-size: 0.85rem;
          line-height: 1.45;
          position: relative;
        }
        .bubble-user {
          background: linear-gradient(135deg, #7c3aed, #6366f1);
          color: #fff;
          border-bottom-right-radius: 4px;
        }
        .bubble-bot {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: var(--text-primary, #e2e8f0);
          border-bottom-left-radius: 4px;
        }
        .bubble-success {
          border-color: rgba(16, 185, 129, 0.4);
          background: rgba(16, 185, 129, 0.12);
        }
        .bubble-text {
          margin: 0;
          white-space: pre-wrap;
        }
        .bubble-time {
          display: block;
          font-size: 0.64rem;
          color: rgba(255, 255, 255, 0.5);
          margin-top: 4px;
          text-align: right;
        }
        .chat-article-card {
          margin-top: 8px;
          padding: 10px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .chat-article-card h5 {
          margin: 4px 0 2px 0;
          font-size: 0.82rem;
          color: var(--accent-cyan, #06b6d4);
        }
        .chat-article-card p {
          margin: 0;
          font-size: 0.74rem;
          color: var(--text-muted, #94a3b8);
        }
        .cat-pill {
          display: inline-block;
          font-size: 0.64rem;
          padding: 2px 6px;
          border-radius: 4px;
          background: rgba(124, 58, 237, 0.2);
          color: #c084fc;
          font-weight: 700;
        }
        .chat-suggestions-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 8px;
        }
        .suggestion-chip {
          display: flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: var(--text-primary, #e2e8f0);
          border-radius: 99px;
          padding: 4px 10px;
          font-size: 0.72rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .suggestion-chip:hover {
          background: rgba(124, 58, 237, 0.3);
          border-color: #8b5cf6;
        }
        .chat-ticket-prompt {
          margin-top: 10px;
          padding-top: 8px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .chat-ticket-prompt span {
          font-size: 0.72rem;
          color: var(--text-muted, #94a3b8);
        }
        .btn-create-ticket-chat {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6px 12px;
          border-radius: 8px;
          background: linear-gradient(135deg, #10b981, #059669);
          color: #fff;
          border: none;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-create-ticket-chat:hover {
          filter: brightness(1.1);
          transform: translateY(-1px);
        }
        .chatbot-input-bar {
          padding: 10px 14px;
          background: rgba(0, 0, 0, 0.2);
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          gap: 8px;
        }
        .chat-input {
          flex: 1;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 10px;
          padding: 8px 12px;
          color: #fff;
          font-size: 0.84rem;
          outline: none;
        }
        .chat-input:focus {
          border-color: #8b5cf6;
        }
        .chat-send-btn {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: linear-gradient(135deg, #7c3aed, #3b82f6);
          border: none;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .chat-send-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .typing-bubble {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 10px 16px;
        }
        .typing-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #8b5cf6;
          animation: dotBlink 1.4s infinite ease-in-out;
        }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes dotBlink {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
