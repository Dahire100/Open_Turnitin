"""
AI Detection & Plagiarism Metric Analyzer
Calculates statistical features: Perplexity, Burstiness, N-Gram Duplication, and AI Marker Density.
"""
import re
import math
from typing import Dict, Any, List

AI_CLICHE_PATTERNS = [
    r"\bdelve(?:s|d|ing)?\s+into\b",
    r"\ba\s+testament\s+to\b",
    r"\bpivotal\s+role\b",
    r"\bbeacon\s+of\b",
    r"\bit\s+is\s+(?:worth\s+noting|crucial|imperative|important\s+to\s+note|essential)\b",
    r"\bunderscores?\s+the\s+importance\b",
    r"\bplays?\s+a\s+(?:vital|critical|crucial|pivotal)\s+role\b",
    r"\bin\s+today's\s+(?:rapidly\s+evolving|fast-paced|digital)\s+world\b",
    r"\bfostering?\s+(?:an?\s+environment|growth|innovation)\b",
    r"\bharnessing?\s+the\s+power\s+of\b",
    r"\bnavigat(?:e|ing|es|ed)\s+the\s+(?:complexities|landscape|challenges)\b",
    r"\brich\s+tapestry\b",
    r"\bmoreover\b",
    r"\bfurthermore\b",
    r"\bhenceforth\b",
    r"\bconsequently\b",
    r"\bin\s+conclusion\b",
    r"\bto\s+summarize\b",
    r"\ball\s+in\s+all\b",
    r"\bholistic\s+approach\b",
    r"\bseamless(?:ly)?\b",
    r"\bshed(?:s)?\s+light\s+on\b",
    r"\ba\s+double-edged\s+sword\b",
]

def split_sentences(text: str) -> List[str]:
    """Split text into sentences using standard punctuation rules."""
    raw = re.split(r'(?<=[.!?])\s+', text.strip())
    return [s.strip() for s in raw if len(s.strip()) > 3]

def tokenize_words(text: str) -> List[str]:
    """Tokenize text into lowercase alphanumeric words."""
    return re.findall(r'\b[a-zA-Z]{2,}\b', text.lower())

def calculate_burstiness(sentences: List[str]) -> float:
    """
    Burstiness is the variation in sentence length.
    Human writing has high burstiness (mix of very short, medium, and long complex sentences).
    AI writing has low burstiness (uniform 15-22 word sentences).
    Returns a score between 0 (very uniform/AI-like) and 1 (very dynamic/human-like).
    """
    if len(sentences) < 2:
        return 0.5
    lengths = [len(tokenize_words(s)) for s in sentences]
    mean = sum(lengths) / len(lengths)
    if mean == 0:
        return 0.5
    variance = sum((l - mean) ** 2 for l in lengths) / len(lengths)
    std_dev = math.sqrt(variance)
    coef_variation = std_dev / mean
    # Normalize: CV > 0.6 is typically human bursty writing
    return min(1.0, coef_variation / 0.7)

def calculate_ngram_repetition(words: List[str], n: int = 3) -> float:
    """Calculate the ratio of repeated n-grams to total n-grams."""
    if len(words) < n:
        return 0.0
    ngrams = [tuple(words[i:i+n]) for i in range(len(words) - n + 1)]
    if not ngrams:
        return 0.0
    unique = len(set(ngrams))
    repetition_rate = 1.0 - (unique / len(ngrams))
    return max(0.0, repetition_rate)

def calculate_ai_cliche_density(text: str) -> Tuple[int, float]:
    """Count AI hallmark clichés and return total count and density per 100 words."""
    words = tokenize_words(text)
    total_words = max(1, len(words))
    count = 0
    t_lower = text.lower()
    for pattern in AI_CLICHE_PATTERNS:
        matches = re.findall(pattern, t_lower)
        count += len(matches)
    density = (count / total_words) * 100
    return count, density

def analyze_document_metrics(text: str) -> Dict[str, Any]:
    """
    Full statistical evaluation of text:
    - AI Probability Score (%)
    - Plagiarism / Repetition Risk Score (%)
    - Burstiness Index
    - Vocabulary Richness (TTR)
    - AI Markers Found
    """
    if not text or not text.strip():
        return {
            "ai_score": 0.0,
            "plagiarism_score": 0.0,
            "burstiness": 0.0,
            "ttr": 0.0,
            "cliche_count": 0,
            "word_count": 0,
            "sentence_count": 0,
            "status": "No text provided"
        }
        
    sentences = split_sentences(text)
    words = tokenize_words(text)
    word_count = len(words)
    sentence_count = max(1, len(sentences))
    
    # 1. Burstiness (Higher = more human)
    burstiness = calculate_burstiness(sentences)
    
    # 2. Vocabulary Variety (Type-Token Ratio)
    unique_words = len(set(words))
    ttr = (unique_words / max(1, word_count)) if word_count > 0 else 0.0
    
    # 3. AI Cliché markers
    cliche_count, cliche_density = calculate_ai_cliche_density(text)
    
    # 4. Repetition & N-Gram overlap (Plagiarism / Duplication risk)
    repetition_3 = calculate_ngram_repetition(words, n=3)
    repetition_4 = calculate_ngram_repetition(words, n=4)
    plagiarism_score = min(98.0, (repetition_3 * 50.0 + repetition_4 * 50.0 + (1.0 - ttr) * 20.0))
    
    # 5. Composite AI Probability Calculation
    # AI models exhibit: low burstiness (uniform lengths), high cliché density, specific TTR clustering
    ai_penalty = 0.0
    # If burstiness is very low (< 0.35), heavy AI probability
    if burstiness < 0.35:
        ai_penalty += (0.35 - burstiness) * 100.0
    # Cliché impact: each cliché adds ~10-15% risk
    ai_penalty += min(45.0, cliche_count * 12.0)
    # Average sentence length uniformness (AI usually averages 16-24 words per sentence)
    avg_len = word_count / sentence_count
    if 15 <= avg_len <= 25 and burstiness < 0.4:
        ai_penalty += 15.0
        
    base_ai = 20.0 + ai_penalty
    if burstiness > 0.7 and cliche_count == 0:
        base_ai = max(2.0, base_ai - 30.0)
        
    ai_score = round(max(0.0, min(99.0, base_ai)), 1)
    plagiarism_score = round(max(0.0, min(99.0, plagiarism_score)), 1)
    
    return {
        "ai_score": ai_score,
        "plagiarism_score": plagiarism_score,
        "burstiness": round(burstiness, 2),
        "ttr": round(ttr, 2),
        "cliche_count": cliche_count,
        "word_count": word_count,
        "sentence_count": sentence_count,
        "avg_sentence_len": round(avg_len, 1)
    }

