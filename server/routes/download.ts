// Secure download API routes with strict access control

import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { requireActiveMember, canDownloadResource, logAuditEvent } from '../lib/api';
import { createDownloadToken } from '../lib/download';

const router = Router();

// Get secure download URL for resource
router.get('/:resourceId', async (req, res) => {
  try {
    const { resourceId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    // Verify user is active member
    const isActive = await requireActiveMember(userId as string);
    if (!isActive) {
      return res.status(403).json({ error: 'Active membership required for downloads' });
    }

    // Check if user can download this specific resource
    const canDownload = await canDownloadResource(userId as string, resourceId);
    if (!canDownload) {
      return res.status(403).json({ error: 'You do not have access to this resource' });
    }

    // Get resource details
    const { data: resource } = await supabase
      .from('resources')
      .select('storage_path_original, title')
      .eq('id', resourceId)
      .single();

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    // Create time-limited signed URL (5 minutes)
    const { data, error } = await supabase.storage
      .from('resources-original')
      .createSignedUrl(resource.storage_path_original, 300); // 5 minutes

    if (error) {
      throw error;
    }

    // Create download token for additional security
    const downloadToken = createDownloadToken(userId as string, resourceId);

    // Log audit event
    await logAuditEvent(userId as string, 'resource_downloaded', 'resource', resourceId);

    // Increment download count
    await supabase
      .from('resources')
      .update({ downloads: supabase.sql`downloads + 1` })
      .eq('id', resourceId);

    res.json({ 
      success: true, 
      downloadUrl: data.signedUrl,
      filename: `${resource.title}.pdf`,
      token: downloadToken,
      expiresIn: 300
    });
  } catch (error) {
    console.error('Error creating download URL:', error);
    res.status(500).json({ error: 'Failed to create download URL' });
  }
});

// Secure file download with token verification
router.get('/secure/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Verify download token
    const { verifyDownloadToken } = await import('../lib/download');
    const payload = verifyDownloadToken(token);
    
    if (!payload) {
      return res.status(401).json({ error: 'Invalid or expired download token' });
    }

    // Double-check access
    const canDownload = await canDownloadResource(payload.userId, payload.productId);
    if (!canDownload) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get fresh signed URL
    const { data: resource } = await supabase
      .from('resources')
      .select('storage_path_original, title')
      .eq('id', payload.productId)
      .single();

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    const { data, error } = await supabase.storage
      .from('resources-original')
      .createSignedUrl(resource.storage_path_original, 60); // 1 minute for actual download

    if (error) {
      throw error;
    }

    // Redirect to file
    res.redirect(data.signedUrl);
  } catch (error) {
    console.error('Error in secure download:', error);
    res.status(500).json({ error: 'Download failed' });
  }
});

export default router;