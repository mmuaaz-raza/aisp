# Hybrid Search Engine

A from-scratch implementation of hybrid search combining dense semantic search (cosine similarity) and sparse lexical search (BM25) — built without any vector database.

## Setup

```bash
pip install sentence-transformers numpy aiofiles datasets rank-bm25
```

```bash
python3 searchengine.py
```

On first run, the corpus (5000 AG News articles) and embeddings are downloaded and cached locally. Subsequent runs load from cache instantly.

## How It Works

### Dense Search (Semantic)
Encodes the query using `all-MiniLM-L6-v2` and computes cosine similarity against all pre-encoded document embeddings. Captures meaning and paraphrase — finds relevant documents even without exact keyword overlap.

### Lexical Search (BM25)
Scores documents using term frequency (with saturation) × inverse document frequency. Finds exact token matches and rewards rare terms. Built from scratch — no `rank-bm25` dependency.

### Hybrid Search
Combines both signals after min-max normalization:
```
hybrid_score = alpha × dense_norm + (1 - alpha) × sparse_norm
```
Normalization is computed per-query so both signals are on the same [0, 1] scale before combining.

## Query Modes

| Mode | Description |
|---|---|
| Single Query | Standard search — auto-detects `NOT` for negative search |
| Double Query | Fuses two query embeddings by averaging, then searches |
| Negative Search | `"python NOT snake"` — up-ranks positive, down-ranks negative |

## Benchmark Results

Corpus: 5000 AG News articles

| Method | Time |
|---|---|
| Dense (numpy vectorized) | ~0.012s |
| BM25 (with df-table cache) | ~0.08s |
| Hybrid | ~0.09s |

Dense search is ~7x faster than BM25 due to numpy's vectorized matrix operations vs Python-level token scanning.

## When Each Method Wins

### BM25 wins — exact token queries
Query: `ELAINE KURTENBACH SHANGHAI, China`

BM25 ranked the correct article at #1 with a perfect 1.0 score. Dense search returned chess articles about Japan — it captured the geographic neighborhood but missed the exact byline.

Query: `Barrel of Monkeys, 2004 Edition`

BM25 ranked the correct article at #1 (1.0). Dense search ranked it at #2, placing an unrelated whales article first.

### Dense wins — conceptual/paraphrase queries
Query: `stock market crash`

Dense returned 5 finance/economy articles — none containing the word "crash" literally. BM25 would fail here since the exact term doesn't appear in the documents.

### Hybrid stays competitive on both
For exact-match queries, hybrid correctly keeps BM25's top result at #1. For conceptual queries, hybrid doesn't collapse to BM25's failures since the dense signal pulls it toward semantically relevant documents.

## Alpha Tuning

`alpha` controls the weight of dense vs sparse signal:

```
alpha = 0.0  →  pure BM25 (exact match only)
alpha = 0.5  →  balanced hybrid
alpha = 1.0  →  pure dense (semantic only)
```

**Set alpha closer to 0** when exact term matching matters — e.g. search on a documentation site, legal document retrieval, searching by author name or product code. The user knows the exact term and expects it to appear literally.

**Set alpha closer to 1** when semantic flexibility matters — e.g. searching a knowledge base by concept, RAG retrieval, or any scenario where the user describes an idea rather than quoting an exact phrase.

## Project Structure

```
embeddings/
├── searchengine.py       # main search engine
├── media/
│   ├── data.json         # cached corpus (5000 articles)
│   ├── data_en.npy       # cached embeddings (5000 × 384)
```