// routes/customers.js
const express = require('express');
const router = express.Router();
const db = require('./db'); // Your database connection

// Get all groups with their units
router.get('/api/groups', async (req, res) => {
  try {
    const query = `
      SELECT 
        g.groupe_id,
        g.groupe_name,
        g."Description",
        u.unit_id,
        u.unit_name,
        u.city,
        u.country,
        u.zone_name,
        p."Person_id",
        p.first_name,
        p.last_name,
        p.job_title,
        p.email,
        p.phone_number,
        p.role
      FROM groupe g
      LEFT JOIN unit u ON g.groupe_id = u.groupe_id
      LEFT JOIN "Person" p ON u.com_person_id = p."Person_id"
      ORDER BY g.groupe_name, u.unit_name
    `;
    
    const result = await db.query(query);
    
    // Group data by group
    const groups = {};
    result.rows.forEach(row => {
      if (!groups[row.groupe_id]) {
        groups[row.groupe_id] = {
          groupe_id: row.groupe_id,
          groupe_name: row.groupe_name,
          Description: row.Description,
          units: []
        };
      }
      
      if (row.unit_id) {
        groups[row.groupe_id].units.push({
          unit_id: row.unit_id,
          unit_name: row.unit_name,
          city: row.city,
          country: row.country,
          zone_name: row.zone_name,
          responsible: row.Person_id ? {
            Person_id: row.Person_id,
            first_name: row.first_name,
            last_name: row.last_name,
            job_title: row.job_title,
            email: row.email,
            phone_number: row.phone_number,
            role: row.role
          } : null
        });
      }
    });
    
    res.json(Object.values(groups));
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get unit details by ID
router.get('/api/units/:id', async (req, res) => {
  try {
    const query = `
      SELECT 
        u.*,
        g.groupe_name,
        p."Person_id",
        p.first_name,
        p.last_name,
        p.job_title,
        p.email,
        p.phone_number,
        p.role,
        p.zone_name as person_zone_name
      FROM unit u
      LEFT JOIN groupe g ON u.groupe_id = g.groupe_id
      LEFT JOIN "Person" p ON u.com_person_id = p."Person_id"
      WHERE u.unit_id = $1
    `;
    
    const result = await db.query(query, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Unit not found' });
    }
    
    const unit = result.rows[0];
    const unitDetails = {
      unit_id: unit.unit_id,
      unit_name: unit.unit_name,
      groupe_name: unit.groupe_name,
      city: unit.city,
      country: unit.country,
      zone_name: unit.zone_name,
      responsible: unit.Person_id ? {
        Person_id: unit.Person_id,
        first_name: unit.first_name,
        last_name: unit.last_name,
        job_title: unit.job_title,
        email: unit.email,
        phone_number: unit.phone_number,
        role: unit.role,
        zone_name: unit.person_zone_name
      } : null
    };
    
    res.json(unitDetails);
  } catch (error) {
    console.error('Error fetching unit details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;