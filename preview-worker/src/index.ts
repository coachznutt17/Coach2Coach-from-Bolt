import { createClient } from '@supabase/supabase-js';
import { spawn } from 'child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import sharp from 'sharp';
import { scanContent, getScannerConfig } from '../../src/lib/scanner';

// Preview worker requires service role key for write operations
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Supabase URL not configured');
}

if (!serviceRoleKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not configured');
  console.error('   Preview worker requires service role key for write operations');
  console.error('   Worker cannot start without proper credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const PREVIEW_BUCKET = 'resources-preview';
const ORIGINAL_BUCKET = 'resources-original';

async function loop() {
  console.log('🔄 Preview worker started, checking for jobs...');
  
  while (true) {
    try {
      const { data } = await supabase
        .from('preview_jobs')
        .select('*')
        .eq('status', 'queued')
        .order('created_at', { ascending: true })
        .limit(1);
      
      const job = data?.[0];
      if (!job) {
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }

      console.log(`📋 Processing job ${job.id} for resource ${job.resource_id}`);

      // Mark job as processing
      await supabase
        .from('preview_jobs')
        .update({ 
          status: 'processing',
          attempts: job.attempts + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', job.id);

      // Mark resource as processing
      await supabase
        .from('resources')
        .update({ processing_status: 'processing' })
        .eq('id', job.resource_id);

      try {
        // Download original file
        const localFile = path.join(os.tmpdir(), `upload_${job.id}`);
        const { data: fileData, error: downloadError } = await supabase.storage
          .from(ORIGINAL_BUCKET)
          .download(job.original_path.replace(`${ORIGINAL_BUCKET}/`, ''));

        if (downloadError || !fileData) {
          throw new Error(`Download failed: ${downloadError?.message}`);
        }

        const buffer = Buffer.from(await fileData.arrayBuffer());
        await fs.writeFile(localFile, buffer);

        console.log(`📁 Downloaded file: ${job.original_path} (${buffer.length} bytes)`);

        // Run automated content scanning
        console.log(`🔍 Scanning content for resource ${job.resource_id}`);
        const scanResult = await scanContent(localFile, job.mime_type, job.original_path, getScannerConfig());
        
        // Update moderation queue with scan results
        await supabase
          .from('moderation_queue')
          .update({
            risk_score: scanResult.riskScore,
            flags: scanResult.flags
          })
          .eq('resource_id', job.resource_id);

        console.log(`🔍 Scan complete: Risk ${scanResult.riskScore}, Flags: ${scanResult.flags.join(', ')}`);

        // Process based on MIME type
        if (job.mime_type.includes('pdf')) {
          await processPdf(localFile, job.resource_id);
        } else if (job.mime_type.includes('video')) {
          await processVideo(localFile, job.resource_id);
        } else if (job.mime_type.includes('image')) {
          await processImage(localFile, job.resource_id);
        } else {
          // Try to convert to PDF first, then process
          const pdfPath = await convertToPdf(localFile, job.mime_type);
          await processPdf(pdfPath, job.resource_id);
        }

        // Mark as completed
        await supabase
          .from('resources')
          .update({ 
            processing_status: 'ready', 
            is_preview_ready: true,
            last_error: null,
            scanner_flags: scanResult.flags,
            risk_score: scanResult.riskScore
          })
          .eq('id', job.resource_id);

        await supabase
          .from('preview_jobs')
          .update({ 
            status: 'done',
            updated_at: new Date().toISOString()
          })
          .eq('id', job.id);

        console.log(`✅ Successfully processed resource ${job.resource_id}`);

        // Clean up temp file
        await fs.unlink(localFile).catch(() => {});

      } catch (err: any) {
        console.error(`❌ Processing failed for job ${job.id}:`, err.message);

        await supabase
          .from('resources')
          .update({ 
            processing_status: 'failed', 
            last_error: err.message 
          })
          .eq('id', job.resource_id);

        await supabase
          .from('preview_jobs')
          .update({ 
            status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', job.id);
      }

    } catch (error) {
      console.error('❌ Worker loop error:', error);
      await new Promise(r => setTimeout(r, 5000)); // Wait longer on errors
    }
  }
}

async function processPdf(localPath: string, resourceId: string) {
  console.log(`📄 Processing PDF for resource ${resourceId}`);
  
  const outputDir = path.join(os.tmpdir(), `preview_${resourceId}`);
  await fs.mkdir(outputDir, { recursive: true });

  // Convert first 3 pages to PNG using pdftoppm
  const pdfCommand = spawn('pdftoppm', [
    '-png',
    '-f', '1',      // First page
    '-l', '3',      // Last page (3 pages max)
    '-scale-to-x', '800',  // Max width 800px
    '-scale-to-y', '-1',   // Maintain aspect ratio
    localPath,
    path.join(outputDir, 'page')
  ]);

  await new Promise((resolve, reject) => {
    pdfCommand.on('close', (code) => {
      if (code === 0) resolve(code);
      else reject(new Error(`pdftoppm failed with code ${code}`));
    });
  });

  // Get generated PNG files
  const files = await fs.readdir(outputDir);
  const pngFiles = files.filter(f => f.endsWith('.png')).sort();

  console.log(`📄 Generated ${pngFiles.length} preview pages`);

  // Add watermarks and upload each page
  const previewPaths: string[] = [];
  
  for (let i = 0; i < pngFiles.length; i++) {
    const pngPath = path.join(outputDir, pngFiles[i]);
    const watermarkedPath = path.join(outputDir, `watermarked_${i + 1}.png`);

    // Add watermark using Sharp
    await sharp(pngPath)
      .composite([{
        input: Buffer.from(`
          <svg width="200" height="50">
            <rect width="200" height="50" fill="rgba(0,0,0,0.1)" rx="5"/>
            <text x="100" y="25" text-anchor="middle" dy="0.3em" 
                  font-family="Arial" font-size="12" fill="rgba(255,255,255,0.8)">
              Coach2Coach • Preview
            </text>
          </svg>
        `),
        gravity: 'southeast'
      }])
      .png()
      .toFile(watermarkedPath);

    // Upload to preview bucket
    const previewFileName = `${resourceId}/page_${i + 1}.png`;
    const watermarkedBuffer = await fs.readFile(watermarkedPath);
    
    const { error: uploadError } = await supabase.storage
      .from(PREVIEW_BUCKET)
      .upload(previewFileName, watermarkedBuffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      throw uploadError;
    }

    previewPaths.push(previewFileName);
  }

  // Update resource with preview paths
  await supabase
    .from('resources')
    .update({ 
      storage_path_preview: previewPaths[0], // Main preview
      preview_count: previewPaths.length
    })
    .eq('id', resourceId);

  // Clean up temp files
  await fs.rm(outputDir, { recursive: true, force: true });
  
  console.log(`✅ PDF processing complete: ${previewPaths.length} previews generated`);
}

async function processVideo(localPath: string, resourceId: string) {
  console.log(`🎥 Processing video for resource ${resourceId}`);
  
  const outputDir = path.join(os.tmpdir(), `preview_${resourceId}`);
  await fs.mkdir(outputDir, { recursive: true });

  const previewPath = path.join(outputDir, 'preview.mp4');

  // Create 30-second preview with watermark using ffmpeg
  const ffmpegCommand = spawn('ffmpeg', [
    '-i', localPath,
    '-t', '30',                    // 30 seconds
    '-vf', 'scale=640:360,drawtext=text="Coach2Coach Preview":fontcolor=white:fontsize=24:box=1:boxcolor=black@0.5:boxborderw=5:x=(w-text_w)/2:y=h-th-10',
    '-c:v', 'libx264',
    '-c:a', 'aac',
    '-b:v', '500k',               // Lower bitrate
    '-y',                         // Overwrite output
    previewPath
  ]);

  await new Promise((resolve, reject) => {
    ffmpegCommand.on('close', (code) => {
      if (code === 0) resolve(code);
      else reject(new Error(`ffmpeg failed with code ${code}`));
    });
  });

  // Upload preview video
  const previewFileName = `${resourceId}/preview.mp4`;
  const previewBuffer = await fs.readFile(previewPath);
  
  const { error: uploadError } = await supabase.storage
    .from(PREVIEW_BUCKET)
    .upload(previewFileName, previewBuffer, {
      contentType: 'video/mp4',
      upsert: true
    });

  if (uploadError) {
    throw uploadError;
  }

  // Update resource
  await supabase
    .from('resources')
    .update({ 
      storage_path_preview: previewFileName,
      preview_count: 1
    })
    .eq('id', resourceId);

  // Clean up
  await fs.rm(outputDir, { recursive: true, force: true });
  
  console.log(`✅ Video processing complete: 30s preview generated`);
}

async function processImage(localPath: string, resourceId: string) {
  console.log(`🖼️ Processing image for resource ${resourceId}`);
  
  const outputDir = path.join(os.tmpdir(), `preview_${resourceId}`);
  await fs.mkdir(outputDir, { recursive: true });

  const watermarkedPath = path.join(outputDir, 'watermarked.png');

  // Resize and add watermark
  await sharp(localPath)
    .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
    .composite([{
      input: Buffer.from(`
        <svg width="200" height="50">
          <rect width="200" height="50" fill="rgba(0,0,0,0.1)" rx="5"/>
          <text x="100" y="25" text-anchor="middle" dy="0.3em" 
                font-family="Arial" font-size="12" fill="rgba(255,255,255,0.8)">
            Coach2Coach • Preview
          </text>
        </svg>
      `),
      gravity: 'southeast'
    }])
    .png()
    .toFile(watermarkedPath);

  // Upload watermarked image
  const previewFileName = `${resourceId}/preview.png`;
  const watermarkedBuffer = await fs.readFile(watermarkedPath);
  
  const { error: uploadError } = await supabase.storage
    .from(PREVIEW_BUCKET)
    .upload(previewFileName, watermarkedBuffer, {
      contentType: 'image/png',
      upsert: true
    });

  if (uploadError) {
    throw uploadError;
  }

  // Update resource
  await supabase
    .from('resources')
    .update({ 
      storage_path_preview: previewFileName,
      preview_count: 1
    })
    .eq('id', resourceId);

  // Clean up
  await fs.rm(outputDir, { recursive: true, force: true });
  
  console.log(`✅ Image processing complete: watermarked preview generated`);
}

async function convertToPdf(localPath: string, mimeType: string): Promise<string> {
  console.log(`🔄 Converting ${mimeType} to PDF`);
  
  const outputDir = path.join(os.tmpdir(), `convert_${Date.now()}`);
  await fs.mkdir(outputDir, { recursive: true });
  
  const pdfPath = path.join(outputDir, 'converted.pdf');

  // Use LibreOffice to convert to PDF
  const libreCommand = spawn('libreoffice', [
    '--headless',
    '--convert-to', 'pdf',
    '--outdir', outputDir,
    localPath
  ]);

  await new Promise((resolve, reject) => {
    libreCommand.on('close', (code) => {
      if (code === 0) resolve(code);
      else reject(new Error(`LibreOffice conversion failed with code ${code}`));
    });
  });

  // Find the generated PDF
  const files = await fs.readdir(outputDir);
  const pdfFile = files.find(f => f.endsWith('.pdf'));
  
  if (!pdfFile) {
    throw new Error('PDF conversion failed - no output file');
  }

  return path.join(outputDir, pdfFile);
}

// Start the worker loop
loop().catch(error => {
  console.error('Worker crashed:', error);
  process.exit(1);
});