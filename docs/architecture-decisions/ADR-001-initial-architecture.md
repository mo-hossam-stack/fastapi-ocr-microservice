# ADR 001: Initial Architecture - Python Microservice

## Status
Accepted

## Context
The project requires a text extraction capability (OCR) for a planned Django application feature. The OCR process is anticipated to be resource-intensive (CPU/Memory). We need to determine the best architectural approach before starting implementation.

## Decision
We have decided to build a **standalone Microservice** using **FastAPI** wrapping **Tesseract OCR**, containerized with **Docker**.

## Alternatives Considered
1. **Direct Integration (Celery Task in Django)**:
   - *Pros*: Simpler infrastructure.
   - *Cons*: Heavy dependencies (`tesseract-dev`) would pollute the main app environment; scaling the OCR worker independently is harder.
   
2. **Serverless Function (AWS Lambda/GCP Cloud Run)**:
   - *Pros*: Infinite scaling.
   - *Cons*: "Cold start" latency concerns with heavy ML binaries.

## Consequences
### Positive
- **Isolation**: Prevents OCR crashes from affecting the main application.
- **Scalability**: Allows independent scaling of the OCR component.

### Negative
- **Complexity**: Adds a new service to manage.
- **Latency**: Introduces network overhead.

## Trade-offs
We accept the operational complexity of a microservice to gain stability for the main application.
