# Architecture & Technical Blueprint

This document details the system architecture of **Google AI Photo Search (PixSort)**, explaining the specific Google services used, the data pipelines, and the core rationale ("Why") for each technology choice centered on **scalability**, **privacy**, and **semantic performance**.

---

## 1. System Architecture Overview

```
                          +------------------------------------------+
                          |        Client Layer (React + Tailwind)   |
                          |   - Natural Language Query Interface     |
                          |   - Floating Sticky Library Navigation   |
                          |   - Connected Storage Dashboard          |
                          |   - Neomorphic Responsive Photo Grid     |
                          +--------------------+---------------------+
                                               | HTTPS / REST
                                               v
                          +--------------------+---------------------+
                          |     Backend Service (Express on Node)    |
                          |   /api/photos, /api/search, /api/drive   |
                          +---------+----------+----------+----------+
                                    |          |          |
            +-----------------------+          |          +-----------------------+
            |                                  |                                  |
            v                                  v                                  v
+-----------------------+          +-----------------------+          +-----------------------+
|    Google Drive API   |          |   Firebase Firestore  |          |       Gemini API      |
|  (Multi-Account Pool) |          |   (Metadata Store)    |          | (Vision & Embeddings) |
| - User's Drive files  |          | - Document records    |          | - Gemini 2.5 Flash    |
| - Automatic Failover  |          | - driveFileId refs    |          | - Gemini Embedding 2  |
| - Priority allocation |          | - Albums & favorites  |          |   (768-dim vectors)   |
| - Organized folders   |          | - Structured filters  |          |                       |
+-----------------------+          +-----------------------+          +-----------+-----------+
                                                                                  |
                                                                                  v
                                                                      +-----------------------+
                                                                      |  Vertex AI Vector     |
                                                                      |        Search         |
                                                                      | - ANN Cosine Index    |
                                                                      | - Sub-10ms matching   |
                                                                      | - Billion-scale scale |
                                                                      +-----------------------+
```

---

## 2. Core Google Services & Selection Rationale

### 1. Gemini API (Vision Analysis & Multimodal Embeddings)
- **Specific Models**: 
  - `gemini-2.5-flash`: Zero-shot visual captioning, object extraction, activity detection, and environmental classification.
  - `gemini-embedding-2-preview`: Multimodal text and visual embedding generation producing 768-dimensional dense vectors.
- **Why for Semantic Performance**:
  - **Shared Multimodal Latent Space**: Text queries and image concepts reside in the exact same mathematical geometry. An uploaded photo of friends by turquoise water projects to the same neighborhood as the text query `"pool party"`, enabling zero-keyword discovery.
  - **Context-Aware Captioning**: Rather than relying on simple tag detection, Gemini 2.5 Flash produces rich narrative scene summaries, extracting subtle cues like lighting, activities (e.g., *celebrating*, *sunbathing*), and mood.
- **Why for Scalability**:
  - **High-Throughput Inference**: Gemini 2.5 Flash and Embedding 2 offer sub-100ms vectorization latency with high concurrency ceilings, enabling rapid batch processing during large photo album uploads.
  - **Compact Vector Footprint**: The 768-dimension output strikes an optimal balance between dense semantic richness and lightweight memory storage in vector indexes.

---

### 2. Vertex AI Vector Search (Similarity & Ranking)
- **Role**: Approximate Nearest Neighbor (ANN) vector search engine calculating cosine similarity across indexed photo vectors.
- **Why for Semantic Performance**:
  - **Continuous Similarity Scoring**: Replaces binary keyword matching with a smooth metric space. Searching for *"chilling on a terrace"* surfaces photos labeled *"relaxing on an outdoor rooftop"* with high cosine scores ($> 0.85$).
  - **Similarity Exploration**: Powers "Find Similar Photos" feature directly from any photo's latent vector representation.
- **Why for Scalability**:
  - **Billion-Scale Vector Capacity**: Powered by Google’s proprietary Tree-AH (Asymmetric Hashing) algorithm, capable of scaling to billions of items while maintaining p99 query latency under 10 milliseconds.
  - **Predictable Compute Costs**: Decouples heavy vector distance calculations from the application server, allowing independent horizontal scaling of the indexing tier.

---

