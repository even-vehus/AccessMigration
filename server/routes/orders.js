const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../db');

router.get('/', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT o.*,
        c.[CustomerName],
        e.[FirstName] + ' ' + e.[LastName] AS EmployeeName,
        s.[StatusName]
      FROM [Orders] o
      LEFT JOIN [Customers] c ON o.[CustomerID] = c.[CustomerID]
      LEFT JOIN [Employees] e ON o.[EmployeeID] = e.[EmployeeID]
      LEFT JOIN [OrderStatus] s ON o.[StatusID] = s.[StatusID]
      ORDER BY o.[OrderDate] DESC`);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const pool = await getPool();
    const order = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`SELECT o.*,
        c.[CustomerName],
        e.[FirstName] + ' ' + e.[LastName] AS EmployeeName,
        s.[StatusName]
        FROM [Orders] o
        LEFT JOIN [Customers] c ON o.[CustomerID] = c.[CustomerID]
        LEFT JOIN [Employees] e ON o.[EmployeeID] = e.[EmployeeID]
        LEFT JOIN [OrderStatus] s ON o.[StatusID] = s.[StatusID]
        WHERE o.[OrderID]=@id`);
    if (!order.recordset.length) return res.status(404).json({ error: 'Not found' });

    const details = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`SELECT od.*, p.[ProductName], p.[ProductCode]
        FROM [OrderDetails] od
        LEFT JOIN [Products] p ON od.[ProductID] = p.[ProductID]
        WHERE od.[OrderID]=@id`);

    res.json({ ...order.recordset[0], details: details.recordset });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { EmployeeID, CustomerID, OrderDate, ShippedDate, PaidDate, Notes, StatusID, details } = req.body;
  try {
    const pool = await getPool();
    const orderResult = await pool.request()
      .input('EmployeeID', sql.Int, EmployeeID)
      .input('CustomerID', sql.Int, CustomerID)
      .input('OrderDate', sql.DateTime2, OrderDate)
      .input('ShippedDate', sql.DateTime2, ShippedDate)
      .input('PaidDate', sql.DateTime2, PaidDate)
      .input('Notes', sql.NVarChar(sql.MAX), Notes)
      .input('StatusID', sql.Int, StatusID)
      .query(`INSERT INTO [Orders] ([EmployeeID],[CustomerID],[OrderDate],[ShippedDate],[PaidDate],[Notes],[StatusID],[AddedBy],[AddedOn],[ModifiedBy],[ModifiedOn])
        OUTPUT INSERTED.[OrderID]
        VALUES (@EmployeeID,@CustomerID,@OrderDate,@ShippedDate,@PaidDate,@Notes,@StatusID,'App',GETDATE(),'App',GETDATE())`);
    const orderID = orderResult.recordset[0].OrderID;

    if (details && details.length) {
      for (const d of details) {
        await pool.request()
          .input('OrderID', sql.Int, orderID)
          .input('ProductID', sql.Int, d.ProductID)
          .input('Quantity', sql.Int, d.Quantity)
          .input('UnitPrice', sql.Decimal(19, 4), d.UnitPrice)
          .query(`INSERT INTO [OrderDetails] ([OrderID],[ProductID],[Quantity],[UnitPrice],[AddedBy],[AddedOn],[ModifiedBy],[ModifiedOn])
            VALUES (@OrderID,@ProductID,@Quantity,@UnitPrice,'App',GETDATE(),'App',GETDATE())`);
      }
    }
    res.status(201).json({ OrderID: orderID });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { EmployeeID, CustomerID, OrderDate, ShippedDate, PaidDate, Notes, StatusID, details } = req.body;
  try {
    const pool = await getPool();
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('EmployeeID', sql.Int, EmployeeID)
      .input('CustomerID', sql.Int, CustomerID)
      .input('OrderDate', sql.DateTime2, OrderDate)
      .input('ShippedDate', sql.DateTime2, ShippedDate)
      .input('PaidDate', sql.DateTime2, PaidDate)
      .input('Notes', sql.NVarChar(sql.MAX), Notes)
      .input('StatusID', sql.Int, StatusID)
      .query(`UPDATE [Orders] SET [EmployeeID]=@EmployeeID,[CustomerID]=@CustomerID,
        [OrderDate]=@OrderDate,[ShippedDate]=@ShippedDate,[PaidDate]=@PaidDate,
        [Notes]=@Notes,[StatusID]=@StatusID,[ModifiedBy]='App',[ModifiedOn]=GETDATE()
        WHERE [OrderID]=@id`);

    // Replace order lines
    if (details !== undefined) {
      await pool.request()
        .input('id', sql.Int, req.params.id)
        .query('DELETE FROM [OrderDetails] WHERE [OrderID]=@id');
      for (const d of details) {
        await pool.request()
          .input('OrderID', sql.Int, req.params.id)
          .input('ProductID', sql.Int, d.ProductID)
          .input('Quantity', sql.Int, d.Quantity)
          .input('UnitPrice', sql.Decimal(19, 4), d.UnitPrice)
          .query(`INSERT INTO [OrderDetails] ([OrderID],[ProductID],[Quantity],[UnitPrice],[AddedBy],[AddedOn],[ModifiedBy],[ModifiedOn])
            VALUES (@OrderID,@ProductID,@Quantity,@UnitPrice,'App',GETDATE(),'App',GETDATE())`);
      }
    }
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
      .query('DELETE FROM [OrderDetails] WHERE [OrderID]=@id');
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('DELETE FROM [Orders] WHERE [OrderID]=@id');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
