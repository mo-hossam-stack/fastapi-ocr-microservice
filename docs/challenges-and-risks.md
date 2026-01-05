# Challenges and Risks (Anticipated)

This document outlines the technical challenges and risks identified during the design phase, prior to implementation.

## 1. Technical Challenges

### 1.1 Blocking the Event Loop
**Risk**: High
The planned integration of `pytesseract` involves a blocking CPU-bound operation.
- **Anticipated Impact**: Running blocking code in an `async` FastAPI route without waiting in a separate thread pool will freeze the event loop, causing timeouts for concurrent requests.
- **Mitigation Strategy**: 
  - Ensure the implementation uses `run_in_executor` or relies on multiple worker processes (Gunicorn) to limit the blast radius of a single blocked worker.

### 1.2 Tesseract Dependency Management
**Risk**: Medium
The system will rely on the `tesseract-ocr` binary.
- **Anticipated Impact**: Docker image updates could change Tesseract versions, potentially altering OCR accuracy.
- **Mitigation Strategy**: Pin base image versions in the `Dockerfile`.

## 2. Security Risks

### 2.1 Shared Token Management
**Risk**: Medium
Using a static `APP_AUTH_TOKEN`.
- **Anticipated Impact**: Key leakage requires manual rotation and redeployment.
- **Mitigation Strategy**: Use secrets management (e.g., Docker Secrets, K8s Secrets) to inject the token, rather than hardcoding it in the image.

### 2.2 Malicious Image Uploads
**Risk**: Low
Parsing untrusted image data.
- **Anticipated Impact**: "Zip bombs" or pixel floods crashing the worker.
- **Mitigation Strategy**: Implement file size limits in Nginx/Gunicorn and within FastAPI/Pydantic validation.

## 3. Scaling Bottlenecks

### 3.1 CPU Saturation
**Risk**: High
OCR is computationally expensive.
- **Strategy**: We will design the deployment to support horizontal autoscaling based on CPU utilization.

### 3.2 Latency
**Risk**: Medium
- **Strategy**: Recommend client-side resizing of images before upload to reduce network transfer time and processing overhead.
