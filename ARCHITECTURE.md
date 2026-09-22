# Architecture & Technical Blueprint

This document details the architecture, data models, and processing pipelines of the **Google AI Photo Search** application.

---

## 1. System Architecture Overview

```
                      +---------------------------------------+
                      |       Client (React 19 + Tailwind)     |
                      |    - Natural Language Search UI       |
                      |    - Floating Sticky Navigation       |
                      |    - Neomorphic Responsive Gallery    |
                      +-------------------+-------------------+
                                          | REST API
                                          v
                      +-------------------+-------------------+
                      |      Express API Server (Node.js)     |
                      |   /api/photos, /api/search, /api/albums|
                      +---------+-------------------+---------+
                                |                   |
               +----------------+                   +----------------+
               v                                                     v
+-------------------------------+                     +-------------------------------+
|     Google Cloud Firestore    |                     |   Gemini 2.5 Flash / Embed 2  |
| - Persistent photo metadata   |                     | - Multimodal visual analysis  |
| - Custom albums & trash state |                     | - 768-dim unified embeddings  |
+-------------------------------+                     +---------------+---------------+
                                                                      |
                                                                      v
                                                      +---------------+---------------+
                                                      |  Vertex AI Vector Search      |
                                                      | - Cosine similarity index     |
                                                      | - Sub-second ANN search       |
                                                      +-------------------------------+
```

---

## 2. Ingestion & Upload Pipeline

When a user uploads a new photograph:

1. **Storage Ingestion (Cloud Storage)**:
   - The original binary is written to Google Cloud Storage (`gs://photos-bucket-prod/photos/{id}.jpg`).
   - A client-friendly web thumbnail is generated (`gs://photos-bucket-prod/thumbnails/{id}.jpg`).

2. **Multimodal Visual Analysis (Gemini 2.5 Flash)**:
   - The image is analyzed by Gemini Vision to extract:
     - `aiDescription`: High-level natural sentence describing the scene.
     - `objects`: Array of identified objects (e.g., `['Swimming pool', 'Inflatable float', 'Sun loungers']`).
     - `activities`: Detected actions (e.g., `['Pool party', 'Swimming', 'Sunbathing']`).
     - `environment`: Setting characteristics (e.g., `'Outdoor resort poolside'`).
     - `time`: Time of day (e.g., `'Afternoon'`).

3. **Multimodal Vector Embedding (Gemini Multimodal Embedding 2)**:
   - The visual metadata and scene description are projected into a 768-dimensional dense vector representation via `gemini-embedding-2-preview`.

4. **Vector Indexing (Vertex AI Vector Search)**:
   - The vector is indexed into the Vertex AI Vector Search engine along with filter metadata (location, date, favorite, trash).

5. **Metadata Persistence (Google Cloud Firestore)**:
   - The complete photo document is saved to Firestore under the `/photos` collection.

---

## 3. Natural Language Search Pipeline

When a user inputs a query (e.g., `"Pool party"` or `"Beach photos from Goa"`):

1. **Query Interpretation (Gemini)**:
   - Extracts semantic intent and identifies any explicit temporal (e.g., `"July 2026"`) or spatial (e.g., `"Goa"`) filters.
2. **Dense Vector Embedding (Gemini Embedding 2)**:
   - Converts the natural language query into a 768-dimensional vector in the same multimodal space.
3. **Vertex AI Vector Search Matching**:
   - Calculates cosine similarity against all active photo embeddings:
     $$\text{similarity} = \frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{u}\| \|\mathbf{v}\|}$$
   - Filters out items flagged as trash.
   - Returns top candidate IDs ranked by similarity score.
4. **Hydration & Delivery**:
   - Photo metadata is hydrated from Firestore and returned to the client within milliseconds.

---

## 4. Google Products Breakdown

- **Gemini Multimodal AI (`gemini-2.5-flash`)**: Core visual intelligence engine.
- **Gemini Embedding 2 (`gemini-embedding-2-preview`)**: Multimodal embedding model unifying text and imagery into one geometric space.
- **Google Cloud Vertex AI Vector Search**: High-scale Approximate Nearest Neighbor (ANN) index.
- **Google Cloud Firestore**: Real-time serverless NoSQL database for metadata and albums.
- **Google Cloud Storage (GCS)**: Durable binary object storage.
- **Google Cloud Run**: Serverless container execution platform.
