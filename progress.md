# 🚀 Summer Sprint — Master AI Engineering
---



## ✅ Completed

### Foundation & Core Algorithms
- [x] **Async web scraping** — `aiohttp`, `requests` with executor, concurrent pipelines
- [x] **Cosine similarity & semantic search from scratch** — pure numpy over 5,000 AG News articles, multi-query fusion, NOT syntax
- [x] **BM25 from scratch** — full implementation; `df_table` optimization cut query time from ~5s to <1s
- [x] **Hybrid search** — BM25 + dense, per-query min-max normalization, RRF fusion
- [x] **Cross-encoder reranking** — `cross-encoder/ms-marco-MiniLM-L-6-v2`
- [x] **RAG CLI** — end-to-end pipeline with Groq + query caching

### Archit (formerly BookMind)
- [x] **FastAPI backend** — deployed on Render (free tier)
- [x] **React frontend** — deployed on Vercel at [ai-archit.vercel.app](https://ai-archit.vercel.app)
- [x] **MongoDB Atlas** via Beanie ODM
- [x] **Qdrant Cloud** — hybrid vector + BM25 search with RRF fusion
- [x] **Dense embeddings** — `BAAI/bge-small-en-v1.5`
- [x] **Semantic chunking** — Chonkie `SemanticChunker` + `minishlab/potion-base-32M`
- [x] **LLM** — Groq `llama-3.3-70b-versatile`
- [x] **Auth & sessions** — cross-origin cookie fix (SameSite=none, Secure=True)
- [x] **Keep-alive coroutine** — asyncio + httpx to prevent Render spindown
- [x] **Mode-switching** — `<mode>context|history</mode>` system prompt for philosophical research assistant feature
- [x] **Data migration** — local MongoDB + Qdrant → cloud
- [x] **OOM fix** — pinned CPU-only PyTorch to resolve Render build crashes


### Learning Roadmap — Weeks Completed
| Week | Topic | Status |
|------|-------|--------|
| 1–2 | FastAPI, REST, rate limiting, reverse proxies | ✅ |
| 3 | Async scraping, concurrency patterns | ✅ |
| 4 | Semantic search from scratch (cosine sim, numpy) | ✅ |
| 5 | BM25 from scratch, hybrid search | ✅ |
| 6 | Cross-encoder reranking, RAG CLI | ✅ |
| 7 | **LangGraph** — nodes, edges, conditional routing, checkpointing | ✅ |


---

## 📋 Backlog

### Technical
- [ ] Evaluation harness for RAG quality (recall@k, MRR, faithfulness)
- [ ] Fine-tuning fundamentals (LoRA, QLoRA)
- [ ] Vector DB internals — HNSW, IVF indexing from scratch
- [ ] Streaming responses in FastAPI + frontend
- [ ] Agent architectures — tool use, ReAct, plan-and-execute
- [ ] Production observability — logging, tracing, LangSmith or equivalent
- [ ] CUDA kernels — matrix multiply from scratch



*Last updated:23 June 2025*