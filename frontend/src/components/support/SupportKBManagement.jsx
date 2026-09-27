import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Search, CheckCircle2, Edit3, Trash2, X, Tag, FileText, ArrowRight, Paperclip, Image as ImageIcon, Sparkles } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export default function SupportKBManagement({ authHeaders }) {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [editingArticle, setEditingArticle] = useState(null);
  
  // Article form state
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [keywords, setKeywords] = useState('');
  const [attachmentScreenshot, setAttachmentScreenshot] = useState(null);
  const [attachmentBase64, setAttachmentBase64] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [generatingKb, setGeneratingKb] = useState(false);
  const [autoGenMessage, setAutoGenMessage] = useState(null);

  const handleAutoGenerateKb = async () => {
    setGeneratingKb(true);
    setAutoGenMessage(null);
    try {
      const res = await fetch(`${API_BASE_URL}/knowledgebase/auto-generate`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ minClusterSize: 2 })
      });
      if (res.ok) {
        const result = await res.json();
        const count = result.articlesGenerated || 0;
        if (count > 0) {
          setAutoGenMessage(`⚡ Generated & added ${count} new FAQ article(s) from recurring resolved tickets!`);
          fetchArticles();
        } else {
          setAutoGenMessage(result.message || 'No recurring clusters of resolved tickets detected yet.');
        }
      } else {
        setAutoGenMessage('Auto KB generation service response error.');
      }
    } catch (err) {
      setAutoGenMessage('Error during auto KB generation: ' + err.message);
    } finally {
      setGeneratingKb(false);
    }
  };

  useEffect(() => {
    fetchArticles();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/categories`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setCategories(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
    });
  };

  const getHeaders = () => {
    const base = authHeaders ? (typeof authHeaders === 'function' ? authHeaders() : authHeaders) : {};
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...base
    };
  };

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/knowledgebase`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setArticles(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch KB articles:', err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setTitle('');
    setSummary('');
    setContent('');
    setKeywords('');
    setSelectedCategoryId('');
    setAttachmentScreenshot(null);
    setAttachmentBase64(null);
    setEditingArticle(null);
    setShowAddModal(true);
  };

  const openEditModal = (article, e) => {
    if (e) e.stopPropagation();
    setEditingArticle(article);
    setTitle(article.title || '');
    setSummary(article.summary || '');
    setContent(article.content || '');
    setKeywords(article.keywords || '');
    const catId = article.category?.categoryId || article.categoryId || '';
    setSelectedCategoryId(catId ? String(catId) : '');
    setAttachmentScreenshot(null);
    setAttachmentBase64(article.attachmentBase64 || null);
    setShowAddModal(true);
  };

  const handleSaveArticle = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSubmitting(true);
    try {
      let finalB64 = attachmentBase64;
      if (attachmentScreenshot && !finalB64) {
        finalB64 = await convertToBase64(attachmentScreenshot);
      }

      const isEdit = !!editingArticle;
      const articleId = editingArticle ? (editingArticle.articleId || editingArticle.id) : null;
      const url = isEdit ? `${API_BASE_URL}/knowledgebase/${articleId}` : `${API_BASE_URL}/knowledgebase`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify({
          title,
          summary,
          content,
          keywords,
          category: selectedCategoryId ? { categoryId: Number(selectedCategoryId) } : null,
          attachmentBase64: finalB64,
          attachmentName: attachmentScreenshot ? attachmentScreenshot.name : (editingArticle?.attachmentName || null),
          attachmentType: attachmentScreenshot ? (attachmentScreenshot.type || 'image/png') : (editingArticle?.attachmentType || null)
        })
      });

      if (res.ok) {
        const savedArticle = await res.json();
        setShowAddModal(false);
        setEditingArticle(null);
        if (selectedArticle && isEdit) {
          setSelectedArticle(savedArticle);
        }
        fetchArticles();
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error('KB Save error:', res.status, errData);
        alert(`Failed to save article (${res.status}). Please check backend service.`);
      }
    } catch (err) {
      console.error('Failed to save article:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteArticle = async (articleId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this Knowledge Base article?')) return;

    try {
      const res = await fetch(`${API_BASE_URL}/knowledgebase/${articleId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok || res.status === 204) {
        if (selectedArticle && (selectedArticle.articleId === articleId || selectedArticle.id === articleId)) {
          setSelectedArticle(null);
        }
        fetchArticles();
      }
    } catch (err) {
      console.error('Failed to delete KB article:', err);
    }
  };

  const filteredArticles = articles.filter(a => {
    const q = searchQuery.toLowerCase();
    return (
      (a.title && a.title.toLowerCase().includes(q)) ||
      (a.keywords && a.keywords.toLowerCase().includes(q)) ||
      (a.summary && a.summary.toLowerCase().includes(q)) ||
      (a.content && a.content.toLowerCase().includes(q))
    );
  });

  return (
    <div className="tab-fade">
      <div className="glass-card mb-4">
        <div className="card-header-flex mb-3">
          <div>
            <h4>📚 Knowledge Base Repository</h4>
            <p className="text-muted-xs">Manage step-by-step guides, troubleshooting procedures, and verified solutions with attachments.</p>
          </div>
          <div className="flex-align-center gap-2">
            {/* <button
              className="btn-premium btn-sm"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', borderColor: '#f59e0b' }}
              onClick={handleAutoGenerateKb}
              disabled={generatingKb}
              title="Cluster resolved tickets using Sentence-BERT and auto-generate FAQs"
            >
              <Sparkles size={15} /> {generatingKb ? 'Clustering Tickets...' : 'AI Auto-Generate FAQs'}
            </button> */}
            <button className="btn-premium btn-sm" onClick={openAddModal}>
              <Plus size={16} /> Add Article
            </button>
          </div>
        </div>

        {autoGenMessage && (
          <div className="glass-card mb-3" style={{ padding: '10px 14px', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 8 }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fbbf24' }}>{autoGenMessage}</span>
            <button style={{ background: 'transparent', border: 'none', color: '#fbbf24', cursor: 'pointer' }} onClick={() => setAutoGenMessage(null)}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* Search */}
        <div className="search-bar-row mb-4">
          <Search size={16} className="search-ico-svg" />
          <input
            type="text"
            className="input-premium search-input-padded"
            placeholder="Search KB articles by title, keywords, or symptoms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="empty-state"><p>Loading Knowledge Base...</p></div>
        ) : filteredArticles.length === 0 ? (
          <div className="empty-state">
            <BookOpen size={36} className="empty-ico-svg" />
            <p>No articles found. Click "Add Article" to create a new solution guide.</p>
          </div>
        ) : (
          <div className="kb-grid">
            {filteredArticles.map(article => {
              const artId = article.articleId || article.id;
              return (
                <div
                  key={artId}
                  className="glass-card article-card cursor-pointer"
                  onClick={() => setSelectedArticle(article)}
                >
                  <div className="article-header-row">
                    <span className="badge-premium badge-p3">Article #{artId}</span>
                    <div className="article-actions-top">
                      <button
                        className="icon-action-btn-xs"
                        onClick={(e) => openEditModal(article, e)}
                        title="Edit Article"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        className="icon-action-btn-xs text-danger"
                        onClick={(e) => handleDeleteArticle(artId, e)}
                        title="Delete Article"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <h5>{article.title}</h5>
                  <p className="summary">{article.summary || article.content?.substring(0, 100)}...</p>

                  {article.keywords && (
                    <div className="kw-row">
                      {article.keywords.split(',').map((kw, i) => (
                        <span key={i} className="kw-pill">{kw.trim()}</span>
                      ))}
                    </div>
                  )}

                  <div className="card-footer-row mt-2">
                    {article.attachmentBase64 ? (
                      <span className="text-muted-xs flex-align-center gap-1">
                        <Paperclip size={11} /> Has Attachment
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
      </div>

      {/* Structured Article Reader Modal */}
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
              {/* Structured Tag & Metadata Row */}
              <div className="structured-meta-bar mb-3">
                <span className="meta-badge">
                  <Tag size={13} /> {selectedArticle.category?.categoryName || 'General IT Support'}
                </span>
                {selectedArticle.updatedAt && (
                  <span className="text-muted-xs">
                    Updated: {formatDate(selectedArticle.updatedAt)}
                  </span>
                )}
              </div>

              {/* Summary */}
              {selectedArticle.summary && (
                <div className="summary-accent mb-3">
                  <FileText size={16} className="summary-icon" />
                  <div>
                    <strong>Summary: </strong>
                    <span>{selectedArticle.summary}</span>
                  </div>
                </div>
              )}

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

              {/* Detailed Resolution Content */}
              <div className="field-group mb-4">
                <label className="text-muted-xs font-semibold uppercase">Step-by-Step Resolution Guide</label>
                <div className="desc-box content-structured-box">
                  {selectedArticle.content ? (
                    selectedArticle.content.split('\n').map((line, idx) => (
                      <p key={idx} className={line.trim().startsWith('-') || line.trim().startsWith('*') ? 'list-step' : ''}>
                        {line}
                      </p>
                    ))
                  ) : (
                    <p>No detailed resolution steps provided for this article.</p>
                  )}
                </div>
              </div>

              {/* Attachment / Architecture / Illustration Preview */}
              {selectedArticle.attachmentBase64 && (
                <div className="field-group mb-4">
                  <label className="text-muted-xs font-semibold uppercase flex-align-center gap-1">
                    <Paperclip size={13} /> Guide Attachment / Screenshot ({selectedArticle.attachmentName || 'Visual Guide'})
                  </label>
                  <div className="attachment-preview-container">
                    <img src={selectedArticle.attachmentBase64} alt="KB Attachment" className="kb-attachment-img" />
                  </div>
                </div>
              )}

              {/* Action Controls Footer */}
              <div className="modal-actions-flex mt-4">
                <div className="flex gap-2">
                  <button
                    className="btn-glass btn-sm"
                    onClick={(e) => {
                      const art = selectedArticle;
                      setSelectedArticle(null);
                      openEditModal(art, e);
                    }}
                  >
                    <Edit3 size={14} /> Edit Article
                  </button>
                  <button
                    className="btn-glass btn-sm text-danger"
                    onClick={(e) => handleDeleteArticle(selectedArticle.articleId || selectedArticle.id, e)}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>

                <button className="btn-premium btn-sm" onClick={() => setSelectedArticle(null)}>
                  <CheckCircle2 size={14} /> Done Viewing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Article Popup Modal */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="glass-panel modal-dialog kb-form-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingArticle ? 'Edit Knowledge Base Article' : 'Create Knowledge Base Article'}</h3>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveArticle} className="modal-body">
              <div className="field-group mb-3">
                <label>Article Title *</label>
                <input
                  type="text"
                  className="input-premium"
                  placeholder="e.g. Fixing VPN Disconnection Issues on Windows 11"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="field-group mb-3">
                <label>Category (Topic Allocation)</label>
                <select
                  className="input-premium"
                  style={{ width: '100%', cursor: 'pointer' }}
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                >
                  <option value="">General Support (Uncategorized)</option>
                  {categories.map(c => (
                    <option key={c.categoryId} value={c.categoryId}>
                      {c.categoryName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-group mb-3">
                <label>Short Executive Summary</label>
                <input
                  type="text"
                  className="input-premium"
                  placeholder="Brief 1-sentence overview of the solution"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                />
              </div>

              <div className="field-group mb-3">
                <label>Step-by-Step Resolution Steps *</label>
                <textarea
                  className="input-premium"
                  rows="6"
                  placeholder="Provide step-by-step instructions for employees..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                />
              </div>

              <div className="field-group mb-3">
                <label>Keywords (Comma Separated)</label>
                <input
                  type="text"
                  className="input-premium"
                  placeholder="vpn, network, connection, timeout"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                />
              </div>

              {/* Attachment for KB Article */}
              <div className="field-group mb-4">
                <label>Article Illustration / Screenshot Attachment (Optional)</label>
                <div className="flex-align-center gap-2 mt-1">
                  <label className="btn-file-upload-solution" title="Attach image or diagram for article">
                    <Paperclip size={14} style={{ marginRight: 6 }} />
                    {attachmentScreenshot || attachmentBase64 ? 'Change Guide Image' : 'Attach Guide Image / Diagram'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setAttachmentScreenshot(file);
                          const b64 = await convertToBase64(file);
                          setAttachmentBase64(b64);
                        }
                      }}
                      style={{ display: 'none' }}
                    />
                  </label>

                  {(attachmentScreenshot || attachmentBase64) && (
                    <div className="attachment-chip">
                      <Paperclip size={12} />
                      <span>{attachmentScreenshot ? attachmentScreenshot.name : (editingArticle?.attachmentName || 'Attached Image')}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setAttachmentScreenshot(null);
                          setAttachmentBase64(null);
                        }}
                        className="chip-remove-btn"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn-premium" disabled={submitting}>
                  {editingArticle ? 'Save Changes' : 'Publish Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        /* Centered Popup Modal Overlay */
        .modal-backdrop {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          inset: 0 !important;
          background: rgba(4, 3, 10, 0.65) !important;
          backdrop-filter: blur(8px) !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          z-index: 2000 !important;
          padding: 20px !important;
        }

        .modal-dialog {
          width: 100% !important;
          max-width: 680px !important;
          max-height: 88vh !important;
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

        .card-header-flex { display: flex; justify-content: space-between; align-items: center; }
        .text-muted-xs { font-size: 0.78rem; color: var(--text-muted); }
        .btn-sm { padding: 8px 16px; font-size: 0.82rem; display: flex; align-items: center; gap: 6px; }
        .search-bar-row { position: relative; display: flex; align-items: center; }
        .search-ico-svg { position: absolute; left: 14px; color: var(--text-muted); }
        .search-input-padded { padding-left: 42px; width: 100%; }
        .kb-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
        .article-card { padding: 20px; display: flex; flex-direction: column; gap: 10px; transition: transform 0.2s, box-shadow 0.2s; }
        .article-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-neon); }
        .article-header-row { display: flex; justify-content: space-between; align-items: center; }
        .article-tag { font-size: 0.7rem; font-weight: 700; color: var(--accent-cyan); text-transform: uppercase; }
        .article-actions-top { display: flex; gap: 6px; }
        .icon-action-btn-xs { background: none; border: 1px solid var(--border); color: var(--text-muted); border-radius: 6px; padding: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .icon-action-btn-xs:hover { color: var(--text-primary); border-color: var(--accent-purple); background: var(--bg-hover); }
        .icon-action-btn-xs.text-danger:hover { color: #ef4444; border-color: rgba(239, 68, 68, 0.4); }
        .article-card h5 { margin: 0; font-size: 1.05rem; color: var(--text-primary); }
        .summary { font-size: 0.84rem; color: var(--text-secondary); margin: 0; line-height: 1.5; }
        .kw-row { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 4px; }
        .kw-pill { font-size: 0.7rem; padding: 3px 10px; border-radius: 99px; background: rgba(139, 92, 246, 0.12); color: var(--accent-purple); border: 1px solid rgba(139, 92, 246, 0.25); }
        .card-footer-row { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); padding-top: 10px; margin-top: auto; }
        .read-more-link { font-size: 0.8rem; color: var(--accent-cyan); font-weight: 600; display: flex; align-items: center; gap: 4px; cursor: pointer; }
        
        /* Structured Viewer Modal Styles */
        .structured-kb-modal { max-width: 680px !important; }
        .structured-meta-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .meta-badge { font-size: 0.78rem; color: var(--accent-cyan); background: rgba(6, 182, 212, 0.1); padding: 4px 10px; border-radius: 6px; border: 1px solid rgba(6, 182, 212, 0.2); display: flex; align-items: center; gap: 6px; }
        .summary-accent { background: rgba(139, 92, 246, 0.08); border-left: 3px solid var(--accent-purple); padding: 12px 16px; border-radius: 6px; color: var(--text-primary); font-size: 0.88rem; display: flex; gap: 10px; align-items: flex-start; }
        .summary-icon { color: var(--accent-purple); flex-shrink: 0; margin-top: 2px; }
        .content-structured-box { background: var(--bg-hover); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 16px; font-size: 0.9rem; color: var(--text-primary); line-height: 1.6; }
        .content-structured-box p { margin-bottom: 8px; }
        .content-structured-box p.list-step { padding-left: 12px; border-left: 2px solid var(--accent-cyan); margin-left: 4px; color: var(--text-secondary); }
        
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
        .btn-file-upload-solution {
          display: inline-flex;
          align-items: center;
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          background: var(--bg-card);
          border: 1px dashed var(--accent-cyan);
          color: var(--accent-cyan);
          font-size: 0.76rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-file-upload-solution:hover {
          background: rgba(6, 182, 212, 0.12);
        }
        .attachment-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 99px;
          background: rgba(6, 182, 212, 0.12);
          border: 1px solid rgba(6, 182, 212, 0.3);
          color: var(--accent-cyan);
          font-size: 0.75rem;
        }
        .chip-remove-btn {
          background: transparent;
          border: none;
          color: inherit;
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 0;
        }

        .modal-actions-flex { display: flex; justify-content: space-between; align-items: center; }
        .empty-state { display: flex; flex-direction: column; align-items: center; padding: 40px 20px; color: var(--text-muted); }
        .empty-ico-svg { margin-bottom: 12px; }
        .mb-3 { margin-bottom: 16px; }
        .mb-4 { margin-bottom: 24px; }
        .form-actions { display: flex; justify-content: flex-end; gap: 12px; }
        .btn-secondary { background: var(--bg-hover); border: 1px solid var(--border); color: var(--text-secondary); padding: 10px 20px; border-radius: var(--radius-sm); cursor: pointer; }
      `}</style>
    </div>
  );
}
