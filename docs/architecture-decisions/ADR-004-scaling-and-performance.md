# ADR 004: Scaling and Performance Strategy

## Status
Accepted

## Context
We anticipate that Tesseract OCR will be CPU-intensive and blocking. We need a strategy to handle this in the implementation.

## Decision
1. **Concurrency Model**: We will use **FastAPI** but acknowledge the synchronous nature of the underlying Tesseract call.
2. **Scaling Unit**: We will scale by adding Container Replicas.


## Alternatives Considered
1. **Async Task Queue (Internal)**:
   - *Decision*: Deferred to Phase 2 to keep Phase 1 (MVP) simple.

## Consequences
### Positive
- **Simplicity**: Synchronous API is easier to consume.

### Negative
- **Blocking Risk**: High risk of blocking the loop; mitigated by load balancing strategy.

## Trade-offs
We accept the blocking risk for the MVP to accelerate initial delivery.
