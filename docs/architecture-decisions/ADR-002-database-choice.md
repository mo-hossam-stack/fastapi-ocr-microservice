# ADR 002: Database Choice - Stateless Architecture

## Status
Accepted

## Context
We need to decide whether the OCR microservice requires its own persistent storage for images or results.

## Decision
We will adopt a **Stateless Architecture** with **No Persistent Database**.
- The service will not store images long-term.
- The service will return results immediately and not store them.

## Alternatives Considered
1. **PostgreSQL/MySQL**:
   - *Context*: Storing request history.
   - *Cons*: unnecessary complexity; the calling app should manage data.

2. **Redis**:
   - *Context*: Caching.
   - *Cons*: Deferred to Phase 3 (Optimization).

## Consequences
### Positive
- **Simplicity**: Faster development (Phase 1).
- **Deployment**: Easier scaling.

## Trade-offs
We prioritize simplicity over auditability for the initial version.
