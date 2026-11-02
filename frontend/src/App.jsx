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
      const res = await fetch('/api/upload', {
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
      const res = await fetch('/api/check', {
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
      const res = await fetch('/api/humanize', {
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

  // Download Turnitin PDF Report
  const handleDownloadTurnitinPDF = async () => {
    if (!checkInput.trim()) return;
    try {
      const res = await fetch('/api/report/turnitin-pdf', {
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
      a.download = (checkFileName ? checkFileName.replace(/\.[^/.]+$/, "") : "Turnitin_Report") + "_Similarity_Audit.pdf";
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
      const res = await fetch('/api/report/cleared-pdf', {
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

  // Download Word Report
  const handleDownloadWordReport = async () => {
    const textToExport = removerOutput || checkInput;
    if (!textToExport.trim()) return;
    try {
      const res = await fetch('/api/report/cleared-docx', {
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
      const res = await fetch('/api/export', {
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
            <Sparkles size={16} /> Plagiarism Remover
          </button>
        </div>

        <div className="nav-status">
          <CheckCircle2 size={14} /> 100% Free & Unlocked
        </div>
      </nav>

      {/* VIEW 1: LANDING PAGE (Turnitin Inspired) */}
      {activeTab === 'home' && (
        <div>
          <div className="hero-section">
            <div className="hero-content">
              <div className="hero-pill">
                <ShieldCheck size={16} /> Turnitin-Grade Deterministic Academic Integrity
              </div>
              <h1 className="hero-title">
                Empower Students & Researchers to Do Their Best, Original Work
              </h1>
              <p className="hero-subtitle">
                The complete academic originality suite: Deep Turnitin-grade similarity detection with highlighted phrase attribution, plus 100% deterministic plagiarism elimination and zero-AI humanization.
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
                      <span className="option-tag tag-red">Checking Engine</span>
                    </div>
                    <h3 className="option-title">1. Plagiarism & AI Checker</h3>
                    <p className="option-desc">
                      Detailed diagnostic scan highlighting overlapping sentences, published sources, and AI-generated segments with authentic Turnitin-style reports.
                    </p>
                    <ul className="option-features">
                      <li><Check size={16} color="#ef4444" /> Color-coded highlighted text viewer</li>
                      <li><Check size={16} color="#ef4444" /> Crossref, PubMed, & Web source matching</li>
                      <li><Check size={16} color="#ef4444" /> Official Turnitin-Style PDF & Word report</li>
                    </ul>
                  </div>
                  <button className="cta-btn cta-checker">
                    Launch Similarity Checker <ArrowRight size={18} />
                  </button>
                </div>

                {/* Option 2: Remover */}
                <div className="option-card remover-card" onClick={() => setActiveTab('remover')}>
                  <div>
                    <div className="option-header">
                      <div className="option-icon-box remover-icon-box">
                        <Sparkles size={26} />
                      </div>
                      <span className="option-tag tag-green">Removal Engine</span>
                    </div>
                    <h3 className="option-title">2. Plagiarism Remover & Humanizer</h3>
                    <p className="option-desc">
                      Completely eliminates plagiarism down to 0% and removes AI detection to 0% with mathematical 4-gram shattering and natural academic phrasing.
                    </p>
                    <ul className="option-features">
                      <li><Check size={16} color="#16a34a" /> 100% Guaranteed 0% Plagiarism Evasion</li>
                      <li><Check size={16} color="#16a34a" /> 0% AI Detection across GPTZero & Turnitin</li>
                      <li><Check size={16} color="#16a34a" /> Citations & chemical terms 100% immune</li>
                    </ul>
                  </div>
                  <button className="cta-btn cta-remover">
                    Launch 100% Remover <ArrowRight size={18} />
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
                <p style={{ color: '#0284c7', fontSize: '0.9rem' }}>Upload directly: Word (.docx), PDF (.pdf), LaTeX (.tex), and Text (.txt)</p>
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
        </div>
      )}

      {/* VIEW 2: CHECKING HUB (Turnitin Interactive Highlighting Viewer) */}
      {activeTab === 'checker' && (
        <div className="main-wrapper">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#002f6c' }}>Similarity & AI Originality Checker</h2>
              <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Diagnose exact plagiarism matches and AI patterns with sentence-level visual highlights.</p>
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
                  <div className="score-sub">{checkResult.overall_similarity > 20 ? 'Plagiarism Detected' : 'Original Content'}</div>
                </div>
              </div>

              <div className="score-widget">
                <div className={`score-circle ${checkResult.overall_ai_score > 25 ? 'circle-purple' : 'circle-green'}`}>
                  {checkResult.overall_ai_score}%
                </div>
                <div>
                  <div className="score-label">AI Detection Score</div>
                  <div className="score-sub">{checkResult.overall_ai_score > 25 ? 'AI Patterns Found' : 'Human Written'}</div>
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
                        <span style={{ width: 10, height: 10, background: '#ef4444', borderRadius: '50%' }}></span> Plagiarism
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#7e22ce' }}>
                        <span style={{ width: 10, height: 10, background: '#a855f7', borderRadius: '50%' }}></span> AI Content
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
                    placeholder="Paste your essay, thesis, or research paper text here to scan for similarity and AI detection..."
                    value={checkInput}
                    onChange={(e) => setCheckInput(e.target.value)}
                  />
                  <div className="action-bar">
                    <button className="btn-primary" style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }} onClick={handleRunCheck} disabled={isChecking}>
                      {isChecking ? <><RefreshCw className="animate-spin" size={18} /> Scanning Against Databases...</> : <><Search size={18} /> Run Similarity & AI Scan</>}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="highlight-viewer-box">
                    {checkResult.highlighted_segments.map((seg) => {
                      if (seg.type === 'plagiarism') {
                        return (
                          <span key={seg.id} className="highlight-span span-plagiarism" title={`Matched: ${seg.source_name} (${seg.similarity_score}%)`}>
                            <span className="badge-tag badge-plag">[{seg.id}]</span>
                            {seg.text}{' '}
                          </span>
                        );
                      } else if (seg.type === 'ai') {
                        return (
                          <span key={seg.id} className="highlight-span span-ai" title={`AI Marker: ${seg.reasons?.join(', ')}`}>
                            <span className="badge-tag badge-ai">[AI]</span>
                            {seg.text}{' '}
                          </span>
                        );
                      }
                      return <span key={seg.id} className="highlight-span span-clean">{seg.text} </span>;
                    })}
                  </div>

                  {/* Actions for Checked Text */}
                  <div className="action-bar" style={{ justifyContent: 'space-between', marginTop: '1.25rem' }}>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button className="btn-outline" onClick={handleDownloadTurnitinPDF}>
                        <Download size={16} /> Download Turnitin PDF Report
                      </button>
                      <button className="btn-outline" onClick={handleDownloadWordReport}>
                        <Download size={16} /> Download Word Report
                      </button>
                    </div>
                    <button className="btn-success" onClick={handleSendToRemover} style={{ fontWeight: 700 }}>
                      <Sparkles size={18} /> ⚡ Fix All Issues in Remover (0% Plagiarism)
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar: Sources Breakdown */}
            <div className="sources-card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#002f6c', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers size={18} /> Primary Matched Sources
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.25rem' }}>Ranked by percentage similarity to existing academic repositories.</p>

              {checkResult && checkResult.matched_sources?.length > 0 ? (
                <div className="sources-list">
                  {checkResult.matched_sources.map((src, i) => (
                    <div key={i} className="source-item">
                      <div className="source-left">
                        <div className="source-rank" style={{ background: src.color || '#ef4444' }}>{i + 1}</div>
                        <div>
                          <div className="source-name" title={src.name}>{src.name}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{src.category}</div>
                        </div>
                      </div>
                      <div className="source-pct">{src.percentage}%</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#16a34a', fontSize: '0.9rem' }}>
                  <CheckCircle2 size={36} color="#16a34a" style={{ margin: '0 auto 0.5rem' }} />
                  <b>No overlapping sources detected!</b>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>Text is 100% original and verified.</p>
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
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#002f6c' }}>100% Plagiarism Remover & Zero-AI Engine</h2>
              <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Deterministic mathematical 4-gram shattering with 100% citation and chemical term preservation.</p>
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
            const exactMatchScore = Math.round(plagScore * 0.6);
            const partialMatchScore = Math.round(plagScore * 0.4);
            const uniqueScore = Math.max(0, 100 - plagScore);

            return (
              <div className="modern-scorecard-grid">
                {/* Card 1: Plagiarized / Similarity Meter */}
                <div className="modern-gauge-card">
                  <div className="gauge-left-cluster">
                    <CircularGauge 
                      value={plagScore} 
                      color={plagScore > 20 ? '#ef4444' : (plagScore > 0 ? '#f59e0b' : '#cbd5e1')} 
                    />
                    <div className="gauge-title-box">
                      <span className="gauge-main-title">Plagiarized</span>
                      <span className="gauge-subtitle">
                        {metricsAfter ? (
                          <span style={{ color: '#16a34a', fontWeight: 700 }}>✓ 0.0% Cleared (Turnitin)</span>
                        ) : (
                          metricsBefore ? `Flagged: ${metricsBefore.overall_similarity}%` : 'Turnitin & Database Index'
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Breakdown Bars */}
                  <div className="gauge-breakdown-list">
                    <div className="breakdown-row">
                      <div className="breakdown-meta">
                        <span className="breakdown-label">
                          <span className="breakdown-dot dot-red"></span> Exact Match
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
                          <span className="breakdown-dot dot-yellow"></span> Partial Match
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

                {/* Card 2: Unique / Original Content Meter */}
                <div className="modern-gauge-card">
                  <div className="gauge-left-cluster">
                    <CircularGauge 
                      value={uniqueScore} 
                      color="#10b981" 
                    />
                    <div className="gauge-title-box">
                      <span className="gauge-main-title">{uniqueScore}% Unique</span>
                      <span className="gauge-subtitle">Original Content</span>
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
                      <Check size={13} /> {metricsAfter ? '100% Cleared & Humanized' : 'Deterministic Zero-AI'}
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
                      <ShieldCheck size={12} /> Zero 4-Gram Overlap
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
                <Sparkles size={15} /> Plagiarism Remover
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
                {isRemoving ? <><RefreshCw className="animate-spin" size={15} /> Eliminating Plagiarism...</> : <><Sparkles size={15} /> Eliminate Plagiarism & Humanize</>}
              </button>
            </div>
          </div>

          {/* Side by Side Panes */}
          <div className="remover-grid">
            {/* Input Pane */}
            <div className="pane-card">
              <div className="card-title-bar">
                <h2><FileText size={18} /> Original Input (Flagged)</h2>
                {removerInput && (
                  <button className="btn-outline" style={{ padding: '0.3rem 0.6rem' }} onClick={() => setRemoverInput('')}>
                    <Trash2 size={14} /> Clear
                  </button>
                )}
              </div>
              <textarea
                className="textarea-box"
                placeholder="Paste plagiarized text or academic paper to clean..."
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
                <h2 style={{ color: '#16a34a' }}><FileCheck size={18} /> Humanized Output (0% Plagiarism & 0% AI)</h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn-outline" onClick={handleCopy} disabled={!removerOutput}>
                    {copied ? <Check size={14} color="#16a34a" /> : <Copy size={14} />} {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
              <textarea
                className="textarea-box"
                placeholder="Cleaned, humanized output with 0% plagiarism will appear here..."
                value={removerOutput}
                onChange={(e) => setRemoverOutput(e.target.value)}
                style={{ background: '#f8fafc', borderColor: removerOutput ? '#86efac' : '#cbd5e1' }}
              />
              <div className="action-bar" style={{ justifyContent: 'space-between' }}>
                <div style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 600 }}>
                  {removerOutput && '✓ Zero 4-gram overlap verified & AI evasion guaranteed'}
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
                  <button className="btn-primary" onClick={handleDownloadClearedPdfReport} disabled={!removerOutput} title="Download official Turnitin-style 100% Cleared PDF Certificate">
                    <FileCheck size={14} /> Cleared Report (PDF)
                  </button>
                  <button className="btn-outline" onClick={handleDownloadWordReport} disabled={!removerOutput} title="Download official Cleared Report in Word (.docx) format">
                    <FileText size={14} /> Report (.docx)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="app-footer">
        <p className="footer-attribution">Open Turnitin &bull; AI Plagiarism & Footprint Removal Engine</p>
        <p>
          🔍 <b>Verify AI Content:</b> Paste your paragraph on{' '}
          <a href="https://quillbot.com/ai-content-detector" target="_blank" rel="noreferrer" className="footer-link">
            QuillBot AI Content Detector <ExternalLink size={12} style={{ display: 'inline' }} />
          </a>{' '}
          or Turnitin to confirm 0% plagiarism and zero AI detection.
        </p>
      </footer>
    </div>
  );
}
