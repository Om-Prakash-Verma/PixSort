# Google AI Photo Search

A modern personal photo management and semantic search web application inspired by Google Photos, engineered with Google's AI and cloud ecosystem.

The core differentiating capability:
> **Search personal photos using natural language and find photos based on their visual and semantic meaning.**
>
> *Example:* Search `"Pool party"` &rarr; Returns photos of friends swimming by turquoise water with inflatables and drinks, even if the photo is named `IMG_8392.jpg` with zero keywords.

---

## Google Products Used & Why

| Google Product | Role in Architecture | Why It Was Chosen |
| :--- | :--- | :--- |
| **Gemini Multimodal AI** (`gemini-2.5-flash`) | **Vision Intelligence & Description** | Automatically generates rich descriptive captions, extracts detected objects, identifies activities (e.g. swimming, hiking), detects environments, and extracts temporal context from uploaded photos. |
| **Gemini Multimodal Embedding 2** (`gemini-embedding-2-preview`) | **Unified Semantic Vector Space** | Projects both text queries and visual photo concepts into a shared 768-dimensional multimodal vector space, making natural language and image similarity searches mathematically comparable. |
| **Google Cloud Vertex AI Vector Search** | **Vector Indexing & Nearest Neighbor Search** | Performs sub-second Approximate Nearest Neighbor (ANN) cosine similarity matching across photo embeddings, ranking images strictly by conceptual relevance. |
| **Google Cloud Firestore** | **Persistent Metadata Database** | Scalable, real-time NoSQL document database persisting photo metadata (dates, locations, album assignments, favorites, trash lifecycle) across sessions and browser reloads. |
| **Google Cloud Storage (GCS)** | **High-Durable Object Storage** | Stores high-resolution photo binaries and downscaled web thumbnails (`gs://photos-bucket-prod/...`). |
| **Google Cloud Run** | **Serverless Container Deployment** | High-performance containerized execution environment serving the Express backend and React frontend with HTTPS and automatic scale-to-zero capabilities. |

---

## Key Features

- **Natural Language Semantic Search**: Search by concepts, scenes, activities, or objects without knowing dates or filenames.
- **Multimodal Similarity Search**: "Find Similar Photos" calculates cosine distance in Vertex AI Vector Search to surface conceptually related pictures.
- **Date & Location Grouping**: Chronological grouping by captured date with location tagging and interactive filters.
- **Floating Sticky Sidebar**: Quick navigation for Photos, Favorites, Albums, and Trash with responsive docking.
- **Albums & Organization**: Create and manage custom photo albums with dynamic count tracking.
- **AI Architecture Inspector**: Real-time modal detailing the multimodal vector pipeline and live Google Cloud services status.
- **Soft Neomorphic Design**: Visual palette with custom raised and inset tactile elements designed for clean contrast and zero visual fatigue.

---

## Getting Started

### Prerequisites

- Node.js 20+
- Valid `GEMINI_API_KEY` (configured via environment or AI Studio Secrets)

### Installation

```bash
# Install dependencies
npm install

# Start development server on port 3000
npm run dev

# Build for production
npm run build
```
