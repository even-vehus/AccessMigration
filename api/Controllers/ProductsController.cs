using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using NorthwindApi.Services;

namespace NorthwindApi.Controllers;

[ApiController]
[Route("api/products")]
public class ProductsController(SqlConnectionFactory db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        await using var conn = await db.CreateAsync();
        await using var cmd = new SqlCommand("SELECT * FROM [Products] ORDER BY [ProductName]", conn);
        await using var reader = await cmd.ExecuteReaderAsync();
        return Ok(await SqlHelper.ReadRowsAsync(reader));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetOne(int id)
    {
        await using var conn = await db.CreateAsync();
        await using var cmd = new SqlCommand("SELECT * FROM [Products] WHERE [ProductID]=@id", conn);
        cmd.Parameters.AddWithValue("@id", id);
        await using var reader = await cmd.ExecuteReaderAsync();
        var rows = await SqlHelper.ReadRowsAsync(reader);
        if (rows.Count == 0) return NotFound();
        return Ok(rows[0]);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ProductRequest body)
    {
        await using var conn = await db.CreateAsync();
        await using var cmd = new SqlCommand(@"
            INSERT INTO [Products]
              ([ProductCode],[ProductName],[ProductDescription],[UnitPrice],[AddedBy],[AddedOn],[ModifiedBy],[ModifiedOn])
            OUTPUT INSERTED.[ProductID]
            VALUES (@ProductCode,@ProductName,@ProductDescription,@UnitPrice,'App',GETDATE(),'App',GETDATE())", conn);
        cmd.Parameters.AddParam("@ProductCode", body.ProductCode);
        cmd.Parameters.AddParam("@ProductName", body.ProductName);
        cmd.Parameters.AddParam("@ProductDescription", body.ProductDescription);
        cmd.Parameters.AddParam("@UnitPrice", body.UnitPrice);
        var newId = await cmd.ExecuteScalarAsync();
        return StatusCode(201, new { ProductID = newId });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] ProductRequest body)
    {
        await using var conn = await db.CreateAsync();
        await using var cmd = new SqlCommand(@"
            UPDATE [Products] SET
              [ProductCode]=@ProductCode,[ProductName]=@ProductName,
              [ProductDescription]=@ProductDescription,[UnitPrice]=@UnitPrice,
              [ModifiedBy]='App',[ModifiedOn]=GETDATE()
            WHERE [ProductID]=@id", conn);
        cmd.Parameters.AddWithValue("@id", id);
        cmd.Parameters.AddParam("@ProductCode", body.ProductCode);
        cmd.Parameters.AddParam("@ProductName", body.ProductName);
        cmd.Parameters.AddParam("@ProductDescription", body.ProductDescription);
        cmd.Parameters.AddParam("@UnitPrice", body.UnitPrice);
        await cmd.ExecuteNonQueryAsync();
        return Ok(new { success = true });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await using var conn = await db.CreateAsync();
        await using var cmd = new SqlCommand("DELETE FROM [Products] WHERE [ProductID]=@id", conn);
        cmd.Parameters.AddWithValue("@id", id);
        await cmd.ExecuteNonQueryAsync();
        return Ok(new { success = true });
    }
}

public record ProductRequest(string? ProductCode, string? ProductName, string? ProductDescription, decimal? UnitPrice);
