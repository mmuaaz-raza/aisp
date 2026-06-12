# Semantic Search Engine — Project Checklist

## Core Requirements
- [x] Load a real dataset of at least 50 documents (AG News or BBC News via HuggingFace)
- [x] Encode entire corpus using `all-MiniLM-L6-v2` from Sentence Transformers
- [x] Accept a search query and return top-k most similar results with scores
- [x] Implement cosine similarity from scratch using numpy only — no `sklearn`, no vector DB

## Challenging Requirements
- [x] **Threshold filtering** — only return results above a configurable similarity score threshold, not just top-k blindly
- [x] **Negative search** — user can pass exclusion terms e.g. `"python NOT snake"` — down-rank documents where excluded term scores high

## Hard Requirements
- [x] **Multi-query fusion** — accept 2 queries, embed both, average their vectors, search with the fused vector
- [x] **Caching** — if the same query is searched twice, return cached result without re-encoding
- [ ] **Benchmark** — measure and display retrieval time for corpus sizes of 50, 500, 5000 — compare numpy vectorized similarity vs Python loop

## Code Quality
- [x] Functions are single-responsibility — no monolithic blocks
- [ ] Type hints on all functions
- [x] Corpus embeddings pre-computed once at startup, not on every query
- [x] Vectorized numpy similarity (`np.dot` matrix operation) instead of looping over each document

## Deliverable
- [ ] README with setup instructions and example queries
- [ ] At least 3 example searches demonstrating semantic understanding (not keyword matching)
- [ ] Benchmark results table showing retrieval time at 50 / 500 / 5000 documents