import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Sparkles, 
  FileText, 
  Upload, 
  Download, 
  Copy, 
  Check, 
  ArrowRight, 
  AlertTriangle, 
  FileCheck, 
  RefreshCw, 
  ExternalLink,
  Layers,
  Sliders,
  CheckCircle2,
  Trash2,
  BookOpen,
  Cpu
} from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

function CircularGauge({ value, color = '#10b981', size = 78, strokeWidth = 7 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, value));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#f1f5f9"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={clamped === 0 && color !== '#10b981' ? '#cbd5e1' : color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      </svg>
      <div style={{ position: 'absolute', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{Math.round(clamped)}%</span>
      </div>
    </div>
  );
}

function renderCheckedText(text, segments) {
  const ranges=[];
  for(const seg of segments||[]) {
    if(seg.type==='plagiarism' && Array.isArray(seg.matched_spans)) for(const [start,end] of seg.matched_spans) ranges.push({start,end,type:'plagiarism',color:seg.color||'#cf4a54'});
    else if(seg.type==='ai') ranges.push({start:seg.start,end:seg.end,type:'ai',color:seg.color||'#a855f7'});
  }
  ranges.sort((a,b)=>a.start-b.start); const nodes=[]; let cursor=0;
  ranges.forEach((range,index)=>{const start=Math.max(cursor,range.start),end=Math.min(text.length,range.end);if(start>cursor)nodes.push(text.slice(cursor,start));if(end>start)nodes.push(<span key={index} className={range.type==='ai'?'highlight-span span-ai':'highlight-span span-plagiarism'} style={{'--match-color':range.color}} title={range.type==='ai'?'Writing-pattern cue; not proof of AI authorship':'Local phrase pattern'}>{text.slice(start,end)}</span>);cursor=Math.max(cursor,end);});
  if(cursor<text.length)nodes.push(text.slice(cursor)); return nodes;
}

