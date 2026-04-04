# SommelierPRO (Deviens sommelier)

SommelierPRO is the official J.S.A. Sommelier Examination training and talent evaluation platform for the **SVD (Sapporo Viewtiful Dining)** ecosystem. Designed to integrate seamlessly with **SVD-OS Talent Intelligence (TI)**, this Progressive Web App (PWA) delivers premium, mobile-first, AI-driven wine education to SVD's core brigade.

## Core Philosophical Tenets
- **Interactive Knowledge**: Shift from passive reading to active, AI-assisted conversational learning (AI Concierge & Keyword Drill-down).
- **The Grind as Evidence**: Track relentless effort. Unlimited "Extra (補習)" sessions append relentlessly to the backend, transforming raw effort into visible Talent Intelligence metrics.
- **Premium Identity**: "TI Profile Chips" assign a professional identity to each trainee (e.g., `Mohri - 🍷 受験生 (Active)`), cultivating pride and accountability.

## Architecture

1. **Frontend (PWA)**: HTML/JS/CSS hosted on GitHub Pages. Features a highly refined NewsPicks-inspired UI with smooth transitions and vector-based SVG iconography.
2. **AI Intelligence Engine**: Integrated directly with **Google Gemini 3.1 Pro Preview**, utilized for both dynamic 10-question J.S.A. quiz generation and the intelligent conversational agent (AI Concierge).
3. **Backend Logic & Storage**: **Google Apps Script (GAS)** functions as the secure API and uses Google Spreadsheets for persistence. Adheres to robust UPSERT patterns for daily sessions, while employing explicit APPEND patterns for unconstrained "Extra" sessions.
4. **Metadata Extension**: `app/users_meta.js` acts as an agile frontend metadata dictionary, merging statically hosted avatar images (`app/img/`) and TI status badges with the GAS session data.

## Key Features
- **Daily Mission Flow**: Mandatory 'Morning', 'Break', and 'Evening' test quotas mapped to J.S.A. chapters.
- **Hallucination Check**: Integrated AI review button allowing trainees to independently cross-verify the AI-generated questions against the factual baseline.
- **Continuous Learning**: Tappable keywords instantly spawn the AI Concierge for deep-dive contextual explanations.

*Project governed by SVD-OS protocols.*
