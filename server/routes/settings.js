const express = require('express');
const router = express.Router();
const { getPool } = require('../db');

router.get('/', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT * FROM [SystemSettings]');
    // Return as a key/value map for convenience
    const settings = {};
    for (const row of result.recordset) {
      settings[row.SettingName] = row.SettingValue;
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
