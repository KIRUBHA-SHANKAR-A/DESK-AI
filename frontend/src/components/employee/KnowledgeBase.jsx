import React, { useState } from 'react';
import { BookOpen, Search, ArrowRight, X, CheckCircle2, Tag, FileText, Paperclip } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';

export default function KnowledgeBase({ articles = [] }) {
  const [searchKb, setSearchKb] = useState('');
  const [selectedArticle, setSelectedArticle] = useState(null);

  const filteredArticles = (articles || []).filter(a =>
    !searchKb ||
    (a.title && a.title.toLowerCase().includes(searchKb.toLowerCase())) ||
    (a.content && a.content.toLowerCase().includes(searchKb.toLowerCase())) ||
    (a.summary && a.summary.toLowerCase().includes(searchKb.toLowerCase())) ||
    (a.keywords && a.keywords.toLowerCase().includes(searchKb.toLowerCase()))
  );

  return (
    <div className="tab-fade">
      <div className="glass-card mb-4">
        <h4 className="mb-3">📚 Knowledge Base & Self-Service Portal</h4>
        <div className="search-input-wrapper">
          <Search size={18} className="search-ico-input" />
          <input
            type="text"
            className="input-premium search-padded"
            placeholder="Search verified solutions by title, keywords, or error code..."
            value={searchKb}
            onChange={(e) => setSearchKb(e.target.value)}
          />
        </div>
      </div>

      {filteredArticles.length === 0 ? (
        <div className="glass-card empty-state">
          <BookOpen size={36} className="empty-ico-svg" />
          <p>No knowledge base articles found matching your query.</p>
        </div>
      ) : (
        <div className="kb-grid">
          {filteredArticles.map(a => {
            const artId = a.articleId || a.id;
            return (
              <div
                key={artId}
                className="glass-card kb-card cursor-pointer"
                onClick={() => setSelectedArticle(a)}
              >
                <div className="card-top-row">
                  <span className="badge-premium badge-p3 mb-2">Article #{artId}</span>
                  <span className="category-tag-xs">{a.category?.categoryName || 'Support Guide'}</span>
                </div>

                <h5 className="kb-title">{a.title}</h5>

                <p className="kb-excerpt">
                  {a.summary || (a.content ? a.content.substring(0, 120) + '...' : 'No preview available.')}
                </p>

                {a.keywords && (
                  <div className="kw-row">
                    {a.keywords.split(',').map((kw, i) => (
                      <span key={i} className="kw-pill">{kw.trim()}</span>
                    ))}
                  </div>
                )}

                <div className="card-footer-row mt-2">
                  {a.attachmentBase64 ? (
                    <span className="text-muted-xs flex-align-center gap-1">
                      <Paperclip size={11} /> Visual Guide
                    </span>
                  ) : <div />}
                  <span className="read-more-link">
                    View Solution <ArrowRight size={12} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Structured Reader Modal */}
      {selectedArticle && (
        <div className="modal-backdrop" onClick={() => setSelectedArticle(null)}>
          <div className="glass-panel modal-dialog structured-kb-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="badge-premium badge-p3 mb-1">Article #{selectedArticle.articleId || selectedArticle.id}</span>
                <h3 className="mt-1">{selectedArticle.title}</h3>
              </div>
              <button className="close-btn" onClick={() => setSelectedArticle(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {/* Category & Date Metadata */}
              <div className="structured-meta-bar mb-3">
                <span className="meta-badge">
                  <Tag size={13} /> {selectedArticle.category?.categoryName || 'General Support Guide'}
                </span>
                {selectedArticle.updatedAt && (
                  <span className="text-muted-xs">
                    Updated: {formatDate(selectedArticle.updatedAt)}
                  </span>
                )}
              </div>

              {/* Keywords Pills */}
              {selectedArticle.keywords && (
                <div className="field-group mb-3">
                  <label className="text-muted-xs font-semibold uppercase">Related Keywords</label>
                  <div className="kw-row">
                    {selectedArticle.keywords.split(',').map((kw, idx) => (
                      <span key={idx} className="kw-pill">{kw.trim()}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Executive Summary Box */}
              {selectedArticle.summary && (
                <div className="field-group mb-3">
                  <label className="text-muted-xs font-semibold uppercase">Executive Summary</label>
                  <div className="desc-box summary-accent">
                    <FileText size={16} className="summary-icon" />
                    <span>{selectedArticle.summary}</span>
                  </div>
                </div>
              )}

              {/* Detailed Resolution Content */}
              <div className="field-group mb-4">
                <label className="text-muted-xs font-semibold uppercase">Step-by-Step Solution Guide</label>
                <div className="desc-box content-structured-box">
                  {selectedArticle.content ? (
                    selectedArticle.content.split('\n').map((line, idx) => (
                      <p key={idx} className={line.trim().startsWith('-') || line.trim().startsWith('*') ? 'list-step' : ''}>
                        {line}
                      </p>
                    ))
                  ) : (
                    <p>No detailed instructions available for this article.</p>
                  )}
                </div>
              </div>

              {/* Guide Attachment Preview */}
              {selectedArticle.attachmentBase64 && (
                <div className="field-group mb-4">
                  <label className="text-muted-xs font-semibold uppercase flex-align-center gap-1">
                    <Paperclip size={13} /> Visual Diagram / Guide Attachment ({selectedArticle.attachmentName || 'Screenshot'})
                  </label>
                  <div className="attachment-preview-container">
                    <img src={selectedArticle.attachmentBase64} alt="Visual Guide" className="kb-attachment-img" />
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="card-header-flex mt-4 pt-3 border-t">
                <span className="text-muted-xs">Did this article resolve your issue?</span>
                <button
                  className="btn-premium btn-sm"
                  onClick={() => setSelectedArticle(null)}
                >
                  <CheckCircle2 size={14} /> Yes, Issue Resolved
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{kbStyles}</style>
    </div>
  );
}

const kbStyles = `
  .search-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }
  .search-ico-input {
    position: absolute;
    left: 14px;
    color: var(--text-muted);
  }
  .search-padded {
    padding-left: 42px;
    width: 100%;
  }
  .kb-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 16px;
  }
  .kb-card {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .kb-card:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-neon);
  }
  .card-top-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .category-tag-xs {
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--accent-cyan);
    text-transform: uppercase;
  }
  .kb-title {
    margin: 4px 0 0 0;
    font-size: 1.05rem;
    color: var(--text-primary);
  }
  .kb-excerpt {
    font-size: 0.84rem;
    color: var(--text-secondary);
    line-height: 1.5;
    margin: 0;
  }
  .kw-row {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-top: 4px;
  }
  .card-footer-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid var(--border);
    padding-top: 10px;
    margin-top: auto;
  }
  .read-more-link {
    font-size: 0.8rem;
    color: var(--accent-cyan);
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
  }

  /* Centered Popup Modal Overlay */
  .modal-backdrop {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    inset: 0 !important;
    background: rgba(0, 0, 0, 0.45) !important;
    backdrop-filter: blur(4px) !important;
    -webkit-backdrop-filter: blur(4px) !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    z-index: 2000 !important;
    padding: 20px !important;
  }
  .modal-dialog {
    width: 100% !important;
    max-width: 620px !important;
    max-height: 85vh !important;
    overflow-y: auto !important;
    padding: 28px 32px !important;
    border-radius: var(--radius-lg) !important;
    background: var(--bg-panel) !important;
    color: var(--text-primary) !important;
    border: 1px solid var(--border-glow) !important;
    box-shadow: var(--shadow-lg) !important;
    position: relative !important;
    z-index: 2001 !important;
  }

  /* Structured Reader Modal Styles */
  .structured-kb-modal {
    max-width: 680px !important;
  }
  .structured-meta-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .meta-badge {
    font-size: 0.78rem;
    color: var(--accent-cyan);
    background: rgba(6, 182, 212, 0.1);
    padding: 4px 10px;
    border-radius: 6px;
    border: 1px solid rgba(6, 182, 212, 0.2);
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .summary-accent {
    background: rgba(139, 92, 246, 0.08);
    border-left: 3px solid var(--accent-purple);
    padding: 12px 16px;
    border-radius: 6px;
    color: var(--text-primary);
    font-size: 0.88rem;
    display: flex;
    gap: 10px;
    align-items: flex-start;
  }
  .summary-icon {
    color: var(--accent-purple);
    flex-shrink: 0;
    margin-top: 2px;
  }
  .content-structured-box {
    background: var(--bg-hover);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 16px;
    font-size: 0.9rem;
    color: var(--text-primary);
    line-height: 1.6;
  }
  .content-structured-box p {
    margin-bottom: 8px;
  }
  .content-structured-box p.list-step {
    padding-left: 12px;
    border-left: 2px solid var(--accent-cyan);
    margin-left: 4px;
    color: var(--text-secondary);
  }
  .attachment-preview-container {
    background: var(--bg-hover);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 12px;
    display: flex;
    justify-content: center;
  }
  .kb-attachment-img {
    max-width: 100%;
    max-height: 320px;
    border-radius: 6px;
    border: 1px solid var(--border);
    object-fit: contain;
    background: var(--bg-app);
  }
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40px 20px;
    color: var(--text-muted);
  }
  .empty-ico-svg {
    margin-bottom: 12px;
  }
  .cursor-pointer {
    cursor: pointer;
  }
  .border-t {
    border-top: 1px solid var(--border);
  }
  .pt-3 {
    padding-top: 12px;
  }
`;
