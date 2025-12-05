// Resources API routes with membership gating and file processing

import { Router } from 'express';
import { query } from '../lib/db';
import { supabase } from '../lib/supabase';
import { requireActiveMember, requireCreator, logAuditEvent } from '../lib/api';

const router = Router();

// List resources with filtering
router.get('/', async (req, res) => {
  try {
    const { search, sport, level, category, limit = 20, offset = 0 } = req.query;

    let resourceQuery = supabase
      .from('resources')
      .select(`
        *,
        profiles:owner_id (first_name, last_name, title)
      `)
      .eq('is_listed', true)
      .eq('status', 'active')
      .order('created_at', { ascending: false});

    if (sport) {
      resourceQuery = resourceQuery.contains('sports', [sport]);
    }

    if (level) {
      resourceQuery = resourceQuery.contains('levels', [level]);
    }

    if (category) {
      resourceQuery = resourceQuery.eq('category', category);
    }

    if (search) {
      resourceQuery = resourceQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    resourceQuery = resourceQuery.range(Number(offset), Number(offset) + Number(limit) - 1);

    const { data, error } = await resourceQuery;

    if (error) {
      throw error;
    }

    res.json({ data, error: null });
  } catch (error) {
    console.error('Error listing resources:', error);
    res.status(500).json({ error: 'Failed to list resources' });
  }
});

// Get single resource details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('resources')
      .select(`
        *,
        profiles:owner_id (first_name, last_name, title, bio)
      `)
      .eq('id', id)
      .eq('is_listed', true)
      .eq('status', 'active')
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    res.json({ data, error: null });
  } catch (error) {
    console.error('Error fetching resource:', error);
    res.status(500).json({ error: 'Failed to fetch resource' });
  }
});

// Upload resource metadata (requires active creator)
router.post('/', async (req, res) => {
  try {
    const { userId, title, description, priceCents, sports, levels, category, storagePathOriginal, storagePathPreview, isFree, fileMime, fileSize } = req.body;

    // Verify user is active creator
    const isCreator = await requireCreator(userId);
    if (!isCreator) {
      return res.status(403).json({ error: 'Active creator account required to upload resources' });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!profile) {
      return res.status(403).json({ error: 'You must complete your profile before uploading resources.' });
    }

    // Create resource
    const { data: resource, error } = await supabase
      .from('resources')
      .insert({
        owner_id: profile.id,
        title,
        description,
        price_cents: priceCents || 0,
        is_free: isFree || priceCents === 0,
        sports: sports || [],
        levels: levels || [],
        category,
        file_url: storagePathOriginal,
        storage_path_original: storagePathOriginal,
        storage_path_preview: storagePathPreview,
        file_mime: fileMime,
        file_size: fileSize,
        is_listed: true,
        status: 'active',
        processing_status: 'completed'
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log audit event
    await logAuditEvent(userId, 'resource_uploaded', 'resource', resource.id, {
      title,
      category,
      price_cents: priceCents
    });

    res.json({ success: true, resourceId: resource.id, resource });
  } catch (error) {
    console.error('Error uploading resource:', error);
    res.status(500).json({ error: 'Failed to upload resource' });
  }
});

// Commit uploaded file and trigger preview processing
router.post('/commit', async (req, res) => {
  try {
    const { resourceId, tempPath, finalFilename, mimeType } = req.body;

    if (!resourceId || !tempPath || !finalFilename || !mimeType) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Move file from temp → resources-original
    const { error: copyError } = await supabase.storage
      .from('temp-uploads')
      .move(tempPath, `resources-original/${finalFilename}`);

    if (copyError) {
      return res.status(500).json({ error: copyError.message });
    }

    // Update resource with final path and queue for processing
    const { error: updateError } = await supabase
      .from('resources')
      .update({
        storage_path_original: `resources-original/${finalFilename}`,
        processing_status: 'queued',
        is_preview_ready: false,
        last_error: null
      })
      .eq('id', resourceId);

    if (updateError) {
      return res.status(500).json({ error: updateError.message });
    }

    // Create preview job
    const { error: jobError } = await supabase
      .from('preview_jobs')
      .insert({
        resource_id: resourceId,
        original_path: `resources-original/${finalFilename}`,
        mime_type: mimeType
      });

    if (jobError) {
      return res.status(500).json({ error: jobError.message });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error committing resource:', error);
    res.status(500).json({ error: 'Failed to commit resource' });
  }
});

// Get signed upload URL for resource files
router.post('/upload-url', async (req, res) => {
  try {
    const { userId, fileName, fileType, isPreview = false } = req.body;

    // Verify user is active creator
    const isCreator = await requireCreator(userId);
    if (!isCreator) {
      return res.status(403).json({ error: 'Active creator account required' });
    }

    const bucket = isPreview ? 'resources-preview' : 'temp-uploads';
    const filePath = `${userId}/${Date.now()}_${fileName}`;

    // Create signed upload URL
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(filePath, {
        upsert: false
      });

    if (error) {
      throw error;
    }

    res.json({ 
      success: true, 
      uploadUrl: data.signedUrl,
      filePath: filePath,
      bucket: bucket
    });
  } catch (error) {
    console.error('Error creating upload URL:', error);
    res.status(500).json({ error: 'Failed to create upload URL' });
  }
});

// Get resource preview (public access)
router.get('/:id/preview', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: resource } = await supabase
      .from('resources')
      .select('storage_path_preview, title, is_preview_ready, processing_status')
      .eq('id', id)
      .eq('is_listed', true)
      .eq('status', 'active')
      .single();

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    if (!resource.is_preview_ready) {
      return res.json({ 
        success: false, 
        processing: true,
        status: resource.processing_status,
        message: 'Preview is being generated. Please check back in a few minutes.'
      });
    }

    if (!resource.storage_path_preview) {
      return res.status(404).json({ error: 'Preview not available' });
    }

    // Get public URL for preview
    const { data } = supabase.storage
      .from('resources-preview')
      .getPublicUrl(resource.storage_path_preview);

    res.json({ 
      success: true, 
      previewUrl: data.publicUrl,
      title: resource.title
    });
  } catch (error) {
    console.error('Error getting preview:', error);
    res.status(500).json({ error: 'Failed to get preview' });
  }
});

