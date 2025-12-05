// Simplified Resources API

import { Router } from 'express';
import { query } from '../lib/db';

const router = Router();

// List all active resources
router.get('/', async (req, res) => {
  try {
    const { sport, level, category, search, limit = 50, offset = 0 } = req.query;

    let sql = `
      SELECT r.*, p.first_name, p.last_name, p.title as coach_title
      FROM resources r
      LEFT JOIN profiles p ON r.owner_id = p.id
      WHERE r.status = 'active' AND r.is_listed = true
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (sport) {
      params.push(sport);
      sql += ` AND $${paramIndex} = ANY(r.sports)`;
      paramIndex++;
    }

    if (level) {
      params.push(level);
      sql += ` AND $${paramIndex} = ANY(r.levels)`;
      paramIndex++;
    }

    if (category) {
      params.push(category);
      sql += ` AND r.category = $${paramIndex}`;
      paramIndex++;
    }

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (r.title ILIKE $${paramIndex} OR r.description ILIKE $${paramIndex})`;
      paramIndex++;
    }

    sql += ` ORDER BY r.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await query(sql, params);
    res.json({ data: result.rows, error: null });
  } catch (error: any) {
    console.error('Error listing resources:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single resource
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT r.*, p.first_name, p.last_name, p.title as coach_title, p.bio as coach_bio
      FROM resources r
      LEFT JOIN profiles p ON r.owner_id = p.id
      WHERE r.id = $1 AND r.status = 'active'
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    res.json({ data: result.rows[0], error: null });
  } catch (error: any) {
    console.error('Error fetching resource:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create resource (simplified)
router.post('/', async (req, res) => {
  try {
    const { coach_id, title, description, price, sports, levels, category, file_url } = req.body;

    if (!coach_id || !title || !description || price === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await query(`
      INSERT INTO resources (coach_id, title, description, price, sports, levels, category, file_url, status, is_listed, downloads, rating)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', true, 0, 0)
      RETURNING *
    `, [coach_id, title, description, price, sports || [], levels || [], category || 'other', file_url || '']);

    res.json({ data: result.rows[0], error: null });
  } catch (error: any) {
    console.error('Error creating resource:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update resource
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map((field, i) => `${field} = $${i + 2}`).join(', ');

    const result = await query(
      `UPDATE resources SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...values]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    res.json({ data: result.rows[0], error: null });
  } catch (error: any) {
    console.error('Error updating resource:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete resource
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await query('DELETE FROM resources WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting resource:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
