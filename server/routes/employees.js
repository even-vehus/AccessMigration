const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../db');

router.get('/', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT * FROM [Employees] ORDER BY [LastName],[FirstName]');
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
      .query('SELECT * FROM [Employees] WHERE [EmployeeID]=@id');
    if (!result.recordset.length) return res.status(404).json({ error: 'Not found' });
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { FirstName, LastName, EmailAddress, JobTitle, PrimaryPhone, SecondaryPhone, Title, Notes } = req.body;
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('FirstName', sql.NVarChar(20), FirstName)
      .input('LastName', sql.NVarChar(30), LastName)
      .input('EmailAddress', sql.NVarChar(255), EmailAddress)
      .input('JobTitle', sql.NVarChar(50), JobTitle)
      .input('PrimaryPhone', sql.NVarChar(20), PrimaryPhone)
      .input('SecondaryPhone', sql.NVarChar(20), SecondaryPhone)
      .input('Title', sql.NVarChar(20), Title)
      .input('Notes', sql.NVarChar(sql.MAX), Notes)
      .query(`INSERT INTO [Employees] ([FirstName],[LastName],[EmailAddress],[JobTitle],[PrimaryPhone],[SecondaryPhone],[Title],[Notes],[AddedBy],[AddedOn],[ModifiedBy],[ModifiedOn])
        OUTPUT INSERTED.[EmployeeID]
        VALUES (@FirstName,@LastName,@EmailAddress,@JobTitle,@PrimaryPhone,@SecondaryPhone,@Title,@Notes,'App',GETDATE(),'App',GETDATE())`);
    res.status(201).json({ EmployeeID: result.recordset[0].EmployeeID });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { FirstName, LastName, EmailAddress, JobTitle, PrimaryPhone, SecondaryPhone, Title, Notes } = req.body;
  try {
    const pool = await getPool();
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('FirstName', sql.NVarChar(20), FirstName)
      .input('LastName', sql.NVarChar(30), LastName)
      .input('EmailAddress', sql.NVarChar(255), EmailAddress)
      .input('JobTitle', sql.NVarChar(50), JobTitle)
      .input('PrimaryPhone', sql.NVarChar(20), PrimaryPhone)
      .input('SecondaryPhone', sql.NVarChar(20), SecondaryPhone)
      .input('Title', sql.NVarChar(20), Title)
      .input('Notes', sql.NVarChar(sql.MAX), Notes)
      .query(`UPDATE [Employees] SET [FirstName]=@FirstName,[LastName]=@LastName,[EmailAddress]=@EmailAddress,
        [JobTitle]=@JobTitle,[PrimaryPhone]=@PrimaryPhone,[SecondaryPhone]=@SecondaryPhone,
        [Title]=@Title,[Notes]=@Notes,[ModifiedBy]='App',[ModifiedOn]=GETDATE()
        WHERE [EmployeeID]=@id`);
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
      .query('DELETE FROM [Employees] WHERE [EmployeeID]=@id');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
