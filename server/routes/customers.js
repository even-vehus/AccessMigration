const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../db');

// GET all customers
router.get('/', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT * FROM [Customers] ORDER BY [CustomerName]');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single customer
router.get('/:id', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT * FROM [Customers] WHERE [CustomerID] = @id');
    if (!result.recordset.length) return res.status(404).json({ error: 'Not found' });
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create customer
router.post('/', async (req, res) => {
  const { CustomerName, PrimaryContactLastName, PrimaryContactFirstName, PrimaryContactJobTitle,
    PrimaryContactEmailAddress, BusinessPhone, Address, City, State, Zip, Website, Notes } = req.body;
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('CustomerName', sql.NVarChar(50), CustomerName)
      .input('PrimaryContactLastName', sql.NVarChar(30), PrimaryContactLastName)
      .input('PrimaryContactFirstName', sql.NVarChar(20), PrimaryContactFirstName)
      .input('PrimaryContactJobTitle', sql.NVarChar(50), PrimaryContactJobTitle)
      .input('PrimaryContactEmailAddress', sql.NVarChar(255), PrimaryContactEmailAddress)
      .input('BusinessPhone', sql.NVarChar(20), BusinessPhone)
      .input('Address', sql.NVarChar(255), Address)
      .input('City', sql.NVarChar(255), City)
      .input('State', sql.NVarChar(2), State)
      .input('Zip', sql.NVarChar(10), Zip)
      .input('Website', sql.NVarChar(sql.MAX), Website)
      .input('Notes', sql.NVarChar(sql.MAX), Notes)
      .query(`INSERT INTO [Customers]
        ([CustomerName],[PrimaryContactLastName],[PrimaryContactFirstName],[PrimaryContactJobTitle],
         [PrimaryContactEmailAddress],[BusinessPhone],[Address],[City],[State],[Zip],[Website],[Notes],
         [AddedBy],[AddedOn],[ModifiedBy],[ModifiedOn])
        OUTPUT INSERTED.[CustomerID]
        VALUES (@CustomerName,@PrimaryContactLastName,@PrimaryContactFirstName,@PrimaryContactJobTitle,
         @PrimaryContactEmailAddress,@BusinessPhone,@Address,@City,@State,@Zip,@Website,@Notes,
         'App',GETDATE(),'App',GETDATE())`);
    res.status(201).json({ CustomerID: result.recordset[0].CustomerID });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update customer
router.put('/:id', async (req, res) => {
  const { CustomerName, PrimaryContactLastName, PrimaryContactFirstName, PrimaryContactJobTitle,
    PrimaryContactEmailAddress, BusinessPhone, Address, City, State, Zip, Website, Notes } = req.body;
  try {
    const pool = await getPool();
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('CustomerName', sql.NVarChar(50), CustomerName)
      .input('PrimaryContactLastName', sql.NVarChar(30), PrimaryContactLastName)
      .input('PrimaryContactFirstName', sql.NVarChar(20), PrimaryContactFirstName)
      .input('PrimaryContactJobTitle', sql.NVarChar(50), PrimaryContactJobTitle)
      .input('PrimaryContactEmailAddress', sql.NVarChar(255), PrimaryContactEmailAddress)
      .input('BusinessPhone', sql.NVarChar(20), BusinessPhone)
      .input('Address', sql.NVarChar(255), Address)
      .input('City', sql.NVarChar(255), City)
      .input('State', sql.NVarChar(2), State)
      .input('Zip', sql.NVarChar(10), Zip)
      .input('Website', sql.NVarChar(sql.MAX), Website)
      .input('Notes', sql.NVarChar(sql.MAX), Notes)
      .query(`UPDATE [Customers] SET
        [CustomerName]=@CustomerName,[PrimaryContactLastName]=@PrimaryContactLastName,
        [PrimaryContactFirstName]=@PrimaryContactFirstName,[PrimaryContactJobTitle]=@PrimaryContactJobTitle,
        [PrimaryContactEmailAddress]=@PrimaryContactEmailAddress,[BusinessPhone]=@BusinessPhone,
        [Address]=@Address,[City]=@City,[State]=@State,[Zip]=@Zip,[Website]=@Website,[Notes]=@Notes,
        [ModifiedBy]='App',[ModifiedOn]=GETDATE()
        WHERE [CustomerID]=@id`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE customer
router.delete('/:id', async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('DELETE FROM [Customers] WHERE [CustomerID]=@id');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