### 3. Firebase Firestore (Persistent Metadata & Document Store)
- **Role**: Serverless NoSQL document database managing photo records, Google Drive file pointers, album memberships, user favorites, and trash lifecycle.
- **Why for Semantic Performance**:
  - **Hybrid Query Execution**: Complements vector similarity with strict relational filtering. Allows the search engine to merge vector search candidates with precise metadata filters (e.g., *date ranges*, *geographic locations*, or *album memberships*).
  - **Lightweight Document References**: Instead of storing binary media, Firestore documents only retain references (`driveFileId`, `driveAccountId`, `driveFolderId`), keeping documents under 2 KB.
- **Why for Scalability**:
  - **Serverless Auto-Scaling**: Handles traffic spikes effortlessly with zero database provisioning, automatic multi-region sharding, and sub-millisecond document hydration.
  - **Real-Time Synchronization**: Provides live data listener capabilities, updating client interfaces immediately when photo attributes, favorites, or albums are altered.

---

### 4. Google Drive API (Multi-Account Pooled Storage Layer)
- **Role**: Decentralized personal storage layer pooling user's personal Google Drive accounts into a unified photo library.
- **Folder Organization in Google Drive**:
  ```text
  Google Drive
  └── AI Photo Search
      ├── Photos
      │   ├── 2026
      │   │   ├── 09
      │   │   └── 08
      │   └── 2025
      └── Thumbnails
  ```
- **Storage Allocation & Failover Strategy**:
  - Automatically allocates uploads to the first active Google Drive account in user's priority order.
  - Checks file size + real-time available storage via `about.get` quota API.
  - **Automatic Failover**: If Account 1 is full or encounters quota limits, automatically routes to Account 2, then Account 3.
  - **Safe Disconnection**: Disconnecting an account preserves all files in the user's Google Drive, only removing access pointers in the application.
- **Why for Privacy & Economics**:
  - **User Data Sovereignty**: Photos remain inside the user's personal Google Drive accounts under their ownership and control.
  - **Zero Central Storage Cost**: Storage scales with the user's personal Drive quota pools (15 GB free per account) rather than racking up centralized cloud bucket bills.

---

## 3. End-to-End Processing Pipelines

### Ingestion & Upload Pipeline
```
1. Image File Selected (Client)
       │
       ▼
2. Determine File Size & Available Quota (StorageService)
       │
       ▼
3. Choose Active Account with Priority & Failover
       │
       ▼
4. Upload to Google Drive (AI Photo Search/Photos/YYYY/MM/)
       │
       ▼
5. Gemini 2.5 Flash Vision Analysis (Scene Story & Semantic Tags)
       │
       ▼
6. Gemini Embedding 2 (768-dim Vector Projection)
       │
       ▼
7. Index into Vertex AI Vector Space
       │
       ▼
8. Persist Metadata & Drive File ID to Firestore
```

### Natural Language Search Pipeline
```
1. User Query: "Pool party"
       │
       ▼
2. Query Parsing & Intent (Extracts keywords, date, and location constraints)
       │
       ▼
3. Gemini Embedding 2 (Converts query string into 768-dim vector)
       │
       ▼
4. Vertex AI Vector Search (Cosine similarity comparison across all connected accounts)
       │
       ▼
5. Firestore Metadata Hydration (Enriches top-ranked vector IDs with full photo details)
       │
       ▼
6. Responsive Delivery (Returns ranked results with execution metrics)
```

---

## 4. Comparison: Traditional Search vs. Google AI Architecture

| Dimension | Traditional Keyword/SQL Approach | Google AI Architecture |
| :--- | :--- | :--- |
| **Search Paradigm** | Exact match on filename, manual tags, or EXIF | Continuous semantic similarity over scene meaning |
| **User Query Experience** | Requires exact keywords (e.g. `file_042.jpg`, `tag:pool`) | Accepts expressive natural queries (e.g. *"refreshing summer swim"*) |
| **Cataloging Effort** | Requires tedious manual labeling and folder sorting | 100% automated multimodal ingestion via Gemini Vision |
| **Storage Architecture** | Centralized bucket with mounting bills | Pooled multi-account personal Google Drive with auto-failover |
| **User Data Control** | Locked in third-party database or server disk | Photos remain safely in user's personal Google Drive |
| **Scalability Bottleneck** | Expensive SQL `LIKE '%...%'` full-table scans | Sub-second ANN vector lookup with independent Firestore hydration |
