const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../db');

router.get('/', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT * FROM [Products] ORDER BY [ProductName]');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT * FROM [Products] WHERE [ProductID]=@id');
    if (!result.recordset.length) return res.status(404).json({ error: 'Not found' });
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { ProductCode, ProductName, ProductDescription, UnitPrice } = req.body;
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('ProductCode', sql.NVarChar(20), ProductCode)
      .input('ProductName', sql.NVarChar(50), ProductName)
      .input('ProductDescription', sql.NVarChar(sql.MAX), ProductDescription)
      .input('UnitPrice', sql.Decimal(19, 4), UnitPrice)
      .query(`INSERT INTO [Products] ([ProductCode],[ProductName],[ProductDescription],[UnitPrice],[AddedBy],[AddedOn],[ModifiedBy],[ModifiedOn])
        OUTPUT INSERTED.[ProductID]
        VALUES (@ProductCode,@ProductName,@ProductDescription,@UnitPrice,'App',GETDATE(),'App',GETDATE())`);
    res.status(201).json({ ProductID: result.recordset[0].ProductID });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { ProductCode, ProductName, ProductDescription, UnitPrice } = req.body;
  try {
    const pool = await getPool();
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('ProductCode', sql.NVarChar(20), ProductCode)
      .input('ProductName', sql.NVarChar(50), ProductName)
      .input('ProductDescription', sql.NVarChar(sql.MAX), ProductDescription)
      .input('UnitPrice', sql.Decimal(19, 4), UnitPrice)
      .query(`UPDATE [Products] SET [ProductCode]=@ProductCode,[ProductName]=@ProductName,
        [ProductDescription]=@ProductDescription,[UnitPrice]=@UnitPrice,
        [ModifiedBy]='App',[ModifiedOn]=GETDATE() WHERE [ProductID]=@id`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('DELETE FROM [Products] WHERE [ProductID]=@id');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