export default function App() {
  // Navigation active tab: 'home' | 'checker' | 'remover'
  const [activeTab, setActiveTab] = useState('home');

  // Checker State
  const [checkInput, setCheckInput] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState(null);
  const [checkFileName, setCheckFileName] = useState('');

  // Remover State
  const [removerInput, setRemoverInput] = useState('');
  const [removerOutput, setRemoverOutput] = useState('');
  const [isRemoving, setIsRemoving] = useState(false);
  const [metricsBefore, setMetricsBefore] = useState(null);
  const [metricsAfter, setMetricsAfter] = useState(null);
  const [intensity, setIntensity] = useState('High');
  const [preserveTech, setPreserveTech] = useState(true);
  const [preserveCitations, setPreserveCitations] = useState(true);
  const [copied, setCopied] = useState(false);

  // File Upload Handler (Universal for checking or removing)
  const handleFileUpload = async (e, target) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error('File parse failed');
      const data = await res.json();

      if (target === 'checker') {
        setCheckFileName(file.name);
        setCheckInput(data.text);
        setCheckResult(data.metrics);
        setActiveTab('checker');
      } else {
        setRemoverInput(data.text);
        setActiveTab('remover');
      }
    } catch (err) {
      alert('Error parsing document: ' + err.message);
    }
  };

  // Run Similarity & AI Check
  const handleRunCheck = async () => {
    if (!checkInput.trim()) {
      alert('Please enter or upload some text to check.');
      return;
    }

    try {
      setIsChecking(true);
      const res = await fetch(`${API_BASE}/api/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: checkInput })
      });
      if (!res.ok) throw new Error('Check failed');
      const data = await res.json();
      setCheckResult(data);
    } catch (err) {
      alert('Error during similarity scan: ' + err.message);
    } finally {
      setIsChecking(false);
    }
  };

  // Run 100% Plagiarism & AI Removal
  const handleRunRemoval = async () => {
    if (!removerInput.trim()) {
      alert('Please enter or upload some text to humanize.');
      return;
    }

    try {
      setIsRemoving(true);
      const res = await fetch(`${API_BASE}/api/humanize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: removerInput,
          intensity,
          preserve_technical: preserveTech,
          preserve_citations: preserveCitations
        })
      });
      if (!res.ok) throw new Error('Humanization failed');
      const data = await res.json();
      setRemoverOutput(data.humanized_text);
      setMetricsBefore(data.metrics_before);
      setMetricsAfter(data.metrics_after);
    } catch (err) {
      alert('Error during humanization: ' + err.message);
    } finally {
      setIsRemoving(false);
    }
  };

  // Transfer flagged check text directly into remover
  const handleSendToRemover = () => {
    setRemoverInput(checkInput);
    setActiveTab('remover');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Download similarity review PDF
  const handleDownloadReviewPDF = async () => {
    if (!checkInput.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/api/report/turnitin-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: checkInput,
          filename: checkFileName || 'Originality_Audit',
          check_result: checkResult
        })
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = (checkFileName ? checkFileName.replace(/\.[^/.]+$/, "") : "Similarity_Review") + "_Similarity_Review.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert('Failed to generate PDF: ' + err.message);
    }
  };

  // Download Cleared PDF Report
  const handleDownloadClearedPdfReport = async () => {
    const textToExport = removerOutput || checkInput;
    if (!textToExport.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/api/report/cleared-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          original_text: removerInput || checkInput,
          humanized_text: textToExport,
          filename: checkFileName || 'Cleared_Submission',
          metrics_before: metricsBefore || checkResult,
          metrics_after: metricsAfter || checkResult
        })
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = (checkFileName ? checkFileName.replace(/\.[^/.]+$/, "") : "Turnitout") + "_100%_Cleared_Originality_Report.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert('Failed to generate Cleared PDF report: ' + err.message);
    }
  };

  // Download similarity review as an editable Word document
  const handleDownloadSimilarityDocx = async () => {
    if (!checkInput.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/api/report/similarity-docx`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: checkInput, filename: checkFileName || 'Similarity_Review', check_result: checkResult })
      });
      if (!res.ok) throw new Error('Word report generation failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = (checkFileName ? checkFileName.replace(/\.[^/.]+$/, '') : 'Similarity_Review') + '_Similarity_Review.docx';
      document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to generate Word review: ' + err.message);
    }
  };

  // Download Word Report
  const handleDownloadWordReport = async () => {
    const textToExport = removerOutput || checkInput;
    if (!textToExport.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/api/report/cleared-docx`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          original_text: removerInput || checkInput,
          humanized_text: textToExport,
          filename: checkFileName || 'Cleared_Submission',
          metrics_before: metricsBefore || checkResult,
          metrics_after: metricsAfter || checkResult
        })
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = (checkFileName ? checkFileName.replace(/\.[^/.]+$/, "") : "Turnitout") + "_Cleared_Academic_Report.docx";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert('Failed to generate Word report: ' + err.message);
    }
  };

  // Export raw files
  const handleExport = async (format) => {
    if (!removerOutput) return;
    try {
      const res = await fetch(`${API_BASE}/api/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: removerOutput,
          format: format,
          filename: checkFileName ? checkFileName.replace(/\.[^/.]+$/, "") + "_Cleared" : 'Turnitout_Cleared_Paper'
        })
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${checkFileName ? checkFileName.replace(/\.[^/.]+$/, "") + "_Cleared" : "Turnitout_Cleared_Paper"}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert('Export failed: ' + err.message);
    }
  };

  // Copy Cleaned Text
  const handleCopy = () => {
    if (!removerOutput) return;
    navigator.clipboard.writeText(removerOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Load sample academic paragraph
  const loadAcademicSample = () => {
    const sample = `Because herbal extracts possess antioxidant properties, they play a crucial role in the development of modern lip balm. In addition to this, a wide variety of studies have shown significant improvements in formulation stability. Due to the fact that heavy metals pose serious risks to human health, it is important to note that rigorous testing must be carried out.\n\n[21] Sankpal RM, Kadam SR, Aswale NS, Navale SS. Review on lip balm. Int J Adv Res Sci Commun Technol. 2022; 2(1):451-453.\n[22] Navgire SS, Pawar P, Kamble G, Kulkarni K. Formulation and evaluation of lip balm. Int Res J Educ Technol. 2026; 9(4).`;
    if (activeTab === 'checker') {
      setCheckInput(sample);
      setCheckFileName('Lip_Balm_Research_Sample.docx');
    } else {
      setRemoverInput(sample);
    }
  };

  return (
    <div>
      {/* Top Navigation */}
      <nav className="navbar">
        <div className="nav-brand" onClick={() => setActiveTab('home')}>
          <div style={{ background: '#0284c7', padding: '6px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}>
            <ShieldCheck size={22} color="white" />
          </div>
          <span className="brand-logo-text">turnitout</span>
          <span className="brand-badge">Academic Suite</span>
        </div>

        <div className="nav-links">
          <button 
            className={`nav-btn ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTab('home')}
          >
            Overview
          </button>
          <button 
            className={`nav-btn ${activeTab === 'checker' ? 'active' : ''}`}
            onClick={() => setActiveTab('checker')}
          >
            <Search size={16} /> Similarity Checker
          </button>
          <button 
            className={`nav-btn ${activeTab === 'remover' ? 'active' : ''}`}
            onClick={() => setActiveTab('remover')}
          >
            <Sparkles size={16} /> Revision assistant
          </button>
        </div>

        <div className="nav-status">
          <CheckCircle2 size={14} /> Private local review
        </div>
      </nav>

      {/* VIEW 1: LANDING PAGE (Turnitin Inspired) */}
      {activeTab === 'home' && (
        <div>
          <div className="hero-section">
            <div className="hero-content">
              <div className="hero-pill">
                <ShieldCheck size={16} /> A clearer way to review academic writing
              </div>
              <h1 className="hero-title">
                Empower Students & Researchers to Do Their Best, Original Work
              </h1>
              <p className="hero-subtitle">
                Review possible text overlap, inspect writing-pattern signals, and revise passages with your own understanding. Turnitout uses a local heuristic scan; it does not connect to Turnitin or certify a paper as original.
              </p>

              {/* DUAL CORE OPTIONS */}
              <div className="dual-options-grid">
                {/* Option 1: Checker */}
                <div className="option-card checker-card" onClick={() => setActiveTab('checker')}>
                  <div>
                    <div className="option-header">
                      <div className="option-icon-box checker-icon-box">
                        <Search size={26} />
                      </div>
                      <span className="option-tag tag-red">Similarity review</span>
                    </div>
                    <h3 className="option-title">Similarity & writing signals</h3>
                    <p className="option-desc">
                      See potential phrase matches and writing-pattern signals in context, with a color key and review notes inspired by academic similarity reports.
                    </p>
                    <ul className="option-features">
                      <li><Check size={16} color="#ef4444" /> Color-coded highlighted text viewer</li>
                      <li><Check size={16} color="#ef4444" /> Local phrase-pattern review</li>
                      <li><Check size={16} color="#ef4444" /> Export a review summary for your own records</li>
                    </ul>
                  </div>
                  <button className="cta-btn cta-checker">
                    Open review workspace <ArrowRight size={18} />
                  </button>
                </div>

                {/* Option 2: Remover */}
                <div className="option-card remover-card" onClick={() => setActiveTab('remover')}>
                  <div>
                    <div className="option-header">
                      <div className="option-icon-box remover-icon-box">
                        <Sparkles size={26} />
                      </div>
                      <span className="option-tag tag-green">Revision workspace</span>
                    </div>
                    <h3 className="option-title">Originality revision workspace</h3>
                    <p className="option-desc">
                      Rework passages using your own analysis, cite source material, and compare a revised draft side by side. No tool can guarantee a particular similarity or AI score.
                    </p>
                    <ul className="option-features">
                      <li><Check size={16} color="#16a34a" /> Revise ideas in your own words and cite sources</li>
                      <li><Check size={16} color="#16a34a" /> AI indicators are uncertain and need human review</li>
                      <li><Check size={16} color="#16a34a" /> Keep citations and technical terms in view</li>
                    </ul>
                  </div>
                  <button className="cta-btn cta-remover">
                    Open revision workspace <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Upload Banner */}
          <div className="main-wrapper" style={{ marginTop: '2.5rem' }}>
            <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '12px', padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h4 style={{ fontSize: '1.1rem', color: '#0369a1', fontWeight: 700, marginBottom: '0.25rem' }}>Supported File Formats</h4>
                <p style={{ color: '#0284c7', fontSize: '0.9rem' }}>Add a document or paste text. Supported: Word, PDF, LaTeX, and plain text.</p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <label className="btn-primary" style={{ cursor: 'pointer' }}>
                  <Upload size={16} /> Upload for Checking
                  <input type="file" accept=".txt,.pdf,.docx,.tex" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, 'checker')} />
                </label>
                <label className="btn-success" style={{ cursor: 'pointer' }}>
                  <Upload size={16} /> Upload for Removal
                  <input type="file" accept=".txt,.pdf,.docx,.tex" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, 'remover')} />
                </label>
              </div>
            </div>
          </div>
          <section className="workflow-section"><div className="section-eyebrow">A transparent workflow</div><h2 className="section-title">From first scan to a stronger draft</h2><p className="section-copy">Review the context of each match, check the cited source, then decide what needs a quotation, citation, or fresh explanation.</p><div className="steps-grid"><article className="step-card"><div className="step-num">01</div><h3>Bring in your draft</h3><p>Paste or upload text. The local scan looks for recurring phrases and writing-pattern cues.</p></article><article className="step-card"><div className="step-num">02</div><h3>Inspect each highlight</h3><p>Compare potential overlaps with your source and check that attribution is clear.</p></article><article className="step-card"><div className="step-num">03</div><h3>Revise with understanding</h3><p>Explain ideas using your own reasoning, quote distinctive wording, and preserve attribution.</p></article></div><div className="report-preview"><div className="preview-topbar"><span>Similarity report · illustrative view</span><span>Match overview &nbsp;›</span></div><div className="preview-body"><div className="preview-paper">A careful review begins by comparing the <span className="mark-red">key wording in a passage with the source</span> and checking whether the idea has been attributed. Researchers can then <span className="mark-amber">explain the evidence in the context of their own findings</span>, while retaining any required quotation. <span className="mark-blue">A clear citation lets readers trace the original work</span>.<p className="legend-note">Illustrative interface preview only. This app uses local phrase heuristics rather than Turnitin’s source collections.</p></div><aside className="preview-sidebar"><h4>Potential matches</h4><div className="preview-source"><span className="source-label"><i className="source-swatch" style={{background:'#cf6970'}}/>Match group 1</span><b>12%</b></div><div className="preview-source"><span className="source-label"><i className="source-swatch" style={{background:'#d3a34b'}}/>Match group 2</span><b>7%</b></div><div className="preview-source"><span className="source-label"><i className="source-swatch" style={{background:'#6696ce'}}/>Match group 3</span><b>4%</b></div><p className="legend-note">A match percentage prompts review; it is not a plagiarism finding.</p></aside></div></div></section>
          <section className="workflow-section"><div className="section-eyebrow">Revision, with context</div><h2 className="section-title">How the revision workspace helps</h2><p className="section-copy">Compare a passage and its revision, then check meaning, your own reasoning, and source attribution before exporting.</p><div className="steps-grid"><article className="step-card"><div className="step-num">A</div><h3>Understand the source</h3><p>Identify the idea you need to support instead of swapping words sentence by sentence.</p></article><article className="step-card"><div className="step-num">B</div><h3>Write your explanation</h3><p>Connect the evidence to your own claim, methods, or findings; quote exact wording when needed.</p></article><article className="step-card"><div className="step-num">C</div><h3>Verify and cite</h3><p>Review accuracy and attribution. No rewriting tool can promise a zero score or bypass an authorship detector.</p></article></div></section>
        </div>
      )}

      {/* VIEW 2: CHECKING HUB (Turnitin Interactive Highlighting Viewer) */}
      {activeTab === 'checker' && (
        <div className="main-wrapper">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#002f6c' }}>Similarity review</h2>
              <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Review phrase-pattern matches and writing cues sentence by sentence. Similarity is not a plagiarism verdict; AI signals are not proof of authorship.</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn-outline" onClick={loadAcademicSample}>
                <BookOpen size={16} /> Load Academic Sample
              </button>
              <label className="btn-outline" style={{ cursor: 'pointer' }}>
                <Upload size={16} /> Upload Document
                <input type="file" accept=".txt,.pdf,.docx,.tex" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, 'checker')} />
              </label>
            </div>
          </div>

          {/* Scores Overview Row */}
          {checkResult && (
            <div className="scores-summary-row">
              <div className="score-widget">
                <div className={`score-circle ${checkResult.overall_similarity > 20 ? 'circle-red' : (checkResult.overall_similarity > 5 ? 'circle-purple' : 'circle-green')}`}>
                  {checkResult.overall_similarity}%
                </div>
                <div>
                  <div className="score-label">Similarity Index</div>
                  <div className="score-sub">{checkResult.overall_similarity > 20 ? 'Potential overlap to review' : 'No local pattern flagged'}</div>
                </div>
              </div>

              <div className="score-widget">
                <div className={`score-circle ${checkResult.overall_ai_score > 25 ? 'circle-purple' : 'circle-green'}`}>
                  {checkResult.overall_ai_score}%
                </div>
                <div>
                  <div className="score-label">Writing-pattern signals</div>
                  <div className="score-sub">{checkResult.overall_ai_score > 25 ? 'Review cues present' : 'Few review cues'}</div>
                </div>
              </div>

              <div className="score-widget">
                <div className="score-circle circle-blue">
                  {checkResult.document_stats.words}
                </div>
                <div>
                  <div className="score-label">Total Words</div>
                  <div className="score-sub">{checkResult.document_stats.sentences} Sentences</div>
                </div>
              </div>

              <div className="score-widget">
                <div className="score-circle circle-green">
                  {checkResult.document_stats.burstiness}
                </div>
                <div>
                  <div className="score-label">Burstiness Index</div>
                  <div className="score-sub">Sentence Variation</div>
                </div>
              </div>
            </div>
          )}

          {/* Main Layout: Text Viewer & Sources Sidebar */}
          <div className="checker-layout">
            <div className="workspace-card">
              <div className="card-title-bar">
                <h2><FileText size={20} /> Document Content & Interactive Highlights</h2>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  {checkResult && (
                    <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8rem', fontWeight: 600 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#b91c1c' }}>
                        <span style={{ width: 10, height: 10, background: '#ef4444', borderRadius: '50%' }}></span> Potential overlap
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#7e22ce' }}>
                        <span style={{ width: 10, height: 10, background: '#a855f7', borderRadius: '50%' }}></span> Writing-pattern cue
                      </span>
                    </div>
                  )}
                  {checkInput && (
                    <button className="btn-outline" style={{ padding: '0.35rem 0.65rem' }} onClick={() => { setCheckInput(''); setCheckResult(null); }}>
                      <Trash2 size={14} /> Clear
                    </button>
                  )}
                </div>
              </div>

              {!checkResult ? (
                <div>
                  <textarea
                    className="textarea-box"
                    placeholder="Paste a passage to review for recurring phrases and writing-pattern cues..."
                    value={checkInput}
                    onChange={(e) => setCheckInput(e.target.value)}
                  />
                  <div className="action-bar">
                    <button className="btn-primary" style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }} onClick={handleRunCheck} disabled={isChecking}>
                      {isChecking ? <><RefreshCw className="animate-spin" size={18} /> Reviewing local patterns...</> : <><Search size={18} /> Run local review</>}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="highlight-viewer-box">
                    {renderCheckedText(checkInput, checkResult.highlighted_segments)}
                  </div>

                  {/* Actions for Checked Text */}
                  <div className="action-bar" style={{ justifyContent: 'space-between', marginTop: '1.25rem' }}>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button className="btn-outline" onClick={handleDownloadReviewPDF}>
                        <Download size={16} /> Download similarity review PDF
                      </button>
                      <button className="btn-outline" onClick={handleDownloadSimilarityDocx}>
                        <Download size={16} /> Download Word review
                      </button>
                    </div>
                    <button className="btn-success" onClick={handleSendToRemover} style={{ fontWeight: 700 }}>
                      <Sparkles size={18} /> ⚡ Review passages in revision workspace
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar: Sources Breakdown */}
            <div className="sources-card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#002f6c', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers size={18} /> Potential pattern groups
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.25rem' }}>Local phrase patterns only. No external database lookup is performed.</p>

              {checkResult && checkResult.matched_sources?.length > 0 ? (
                <div className="sources-list">
                  {checkResult.matched_sources.map((src, i) => (
                    <div key={i} className="source-item">
                      <div className="source-left">
                        <div className="source-rank" style={{ background: src.color || '#ef4444' }}>{i + 1}</div>
                        <div>
                          <div className="source-name" title="Local phrase heuristic">Local phrase pattern {i + 1}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Local heuristic</div>
                        </div>
                      </div>
                      <div className="source-pct">{src.percentage}%</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#16a34a', fontSize: '0.9rem' }}>
                  <CheckCircle2 size={36} color="#16a34a" style={{ margin: '0 auto 0.5rem' }} />
                  <b>No local phrase patterns flagged</b>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>This is not a guarantee of originality. Review sources and citations.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: REMOVAL & HUMANIZER HUB */}
      {activeTab === 'remover' && (
        <div className="main-wrapper">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#002f6c' }}>Originality revision workspace</h2>
              <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Use the review cues as a starting point: understand the source, write your own explanation, and keep accurate citations.</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn-outline" onClick={loadAcademicSample}>
                <BookOpen size={16} /> Load Academic Sample
              </button>
              <label className="btn-outline" style={{ cursor: 'pointer' }}>
                <Upload size={16} /> Upload Document
                <input type="file" accept=".txt,.pdf,.docx,.tex" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, 'remover')} />
              </label>
            </div>
          </div>

          {/* MODERN DUAL SCORECARD (Inspired by Reference Design) */}
          {(() => {
            const currentMetrics = metricsAfter || (metricsBefore ? {
              overall_similarity: metricsBefore.overall_similarity,
              overall_ai_score: metricsBefore.overall_ai_score
            } : {
              overall_similarity: 0,
              overall_ai_score: 0
            });

            const plagScore = currentMetrics.overall_similarity || 0;
            const exactMatchScore = plagScore;
            const partialMatchScore = currentMetrics.overall_ai_score || 0;
            const uniqueScore = Math.max(0, 100 - plagScore);

            return (
              <div className="modern-scorecard-grid">
                {/* Card 1: Similarity estimate / Similarity Meter */}
                <div className="modern-gauge-card">
                  <div className="gauge-left-cluster">
                    <CircularGauge 
                      value={plagScore} 
                      color={plagScore > 20 ? '#ef4444' : (plagScore > 0 ? '#f59e0b' : '#cbd5e1')} 
                    />
                    <div className="gauge-title-box">
                      <span className="gauge-main-title">Similarity estimate</span>
                      <span className="gauge-subtitle">
                        {metricsAfter ? (
                          <span style={{ color: '#16a34a', fontWeight: 700 }}>Revision processed</span>
                        ) : (
                          metricsBefore ? `Flagged: ${metricsBefore.overall_similarity}%` : 'Local phrase-pattern estimate'
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Breakdown Bars */}
                  <div className="gauge-breakdown-list">
                    <div className="breakdown-row">
                      <div className="breakdown-meta">
                        <span className="breakdown-label">
                          <span className="breakdown-dot dot-red"></span> Local phrase patterns
                        </span>
                        <span className="breakdown-value">{exactMatchScore}%</span>
                      </div>
                      <div className="breakdown-track">
                        <div 
                          className="breakdown-fill" 
                          style={{ width: `${exactMatchScore}%`, background: '#ef4444' }}
                        />
                      </div>
                    </div>

                    <div className="breakdown-row">
                      <div className="breakdown-meta">
                        <span className="breakdown-label">
                          <span className="breakdown-dot dot-yellow"></span> Writing-pattern cues
                        </span>
                        <span className="breakdown-value">{partialMatchScore}%</span>
                      </div>
                      <div className="breakdown-track">
                        <div 
                          className="breakdown-fill" 
                          style={{ width: `${partialMatchScore}%`, background: '#f59e0b' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 2: Unique / No local pattern flagged Meter */}
                <div className="modern-gauge-card">
                  <div className="gauge-left-cluster">
                    <CircularGauge 
                      value={uniqueScore} 
                      color="#10b981" 
                    />
                    <div className="gauge-title-box">
                      <span className="gauge-main-title">{uniqueScore}% without local phrase flags</span>
                      <span className="gauge-subtitle">No local pattern flagged</span>
                    </div>
                  </div>

                  {/* Status & Badges */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', alignItems: 'flex-end' }}>
                    <span style={{ 
                      background: '#dcfce7', 
                      color: '#15803d', 
                      fontSize: '0.78rem', 
                      fontWeight: 700, 
                      padding: '0.35rem 0.8rem', 
                      borderRadius: '999px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      <Check size={13} /> {metricsAfter ? 'Revision ready to review' : 'Local heuristic snapshot'}
                    </span>
                    <span style={{ 
                      background: '#f0fdf4', 
                      color: '#166534', 
                      border: '1px solid #bbf7d0',
                      fontSize: '0.75rem', 
                      fontWeight: 600, 
                      padding: '0.25rem 0.65rem', 
                      borderRadius: '999px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <ShieldCheck size={12} /> Heuristic output only
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* MODERN PILL TOOLBAR */}
          <div className="modern-pill-toolbar">
            <div className="pill-group-left">
              <button className="nav-pill-btn active-blue">
                <Sparkles size={15} /> Revision assistant
              </button>
              <button 
                className="nav-pill-btn" 
                onClick={() => setIntensity(intensity === 'High' ? 'Medium' : 'High')}
                title="Toggle Intensity"
              >
                <Sliders size={15} /> Intensity: <b>{intensity}</b>
              </button>
              <button 
                className={`nav-pill-btn ${preserveCitations ? 'active-toggle' : ''}`}
                onClick={() => setPreserveCitations(!preserveCitations)}
              >
                <CheckCircle2 size={15} color={preserveCitations ? '#16a34a' : '#94a3b8'} />
                Citations Protected
              </button>
              <button 
                className={`nav-pill-btn ${preserveTech ? 'active-toggle' : ''}`}
                onClick={() => setPreserveTech(!preserveTech)}
              >
                <CheckCircle2 size={15} color={preserveTech ? '#16a34a' : '#94a3b8'} />
                Technical Terms Kept
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div className="status-stat-pill">
                <FileText size={14} color="#0284c7" />
                <span>{removerInput.trim() ? `${removerInput.trim().split(/\s+/).length} words ready` : 'Draft ready to clean'}</span>
              </div>
              <button 
                className="btn-success" 
                onClick={handleRunRemoval} 
                disabled={isRemoving}
                style={{ padding: '0.6rem 1.4rem', borderRadius: '999px', fontSize: '0.9rem', fontWeight: 700 }}
              >
                {isRemoving ? <><RefreshCw className="animate-spin" size={15} /> Preparing revision...</> : <><Sparkles size={15} /> Revise draft with your own analysis</>}
              </button>
            </div>
          </div>

          {/* Side by Side Panes */}
          <div className="remover-grid">
            {/* Input Pane */}
            <div className="pane-card">
              <div className="card-title-bar">
                <h2><FileText size={18} /> Draft to review</h2>
                {removerInput && (
                  <button className="btn-outline" style={{ padding: '0.3rem 0.6rem' }} onClick={() => setRemoverInput('')}>
                    <Trash2 size={14} /> Clear
                  </button>
                )}
              </div>
              <textarea
                className="textarea-box"
                placeholder="Paste a passage you want to review and revise..."
                value={removerInput}
                onChange={(e) => setRemoverInput(e.target.value)}
              />
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>
                {removerInput.split(/\s+/).filter(Boolean).length} Words | {removerInput.length} Characters
              </div>
            </div>

            {/* Output Pane */}
            <div className="pane-card">
              <div className="card-title-bar">
                <h2 style={{ color: '#16a34a' }}><FileCheck size={18} /> Revised draft</h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn-outline" onClick={handleCopy} disabled={!removerOutput}>
                    {copied ? <Check size={14} color="#16a34a" /> : <Copy size={14} />} {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
              <textarea
                className="textarea-box"
                placeholder="Your revision will appear here for review. Check meaning and citations before use."
                value={removerOutput}
                onChange={(e) => setRemoverOutput(e.target.value)}
                style={{ background: '#f8fafc', borderColor: removerOutput ? '#86efac' : '#cbd5e1' }}
              />
              <div className="action-bar" style={{ justifyContent: 'space-between' }}>
                <div style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 600 }}>
                  {removerOutput && 'Review the revised wording and verify every source citation.'}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button className="btn-outline" onClick={() => handleExport('docx')} disabled={!removerOutput} title="Download cleaned manuscript in Word format">
                    <Download size={14} /> .docx
                  </button>
                  <button className="btn-outline" onClick={() => handleExport('pdf')} disabled={!removerOutput} title="Download cleaned manuscript in PDF format">
                    <Download size={14} /> .pdf
                  </button>
                  <button className="btn-outline" onClick={() => handleExport('txt')} disabled={!removerOutput} title="Download cleaned plain text">
                    <Download size={14} /> .txt
                  </button>
                  <button className="btn-primary" onClick={handleDownloadClearedPdfReport} disabled={!removerOutput} title="Download revision summary PDF">
                    <FileCheck size={14} /> Revision summary (PDF)
                  </button>
                  <button className="btn-outline" onClick={handleDownloadWordReport} disabled={!removerOutput} title="Download revision summary in Word format">
                    <FileText size={14} /> Revision details (.docx)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="app-footer"><p className="footer-attribution">Turnitout • Created by Devendra Ahire • Academic writing review</p><p>Similarity results identify possible text overlap, not plagiarism. AI writing indicators are heuristic and cannot determine authorship. Review the original sources and your institution’s guidance.</p></footer>
    </div>
  );
}
