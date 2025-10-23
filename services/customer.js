// routes/customers.js
const express = require('express');
const router = express.Router();
const db = require('./db');

// Get all groups with their units (existing)
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

// Get unit details by ID (existing)
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

// 🆕 Create new group
router.post('/api/groups', async (req, res) => {
  try {
    const { groupe_name, Description } = req.body;
    
    if (!groupe_name) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    const query = `
      INSERT INTO groupe (groupe_name, "Description")
      VALUES ($1, $2)
      RETURNING *
    `;
    
    const result = await db.query(query, [groupe_name, Description || null]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 🆕 Update group
router.put('/api/groups/:id', async (req, res) => {
  try {
    const { groupe_name, Description } = req.body;
    const { id } = req.params;

    if (!groupe_name) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    const query = `
      UPDATE groupe
      SET groupe_name = $1, "Description" = $2
      WHERE groupe_id = $3
      RETURNING *
    `;
    
    const result = await db.query(query, [groupe_name, Description || null, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating group:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 🆕 Delete group
router.delete('/api/groups/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ First, delete all units related to the group
    await db.query('DELETE FROM unit WHERE groupe_id = $1', [id]);

    // ✅ Then delete the group itself
    const deleteGroup = await db.query(
      'DELETE FROM groupe WHERE groupe_id = $1 RETURNING *',
      [id]
    );

    if (deleteGroup.rows.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }

    res.json({
      message: 'Group and associated units deleted successfully',
      deletedGroup: deleteGroup.rows[0]
    });
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Add this to your backend routes/customers.js

// 🆕 Get persons by email domain
router.get('/api/persons/by-domain', async (req, res) => {
  try {
    const { domain } = req.query;
    
    if (!domain) {
      return res.status(400).json({ error: 'Domain parameter is required' });
    }

    const query = `
      SELECT 
        "Person_id",
        first_name,
        last_name,
        job_title,
        email,
        phone_number,
        role,
        zone_name
      FROM "Person" 
      WHERE email LIKE $1
      ORDER BY first_name, last_name
    `;
    
    const result = await db.query(query, [`%@${domain}`]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching persons by domain:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 🆕 Get person by ID
router.get('/api/persons/:id', async (req, res) => {
  try {
    const query = `
      SELECT 
        "Person_id",
        first_name,
        last_name,
        job_title,
        email,
        phone_number,
        role,
        zone_name
      FROM "Person" 
      WHERE "Person_id" = $1
    `;
    
    const result = await db.query(query, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Person not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching person:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Keep your existing endpoint, no changes needed
router.get('/api/persons/by-domain', async (req, res) => {
  try {
    const { domain } = req.query;
    
    if (!domain) {
      return res.status(400).json({ error: 'Domain parameter is required' });
    }

    const query = `
      SELECT 
        "Person_id",
        first_name,
        last_name,
        job_title,
        email,
        phone_number,
        role,
        zone_name
      FROM "Person" 
      WHERE email LIKE $1
      ORDER BY first_name, last_name
    `;
    
    const result = await db.query(query, [`%@${domain}`]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching persons by domain:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 🆕 Create new unit
router.post('/api/units', async (req, res) => {
  try {
    const { groupe_id, unit_name, city, country, com_person_id, zone_name } = req.body;
    
    if (!groupe_id || !unit_name) {
      return res.status(400).json({ error: 'Group ID and unit name are required' });
    }

    const query = `
      INSERT INTO unit (groupe_id, unit_name, city, country, com_person_id, zone_name)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const result = await db.query(query, [
      groupe_id, 
      unit_name, 
      city || null, 
      country || null, 
      com_person_id || null, 
      zone_name || null
    ]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating unit:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 🆕 Get complete customer data (group with units and responsible persons)
router.get('/api/groups/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get group info
    const groupQuery = `
      SELECT groupe_id, groupe_name, "Description"
      FROM groupe
      WHERE groupe_id = $1
    `;
    const groupResult = await db.query(groupQuery, [id]);
    
    if (groupResult.rows.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    const group = groupResult.rows[0];
    
    // Get units with responsible persons
    const unitsQuery = `
      SELECT 
        u.unit_id,
        u.unit_name,
        u.city,
        u.country,
        u.zone_name,
        u.com_person_id,
        p."Person_id",
        p.first_name,
        p.last_name,
        p.job_title,
        p.email,
        p.phone_number,
        p.role,
        p.zone_name as person_zone_name
      FROM unit u
      LEFT JOIN "Person" p ON u.com_person_id = p."Person_id"
      WHERE u.groupe_id = $1
      ORDER BY u.unit_name
    `;
    const unitsResult = await db.query(unitsQuery, [id]);
    
    const units = unitsResult.rows.map(row => ({
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
        role: row.role,
        zone_name: row.person_zone_name
      } : null
    }));
    
    res.json({
      groupe_id: group.groupe_id,
      groupe_name: group.groupe_name,
      Description: group.Description,
      units: units
    });
  } catch (error) {
    console.error('Error fetching complete customer data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 🆕 Update unit
router.put('/api/units/:id', async (req, res) => {
  try {
    const { unit_name, city, country, zone_name, com_person_id, groupe_id } = req.body;
    const { id } = req.params;

    if (!unit_name) {
      return res.status(400).json({ error: 'Unit name is required' });
    }

    const query = `
      UPDATE unit
      SET unit_name = $1, 
          city = $2, 
          country = $3, 
          zone_name = $4, 
          com_person_id = $5,
          groupe_id = $6
      WHERE unit_id = $7
      RETURNING *
    `;
    
    const result = await db.query(query, [
      unit_name, 
      city || null, 
      country || null, 
      zone_name || null, 
      com_person_id || null,
      groupe_id,
      id
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Unit not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating unit:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
