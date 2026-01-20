# PDF2PNG Service

REST API service for converting PDF documents to PNG images. This service runs in a Docker container and is used by the visual test suite.

## Overview

The PDF2PNG service provides a REST API endpoint that accepts PDF data and returns PNG images of each page. It uses PDF.js for PDF parsing and Node Canvas for rendering.

## API Endpoints

### POST /pdf2png

Converts a PDF document to PNG images.

**Request:**
- Method: `POST`
- Content-Type: `application/pdf`
- Body: Raw PDF binary data
- Query Parameters:
  - `systemFonts` (optional): `true` or `false` (default: `false`). When `true`, uses system fonts instead of embedded fonts.

**Response:**
- Content-Type: `application/json`
- Body: JSON object with `images` array containing base64-encoded PNG strings
  ```json
  {
    "images": ["base64string1", "base64string2", ...]
  }
  ```

**Status Codes:**
- `200 OK`: Success
- `400 Bad Request`: Invalid request (e.g., missing PDF data)
- `500 Internal Server Error`: Conversion failed

**Example:**
```bash
curl -X POST http://localhost:3000/pdf2png?systemFonts=false \
  -H "Content-Type: application/pdf" \
  --data-binary @document.pdf
```

### GET /health

Health check endpoint.

**Response:**
- `200 OK`: Service is healthy
- Body: `{"status": "ok"}`

## Running the Service

### Using Docker Compose (Recommended)

Start the service:
```bash
npm run test:visual:service:start
```

Stop the service:
```bash
npm run test:visual:service:stop
```

View logs:
```bash
npm run test:visual:service:logs
```

### Manual Docker Build

```bash
cd tests/visual/pdf2png-service
docker compose build
docker compose up
```

### Running Locally (Without Docker)

1. Install dependencies:
```bash
cd tests/visual/pdf2png-service
npm install
```

2. Start the server:
```bash
npm start
```

The service will start on port 3000 by default. Set the `PORT` environment variable to use a different port.

## Configuration

### Environment Variables

- `PORT`: Port number for the service (default: `3000`)
- `PDF2PNG_SERVICE_URL`: Full URL of the service (used by tests, default: `http://localhost:3000`)

### Port Configuration

The service uses port 3000 by default. If this port is already in use, you can:

1. Set `PDF2PNG_SERVICE_URL` environment variable to point to a different port
2. Modify the port mapping in `docker-compose.yml` (or use `docker compose` commands)
3. Stop the process using port 3000

## Troubleshooting

### Service Won't Start

1. **Port already in use**: Check if port 3000 is in use:
   ```bash
   lsof -i :3000
   ```
   Stop the conflicting process or change the port.

2. **Docker not running**: Ensure Docker is installed and running:
   ```bash
   docker ps
   ```

3. **Build errors**: Rebuild the Docker image:
   ```bash
   cd tests/visual/pdf2png-service
   docker compose build --no-cache
   ```

### Service Not Responding

1. Check service logs:
   ```bash
   npm run test:visual:service:logs
   ```

2. Verify the service is running:
   ```bash
   curl http://localhost:3000/health
   ```

3. Check Docker container status:
   ```bash
   cd tests/visual/pdf2png-service
   docker compose ps
   ```

### Test Failures

If tests fail with "PDF2PNG service is unavailable":

1. Ensure the service is running: `npm run test:visual:service:start`
2. Check the service URL matches: Verify `PDF2PNG_SERVICE_URL` environment variable
3. Check service logs for errors
4. Verify network connectivity to the service

## Architecture

The service uses:
- **Express.js**: Web framework
- **PDF.js**: PDF parsing and rendering
- **Node Canvas**: Canvas implementation for server-side rendering
- **Docker**: Containerization for consistent environment

## Development

To modify the service:

1. Edit `server.js` in this directory
2. Rebuild the Docker image:
   ```bash
   cd tests/visual/pdf2png-service
   docker compose build
   docker compose up
   ```

The service automatically restarts when using `docker compose up` (not detached mode) after code changes, but you'll need to rebuild the image for changes to take effect in detached mode.
