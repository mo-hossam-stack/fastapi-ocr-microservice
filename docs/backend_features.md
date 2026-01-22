# Backend Feature Inventory & Frontend Integration Guide

This document provides a comprehensive inventory of all backend features, safeguards, edge cases, and configuration options implemented in the OCR microservice. It is intended to guide frontend development to ensure UI accuracy and reliability.

## 1. API Endpoints & Core Features

| Feature | Location | Behavior / Constraints | Edge Cases / Failure Modes | Frontend Representation |
| :--- | :--- | :--- | :--- | :--- |
| **OCR Prediction** | `app.main.prediction_view`<br>`POST /` | **Auth Required** (`Authorization: <Type> <Token>`)<br>**Input:** Image file (`file` form-data)<br>**Output:** JSON `{"results": [], "original": ""}`<br>**Timeout:** 30.0s (hard limit) | **401 Unauthorized:** Missing/Invalid token<br>**413 Payload Too Large:** File > 10MB<br>**504 Gateway Timeout:** OCR takes > 30s<br>**400 Bad Request:** Invalid image file<br>**500**: OCR engine failure | - generic loading state (spinner)<br>- Display results on success<br>- Show specific error messages for 413, 504, 401<br>- **Do not** retry automatically on 413 or 400 |
| **Image Echo (Upload)** | `app.main.image_upload_view`<br>`POST /image-upload/` | **Auth:** None (in code), but typically protected by gateway<br>**Input:** Image file<br>**Output:** Returns original image file<br>**Config:** Only active if `echo_active=True` | **400 Bad Request:** `Uploading is disabled` (if config off)<br>**415 Unsupported Media Type:** Extension not allowed<br>**413 Payload Too Large:** File > 10MB<br>**400:** Invalid image content | - Use for debugging/verification UI<br>- Check status 400 to see if feature is disabled |
| **Health Check** | `app.main.health_check`<br>`GET /health` | Returns `200 OK` `{"status": "ok"}`<br>Lightweight liveness probe. | None expected | - Use for "Service Status" indicator (Green/Red) |
| **Readiness Check** | `app.main.readiness_check`<br>`GET /ready` | Checks if `pytesseract` can run.<br>Returns `200 OK` `{"status": "ready", ...}` | **503 Service Unavailable:** If OCR engine is missing or broken. | - Use before enabling "Upload" button<br>- Disable UI if 503 |
| **Home Page** | `app.main.home_view`<br>`GET /` | Returns HTML Template (`home.html`) | None | - Basic landing page (likely replaced by frontend app) |

## 2. Validation & Safeguards

| Feature | Location | Behavior / Constraints | Frontend Action |
| :--- | :--- | :--- | :--- |
| **File Size Limit** | `app.main.Settings.max_upload_size_mb`<br>`app.main.validate_file_size` | **Value:** 10 MB<br>**Check 1 (Proactive):** Checks `Content-Length` header.<br>**Check 2 (Reactive):** Checks actual bytes read. | - **Implement client-side check:** Prevent upload if `file.size > 10 * 1024 * 1024`<br>- Show "File too large (Max 10MB)" error. |
| **File Extension** | `app.main.ALLOWED_EXTENSIONS` | Allowed: `.png`, `.jpg`, `.jpeg`, `.webp` | - set `<input type="file" accept=".png,.jpg,.jpeg,.webp">`<br>- Validate extension before upload |
| **Image Content** | `app.main.image_upload_view` | Verifies actual file content using `PIL.Image.verify()` | - Handle "Invalid image file" error gracefully (file might be corrupt) |
| **OCR Timeout** | `app.main.Settings.ocr_timeout_seconds`<br>`app.main.run_ocr` | **Value:** 30.0 seconds<br>Hard timeout for OCR process. | - **Show progress bar** with 30s max duration.<br>- Handle 504 specifically: "Processing took too long, please try a clearer image." |

## 3. Configuration & Constants

| Constant / Config | Value / Default | Source | Notes |
| :--- | :--- | :--- | :--- |
| `ALLOWED_EXTENSIONS` | `.png`, `.jpg`, `.jpeg`, `.webp` | `app/main.py:169` | Whitelist only. |
| `max_upload_size_mb` | `10` | `.env` / `config.py` | Configurable. |
| `ocr_timeout_seconds` | `30.0` | `.env` / `config.py` | Configurable. |
| `app_auth_token` | *(Secret)* | `.env` | Required for `POST /`. |
| `echo_active` | `True` (default `False` in code) | `.env` | Controls `/image-upload/`. |
| `DEBUG` | `True` | `.env` | Enables `skip_auth` if configured. |

## 4. Error Codes & Messages (API Contract)

These messages are defined in `app/main.py` classes (`AuthErrorMessages`, `ResourceErrorMessages`) and should be expected by the frontend.

| Category | HTTP Code | API Error Message (`detail`) | Frontend User Message Suggestion |
| :--- | :--- | :--- | :--- |
| **Auth** | 401 | `Missing authorization header` | "Authentication failed: Missing credentials." |
| **Auth** | 401 | `Invalid authorization format` | "Authentication failed: Invalid header format." |
| **Auth** | 401 | `Invalid authorization token` | "Session expired or invalid token." |
| **Size** | 413 | `File too large. Maximum size: {N}MB` | "File exceeds the 10MB limit." |
| **Type** | 415 | `Unsupported image type` | "Only PNG, JPG, and WEBP are supported." |
| **Time** | 504 | `OCR execution timed out` | "Server timed out. Image might be too complex." |
| **Logic** | 400 | `Uploading is disabled` | "Image upload feature is currently disabled." |
| **System** | 503 | `OCR engine not available` | "System is currently unavailable. Please try later." |

## 5. Middleware & Logging

-   **Structured Logging**: Every request is logged with `method`, `path`, `status_code`, and `duration`.
    -   *Frontend Implication*: If diagnosing issues, provide the exact time and endpoint to backend support to correlate with logs.
-   **CORS**: **NOT EXPLICITLY CONFIGURED** in `app/main.py`.
    -   *Critical Note*: If the frontend is hosted on a different domain/port, CORS defaults might block requests. This needs to be addressed if valid requests fail with generic network errors.

## 6. Development vs. Production Behaviors

-   **Auth Skip**: If `DEBUG=True` AND `skip_auth=True` (in `.env`), the `verify_auth` dependency simply returns, bypassing validation.
    -   *Dev Mode*: Frontend can skip sending headers.
    -   *Prod Mode*: `skip_auth` should be `False`. Frontend **MUST** send headers.
