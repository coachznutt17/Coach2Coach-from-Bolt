// SEO management API routes
import { Router } from 'express';
import { supabase } from '../lib/supabase';

const router = Router();

// Generate sitemap.xml
router.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://coach2coachnetwork.com';
    
    // Get static pages
    const { data: seoPages } = await supabase
      .from('seo_pages')
      .select('path, last_modified, priority, change_frequency');

    // Get dynamic resource pages
    const { data: resources } = await supabase
      .from('resources')
      .select('id, updated_at')
      .eq('status', 'active')
      .eq('is_listed', true);

    // Get coach profiles
    const { data: coaches } = await supabase
      .from('profiles')
      .select('id, updated_at')
      .eq('is_verified_coach', true);

    // Build sitemap URLs
    const urls: string[] = [];

    // Static pages
    (seoPages || []).forEach(page => {
      urls.push(`
  <url>
    <loc>${baseUrl}${page.path}</loc>
    <lastmod>${page.last_modified || new Date().toISOString()}</lastmod>
    <changefreq>${page.change_frequency || 'weekly'}</changefreq>
    <priority>${page.priority || 0.5}</priority>
  </url>`);
    });

    // Resource pages
    (resources || []).forEach(resource => {
      urls.push(`
  <url>
    <loc>${baseUrl}/resource/${resource.id}</loc>
    <lastmod>${resource.updated_at}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`);
    });

    // Coach profile pages
    (coaches || []).forEach(coach => {
      urls.push(`
  <url>
    <loc>${baseUrl}/coach/${coach.id}</loc>
    <lastmod>${coach.updated_at}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`);
    });

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('')}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml');
    res.send(sitemap);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).json({ error: 'Failed to generate sitemap' });
  }
});

// Generate robots.txt
router.get('/robots.txt', (req, res) => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://coach2coachnetwork.com';
  
  const robots = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /account/
Disallow: /messages/
Disallow: /upload/
Disallow: /moderation/

Sitemap: ${baseUrl}/api/seo/sitemap.xml`;

  res.setHeader('Content-Type', 'text/plain');
  res.send(robots);
});

// Get page SEO data
router.get('/page', async (req, res) => {
  try {
    const { path } = req.query;

    if (!path) {
      return res.status(400).json({ error: 'Path required' });
    }

    const { data: seoData, error } = await supabase
      .from('seo_pages')
      .select('*')
      .eq('path', path)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    res.json({ success: true, seo: seoData });
  } catch (error) {
    console.error('Error getting page SEO:', error);
    res.status(500).json({ error: 'Failed to get page SEO' });
  }
});

// Update page SEO (admin only)
router.put('/page', async (req, res) => {
  try {
    const { userId, path, title, description, keywords, canonical, robots } = req.body;

    // Verify admin access
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (!profile || profile.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { error } = await supabase
      .from('seo_pages')
      .upsert({
        path,
        title,
        description,
        keywords: keywords || [],
        canonical_url: canonical,
        robots: robots || 'index,follow',
        last_modified: new Date().toISOString()
      });

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating page SEO:', error);
    res.status(500).json({ error: 'Failed to update page SEO' });
  }
});

export default router;