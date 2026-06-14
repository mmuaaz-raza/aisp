# Hybrid Search Engine — Project Checklist

## Goal
Combine your existing dense (cosine similarity) search from Week 4 with sparse (BM25) search to build a hybrid retrieval system. Demonstrate that hybrid search outperforms either method alone on different query types.

## Core Requirements
- [x] Fix the BM25 implementation bugs: `avgLen` divisor, document length unit (word count not char count), case-sensitivity in `df`, consistent tokenization across `Tf`/`df`/`avgLen`
- [x] Implement `bm25_search(query, corpus)` that returns a single ranked score per document (sum of `idf(term) * tf_score(term, doc)` across all query terms)
- [x] Reuse your Week 4 dense search (`search()`) — no changes needed, just call it alongside BM25
- [x] Implement dynamic min-max normalization for both score arrays, computed per query (not a fixed constant)
- [x] Implement `hybrid_search(query, alpha)` that combines normalized dense + normalized sparse scores using `alpha * dense_norm + (1-alpha) * sparse_norm`

## Comparison Requirements
- [x] Run the same query through three functions: pure dense, pure BM25, hybrid — print all three result sets side by side
- [x] Test with an **exact-match query** (e.g. a specific name/number/code that appears literally in a document) — BM25 should outperform dense here
- [x] Test with a **conceptual/paraphrase query** (no exact keyword overlap with target docs) — dense should outperform BM25 here
- [x] Test with a **mixed query** (has both an exact term and conceptual language) — hybrid should outperform both pure methods

## Tuning Requirements
- [x] Test `alpha` at 0.0, 0.3, 0.5, 0.7, 1.0 for the same mixed query — observe how rankings shift
- [x] Document which `alpha` value gives the best results for your corpus and why (briefly, in README or comments)


## Benchmark
- [x] Measure and compare retrieval time: pure dense vs pure BM25 vs hybrid, at your existing corpus sizes (50/500/5000)
- [x] Note where the bottleneck is — BM25 score computation, dense cosine similarity, or normalization

## Code Quality
- [x] BM25 implementation has correct tokenization (lowercase + punctuation stripped) applied consistently across all functions
- [x] `hybrid_search` is a single reusable function, not duplicated logic per query type
- [x] Normalization function handles edge case where all scores are identical (avoid division by zero)

## Deliverable
- [x] At least 3 side-by-side comparison outputs (dense / sparse / hybrid) demonstrating the tradeoffs
- [x] Short written reflection: in your own words, when would you set alpha closer to 0 vs closer to 1 in a real production system?