// Get processing status
router.get('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: resource } = await supabase
      .from('resources')
      .select('processing_status, is_preview_ready, last_error, preview_count')
      .eq('id', id)
      .single();

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    res.json({
      success: true,
      status: resource.processing_status,
      isPreviewReady: resource.is_preview_ready,
      previewCount: resource.preview_count,
      lastError: resource.last_error
    });
  } catch (error) {
    console.error('Error getting resource status:', error);
    res.status(500).json({ error: 'Failed to get resource status' });
  }
});

// Download resource (requires purchase or free)
router.get('/:id/download', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get resource details
    const { data: resource, error: resourceError } = await supabase
      .from('resources')
      .select(`
        *,
        owner:profiles!owner_id(id, user_id)
      `)
      .eq('id', id)
      .single();

    if (resourceError || !resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    // Get user profile
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('id, membership_status')
      .eq('user_id', userId)
      .single();

    if (!userProfile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    // Check if user owns the resource
    const isOwner = resource.owner.user_id === userId;

    // Check if resource is free
    if (resource.is_free || resource.price_cents === 0) {
      // Free resources accessible to trial/active members
      if (!['trial', 'active'].includes(userProfile.membership_status) && !isOwner) {
        return res.status(403).json({ error: 'Active membership required for downloads' });
      }
    } else {
      // Paid resources require purchase
      if (!isOwner) {
        const { data: purchase } = await supabase
          .from('purchases')
          .select('id, status')
          .eq('buyer_id', userProfile.id)
          .eq('resource_id', id)
          .maybeSingle();

        if (!purchase || purchase.status !== 'completed') {
          return res.status(403).json({ error: 'Purchase required to download this resource' });
        }
      }
    }

    // Generate signed URL (5 minutes)
    const { data: signedData, error: signedError } = await supabase.storage
      .from('resources')
      .createSignedUrl(resource.file_url || resource.storage_path_original, 300);

    if (signedError) {
      throw signedError;
    }

    // Log download
    await supabase
      .from('resources')
      .update({ downloads: (resource.downloads || 0) + 1 })
      .eq('id', id);

    await logAuditEvent(userId as string, 'resource_downloaded', 'resource', id);

    // Redirect to signed URL
    res.redirect(302, signedData.signedUrl);
  } catch (error) {
    console.error('Error downloading resource:', error);
    res.status(500).json({ error: 'Failed to download resource' });
  }
});

export default router;