# Coach2Coach Preview Worker

Background service that processes uploaded coaching resources and generates watermarked previews for trial users.

## Features

- **PDF Processing**: Converts first 3 pages to watermarked PNG images
- **Video Processing**: Creates 30-second preview clips with watermarks
- **Document Conversion**: Converts Word/PowerPoint to PDF then processes
- **Image Processing**: Resizes and watermarks images
- **Queue Management**: Processes jobs from Supabase queue table

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Install System Dependencies

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install ffmpeg poppler-utils libreoffice fonts-dejavu-core
```

**macOS:**
```bash
brew install ffmpeg poppler libreoffice
```

**Windows:**
- Install FFmpeg: https://ffmpeg.org/download.html
- Install Poppler: https://poppler.freedesktop.org/
- Install LibreOffice: https://www.libreoffice.org/

### 3. Environment Variables
Create `.env` file:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Run Worker
```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## Docker Deployment

```bash
# Build image
docker build -t coach2coach-preview-worker .

# Run container
docker run -d \
  --name preview-worker \
  -e NEXT_PUBLIC_SUPABASE_URL=your_url \
  -e SUPABASE_SERVICE_ROLE_KEY=your_key \
  coach2coach-preview-worker
```

## How It Works

1. **Upload**: Coach uploads resource file to temp storage
2. **Commit**: API moves file to permanent storage and creates preview job
3. **Worker**: Picks up job from queue and processes file
4. **Preview**: Generates watermarked previews for trial users
5. **Complete**: Updates resource status and makes preview available

## Supported File Types

- **PDFs**: Direct processing
- **Videos**: MP4, AVI, MOV, etc.
- **Images**: JPG, PNG, GIF, etc.
- **Documents**: Word, PowerPoint, Excel (converted via LibreOffice)

## Preview Specifications

- **PDF**: First 3 pages, 800px width, watermarked
- **Video**: 30 seconds, 640x360, watermarked, 500kbps
- **Images**: Max 800x600, watermarked
- **Watermark**: "Coach2Coach • Preview" in bottom-right corner