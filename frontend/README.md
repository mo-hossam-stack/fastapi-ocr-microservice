# OCR Microservice - Frontend

A professional React + TypeScript frontend for the OCR Microservice.
This application strictly consumes the backend API and handles all user interactions, validaton, and error states.

## 🚀 Quick Start

### 1. Run with Docker Request (Recommended)
This starts both frontend and backend in a shared network.
```bash
# From repository root
docker-compose up --build
```
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000` (Internal, proxied via Frontend)

### 2. Run Locally (Development)
You need to run the backend and frontend separately.

**Terminal 1: Backend**
```bash
# From repository root
cd app
# Ensure backend venv is active and dependencies installed
uvicorn main:app --reload --port 8000
```

**Terminal 2: Frontend**
```bash
cd frontend
npm install
npm run dev
```
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- **Proxy**: Vite uses `vite.config.ts` to proxy `/api` requests to `localhost:8000` to avoid CORS.

## 🛠 Configuration

Configuration is managed via Environment Variables.
Copy `.env.example` to `.env.local` for local development.

| Variable | Description | Default |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Base path for API calls. Use `/api` to leverage proxies. | `/api` |
| `VITE_AUTH_TOKEN` | Auth token for backend. | *(Empty)* |

### Docker Environment
In `docker-compose.yml`, the frontend service accepts:
- `API_PROXY_TARGET`: The backend URL (e.g., `http://backend:8000`). Nginx proxies `/api` requests here.
- `FRONTEND_PORT`: Port to expose (Default: 3000).

## 🏗 Architecture & Microservice Boundaries

- **Backend as Black Box**: The frontend assumes nothing about the backend's internal state. It strictly follows the API contract (HTTP 200, 4xx, 5xx).
- **Proxy Strategy**: The backend does not implement CORS. The frontend infrastructure (Nginx in Prod, Vite in Dev) handles the "Same Origin" policy by proxying `/api` calls.
- **Validation**:
  - **File Size**: Frontend validates size (>10MB) to provide instant feedback, but keeps the backend as the final source of truth (413).
  - **Extensions**: Frontend limits file selection, but backend validates content (415).
- **State Management**: React Hooks manage UI states (Uploading, Processing, Success, Error) driven entirely by HTTP status codes.
