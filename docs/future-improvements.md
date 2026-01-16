# Project Roadmap

This document outlines the implementation plan and future vision for the **FastAPI OCR Microservice**. As the project is currently in the **Design Phase**, all features below are pending implementation.

## Phase 1: MVP (Minimum Viable Product)
**Goal**: Functional OCR service deployed to a single container.

- [✔️] **Scaffold Project Structure**: Setup `app/`, `requirements.txt`, `Dockerfile`.
- [✔️] **Core Endpoint**: Implement `POST /` for `pytesseract` integration.
- [✔️] **Image Upload**: Implement `POST /image-upload/` for debugging.
- [✔️] **Authentication**: Implement dependency for Bearer token validation.
- [✔️] **Docker Config**: Write production-ready `Dockerfile` and `entrypoint.sh`.

## Phase 2: Optimizations (Post-Launch)
**Goal**: Performance tuning.

- [ ] **Response Caching**: Cache results for identical images.
- [ ] **Image Pre-processing**: Add OpenCV step to improve Tesseract accuracy.

## Phase 3: Long-term Vision

- [ ] **Kubernetes Support**: Helm charts.
- [ ] **PDF Support**: Multi-page document ingestion.
- [ ] **Advanced Metrics**: Prometheus/Grafana integration.

## Dependencies & Order of Implementation

1. **Python Backbone**: FastAPI app structure.
2. **OCR Integration**: Verifying `pytesseract` works in the container.
3. **API Layer**: Exposing the functionality via HTTP.
4. **Security Layer**: Adding Auth.
5. **Deployment Artifact**: Building the Docker image.
