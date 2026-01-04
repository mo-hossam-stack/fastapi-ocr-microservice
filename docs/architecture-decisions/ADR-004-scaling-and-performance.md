# ADR 004: Scaling and Performance Strategy

## Status
NOT Accepted yet

## Context
We anticipate that Tesseract OCR will be CPU-intensive and blocking. We need a strategy to handle this in the implementation.

## Decision
1. **Concurrency Model**: We will use **FastAPI** but acknowledge the synchronous nature of the underlying Tesseract call.
2. **Scaling Unit**: We will scale by adding Container Replicas.
