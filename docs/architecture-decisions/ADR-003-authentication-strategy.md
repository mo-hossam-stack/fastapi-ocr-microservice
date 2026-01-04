# ADR 003: Authentication Strategy - Shared Token

## Status
Accepted

## Context
We need a mechanism to secure the communication between the primary Django application and this planned OCR service.

## Decision
We will implement a **Shared Secret (Bearer Token)** mechanism.
- The Microservice will read an `APP_AUTH_TOKEN` from the environment.
- The Client must send this token in the `Authorization` header.

## Alternatives Considered
1. **OAuth2 / OIDC**:
   - *Cons*: Too complex for initial internal service-to-service needs.

## Consequences
### Positive
- **Speed**: Fast to implement in Phase 1.

### Negative
- **Security**: Key rotation is manual.

## Trade-offs
We chose the shared token for its suitability for the MVP phase.
