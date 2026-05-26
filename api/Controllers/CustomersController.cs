using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using NorthwindApi.Services;

namespace NorthwindApi.Controllers;

[ApiController]
[Route("api/customers")]
public class CustomersController(SqlConnectionFactory db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        await using var conn = await db.CreateAsync();
        await using var cmd = new SqlCommand("SELECT * FROM [Customers] ORDER BY [CustomerName]", conn);
        await using var reader = await cmd.ExecuteReaderAsync();
        return Ok(await SqlHelper.ReadRowsAsync(reader));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetOne(int id)
    {
        await using var conn = await db.CreateAsync();
        await using var cmd = new SqlCommand("SELECT * FROM [Customers] WHERE [CustomerID]=@id", conn);
        cmd.Parameters.AddWithValue("@id", id);
        await using var reader = await cmd.ExecuteReaderAsync();
        var rows = await SqlHelper.ReadRowsAsync(reader);
        if (rows.Count == 0) return NotFound();
        return Ok(rows[0]);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CustomerRequest body)
    {
        await using var conn = await db.CreateAsync();
        await using var cmd = new SqlCommand(@"
            INSERT INTO [Customers]
              ([CustomerName],[PrimaryContactLastName],[PrimaryContactFirstName],[PrimaryContactJobTitle],
               [PrimaryContactEmailAddress],[BusinessPhone],[Address],[City],[State],[Zip],[Website],[Notes],
               [AddedBy],[AddedOn],[ModifiedBy],[ModifiedOn])
            OUTPUT INSERTED.[CustomerID]
            VALUES (@CustomerName,@PrimaryContactLastName,@PrimaryContactFirstName,@PrimaryContactJobTitle,
               @PrimaryContactEmailAddress,@BusinessPhone,@Address,@City,@State,@Zip,@Website,@Notes,
               'App',GETDATE(),'App',GETDATE())", conn);
        AddParams(cmd, body);
        var newId = await cmd.ExecuteScalarAsync();
        return StatusCode(201, new { CustomerID = newId });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] CustomerRequest body)
    {
        await using var conn = await db.CreateAsync();
        await using var cmd = new SqlCommand(@"
            UPDATE [Customers] SET
              [CustomerName]=@CustomerName,[PrimaryContactLastName]=@PrimaryContactLastName,
              [PrimaryContactFirstName]=@PrimaryContactFirstName,[PrimaryContactJobTitle]=@PrimaryContactJobTitle,
              [PrimaryContactEmailAddress]=@PrimaryContactEmailAddress,[BusinessPhone]=@BusinessPhone,
              [Address]=@Address,[City]=@City,[State]=@State,[Zip]=@Zip,[Website]=@Website,[Notes]=@Notes,
              [ModifiedBy]='App',[ModifiedOn]=GETDATE()
            WHERE [CustomerID]=@id", conn);
        cmd.Parameters.AddWithValue("@id", id);
        AddParams(cmd, body);
        await cmd.ExecuteNonQueryAsync();
        return Ok(new { success = true });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await using var conn = await db.CreateAsync();
        await using var cmd = new SqlCommand("DELETE FROM [Customers] WHERE [CustomerID]=@id", conn);
        cmd.Parameters.AddWithValue("@id", id);
        await cmd.ExecuteNonQueryAsync();
        return Ok(new { success = true });
    }

    private static void AddParams(SqlCommand cmd, CustomerRequest body)
    {
        cmd.Parameters.AddParam("@CustomerName", body.CustomerName);
        cmd.Parameters.AddParam("@PrimaryContactLastName", body.PrimaryContactLastName);
        cmd.Parameters.AddParam("@PrimaryContactFirstName", body.PrimaryContactFirstName);
        cmd.Parameters.AddParam("@PrimaryContactJobTitle", body.PrimaryContactJobTitle);
        cmd.Parameters.AddParam("@PrimaryContactEmailAddress", body.PrimaryContactEmailAddress);
        cmd.Parameters.AddParam("@BusinessPhone", body.BusinessPhone);
        cmd.Parameters.AddParam("@Address", body.Address);
        cmd.Parameters.AddParam("@City", body.City);
        cmd.Parameters.AddParam("@State", body.State);
        cmd.Parameters.AddParam("@Zip", body.Zip);
        cmd.Parameters.AddParam("@Website", body.Website);
        cmd.Parameters.AddParam("@Notes", body.Notes);
    }
}

public record CustomerRequest(
    string? CustomerName, string? PrimaryContactLastName, string? PrimaryContactFirstName,
    string? PrimaryContactJobTitle, string? PrimaryContactEmailAddress, string? BusinessPhone,
    string? Address, string? City, string? State, string? Zip, string? Website, string? Notes);
