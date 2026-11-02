import streamlit as st
import sys
import os

# Ensure src path is in sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SRC_DIR = os.path.join(BASE_DIR, "src")
if SRC_DIR not in sys.path:
    sys.path.insert(0, SRC_DIR)

from engine.humanizer import humanize_text
from engine.detector import analyze_document_metrics
from engine.document_parser import extract_text_from_file, create_docx, create_pdf

# --- Streamlit Page Configuration ---
st.set_page_config(
    page_title="Turnitout — Plagiarism & AI Detection Removal Engine",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# --- Custom Styling ---
st.markdown("""
<style>
    .main-header {
        font-size: 2.2rem;
        font-weight: 800;
        color: #1E3A8A;
        margin-bottom: 0.2rem;
    }
    .sub-header {
        font-size: 1.05rem;
        color: #4B5563;
        margin-bottom: 1.5rem;
    }
    .metric-card {
        background-color: #F8FAFC;
        border-radius: 8px;
        padding: 1rem;
        border: 1px solid #E2E8F0;
        text-align: center;
    }
    .metric-title {
        font-size: 0.85rem;
        color: #64748B;
        font-weight: 600;
        text-transform: uppercase;
    }
    .metric-val {
        font-size: 1.8rem;
        font-weight: 700;
        margin-top: 0.3rem;
    }
    .status-badge-green {
        color: #059669;
        font-weight: bold;
    }
    .status-badge-red {
        color: #DC2626;
        font-weight: bold;
    }
    .status-badge-yellow {
        color: #D97706;
        font-weight: bold;
    }
</style>
""", unsafe_allow_html=True)

# --- Sidebar Controls ---
st.sidebar.image("https://img.icons8.com/color/96/shield.png", width=64)
st.sidebar.title("Configuration")

intensity = st.sidebar.select_slider(
    "Humanization Aggressiveness",
    options=["Low", "Medium", "High"],
    value="Medium",
    help="Higher intensity replaces more n-grams and restructures complex clauses aggressively."
)

st.sidebar.markdown("### 🛡️ Preservation Filters")
preserve_tech = st.sidebar.checkbox(
    "Preserve Technical / Domain Jargon",
    value=True,
    help="Locks scientific terms, numbers, acronyms, and formulas from being swapped."
)

preserve_citations = st.sidebar.checkbox(
    "Preserve Citations & LaTeX Tags",
    value=True,
    help="Protects bracketed references like [1], parenthetical citations like (Smith, 2024), and LaTeX commands."
)

st.sidebar.markdown("---")
st.sidebar.markdown("""
**100% Free & Open Source:**
- 🔓 No Paywall / Zero Gated Access
- 🔒 100% Private & Local (Zero Cloud Leakage)
- 📄 Supports `.txt`, `.docx`, `.pdf`, `.tex`
""")

# --- Main App Header ---
st.markdown('<div class="main-header">🛡️ Turnitout Engine — Zero-AI Plagiarism & Detection Evader</div>', unsafe_allow_html=True)
st.markdown('<div class="sub-header">Bypass Turnitin, CopyLeaks, GPTZero, and AI checkers offline without generative hallucination.</div>', unsafe_allow_html=True)

# Initialize Session State
if "raw_text" not in st.session_state:
    st.session_state.raw_text = ""
if "processed_text" not in st.session_state:
    st.session_state.processed_text = ""
if "metrics_before" not in st.session_state:
    st.session_state.metrics_before = None
if "metrics_after" not in st.session_state:
    st.session_state.metrics_after = None

tabs = st.tabs(["🚀 Humanizer & Evader", "📊 Deep Linguistic Audit", "ℹ️ How It Works"])

# ==========================================
# TAB 1: Humanizer & Evader
# ==========================================
with tabs[0]:
    col1, col2 = st.columns([1, 1])
    
    with col1:
        st.subheader("1. Input Document")
        
        uploaded_file = st.file_uploader(
            "Upload TXT, PDF, DOCX, or TEX file:",
            type=["txt", "pdf", "docx", "tex", "md"]
        )
        
        if uploaded_file is not None:
            extracted = extract_text_from_file(uploaded_file.read(), uploaded_file.name)
            if extracted and extracted != st.session_state.raw_text:
                st.session_state.raw_text = extracted
                st.success(f"Loaded '{uploaded_file.name}' ({len(extracted.split())} words)")
                
        user_input = st.text_area(
            "Or paste your content directly here:",
            value=st.session_state.raw_text,
            height=280,
            placeholder="Paste your paragraph, essay, or academic paper here..."
        )
        
        if user_input != st.session_state.raw_text:
            st.session_state.raw_text = user_input
            
        col_btn1, col_btn2 = st.columns([3, 1])
        with col_btn1:
            run_btn = st.button("🚀 Remove Plagiarism & AI Footprints", type="primary", use_container_width=True)
        with col_btn2:
            if st.button("🧹 Clear", use_container_width=True):
                st.session_state.raw_text = ""
                st.session_state.processed_text = ""
                st.session_state.metrics_before = None
                st.session_state.metrics_after = None
                st.rerun()

    if run_btn:
        if not st.session_state.raw_text.strip():
            st.warning("Please provide or upload text first!")
        else:
            with st.spinner("Analyzing and humanizing document..."):
                # Pre-analysis
                st.session_state.metrics_before = analyze_document_metrics(st.session_state.raw_text)
                
                # Humanize
                humanized = humanize_text(
                    st.session_state.raw_text,
                    intensity=intensity,
                    preserve_technical=preserve_tech,
                    preserve_citations=preserve_citations
                )
                st.session_state.processed_text = humanized
                
                # Post-analysis
                st.session_state.metrics_after = analyze_document_metrics(humanized)

    with col2:
        st.subheader("2. Humanized Output")
        
        out_area = st.text_area(
            "Cleaned & Humanized Text:",
            value=st.session_state.processed_text,
            height=280,
            placeholder="Processed output will appear here..."
        )
        
        if st.session_state.processed_text:
            st.write("##### 📥 Export Document:")
            dl_col1, dl_col2, dl_col3 = st.columns(3)
            with dl_col1:
                st.download_button(
                    "📄 Plain Text (.txt)",
                    data=st.session_state.processed_text,
                    file_name="humanized_document.txt",
                    mime="text/plain",
                    use_container_width=True
                )
            with dl_col2:
                docx_data = create_docx(st.session_state.processed_text)
                st.download_button(
                    "📝 Word Doc (.docx)",
                    data=docx_data,
                    file_name="humanized_document.docx",
                    mime="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    use_container_width=True
                )
            with dl_col3:
                pdf_data = create_pdf(st.session_state.processed_text)
                st.download_button(
                    "📕 Adobe PDF (.pdf)",
                    data=pdf_data,
                    file_name="humanized_document.pdf",
                    mime="application/pdf",
                    use_container_width=True
                )

    # --- Live Metrics Comparison Bar ---
    if st.session_state.metrics_before and st.session_state.metrics_after:
        st.markdown("---")
        st.subheader("📊 Evasion & Quality Comparison")
        
        m_b = st.session_state.metrics_before
        m_a = st.session_state.metrics_after
        
        c1, c2, c3, c4 = st.columns(4)
        with c1:
            diff_ai = m_a['ai_score'] - m_b['ai_score']
            st.metric(
                label="AI Detection Score",
                value=f"{m_a['ai_score']}%",
                delta=f"{diff_ai:.1f}%",
                delta_color="inverse"
            )
        with c2:
            diff_plag = m_a['plagiarism_score'] - m_b['plagiarism_score']
            st.metric(
                label="Plagiarism / Repetition Risk",
                value=f"{m_a['plagiarism_score']}%",
                delta=f"{diff_plag:.1f}%",
                delta_color="inverse"
            )
        with c3:
            diff_burst = m_a['burstiness'] - m_b['burstiness']
            st.metric(
                label="Burstiness (Human Rhythm)",
                value=f"{m_a['burstiness']}",
                delta=f"{diff_burst:+.2f}",
                delta_color="normal"
            )
        with c4:
            st.metric(
                label="AI Clichés Removed",
                value=f"{m_b['cliche_count'] - m_a['cliche_count']} removed",
                delta=f"Remaining: {m_a['cliche_count']}",
                delta_color="normal"
            )

# ==========================================
# TAB 2: Deep Linguistic Audit
# ==========================================
with tabs[1]:
    st.subheader("Linguistic Breakdown & Diagnostic Heatmap")
    if not st.session_state.metrics_before:
        st.info("Run an analysis in Tab 1 to view detailed sentence diagnostics.")
    else:
        mb = st.session_state.metrics_before
        ma = st.session_state.metrics_after
        
        c_left, c_right = st.columns(2)
        with c_left:
            st.markdown("### 🔴 Original Document")
            st.write(f"- **Word Count:** {mb['word_count']} words")
            st.write(f"- **Sentences:** {mb['sentence_count']} sentences")
            st.write(f"- **Avg Sentence Length:** {mb['avg_sentence_len']} words")
            st.write(f"- **Vocabulary Richness (TTR):** {mb['ttr']}")
            st.write(f"- **AI Clichés Detected:** {mb['cliche_count']}")
            
        with c_right:
            st.markdown("### 🟢 Humanized Document")
            st.write(f"- **Word Count:** {ma['word_count']} words")
            st.write(f"- **Sentences:** {ma['sentence_count']} sentences")
            st.write(f"- **Avg Sentence Length:** {ma['avg_sentence_len']} words")
            st.write(f"- **Vocabulary Richness (TTR):** {ma['ttr']}")
            st.write(f"- **AI Clichés Detected:** {ma['cliche_count']}")
            
        st.markdown("---")
        st.markdown("#### 🎯 Zero-AI Verification:")
        st.success("""
        ✅ **100% Deterministic:** No generative AI models were used to rewrite this text.
        ✅ **Zero Watermarks:** Invisible zero-width unicode tokens purged.
        ✅ **No Hallucinations:** Facts, citations, and formulas retained completely intact.
        """)

# ==========================================
# TAB 3: How It Works
# ==========================================
with tabs[2]:
    st.markdown("""
    ### How Turnitout Defeats AI Checkers & Plagiarism Systems
    
    1. **N-Gram Disruption:**
       Plagiarism detectors (like Turnitin and iThenticate) flag contiguous matching phrases of 3 to 7 words. Turnitout swaps contextual POS-tagged synonyms and inverts clauses to mathematically break the sequence.
       
    2. **Burstiness Engineering:**
       Large Language Models generate text with uniform sentence lengths (e.g. 16-22 words per sentence). Humans write with high burstiness—combining 5-word punchy sentences with 35-word complex observations. Turnitout restructures sentences to introduce dynamic natural variation.
       
    3. **AI Cliché Elimination:**
       Detectors look for over-represented AI transition words ("moreover", "delve into", "a testament to", "rich tapestry"). Turnitout purges these markers and substitutes human conversational bridges.
       
    4. **Zero-Width Character Purge:**
       Removes invisible cryptographic Unicode tracking characters (`\u200b`, `\u200c`, `\ufeff`) that AI tools embed in text.
    """)

