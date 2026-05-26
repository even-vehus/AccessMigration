using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using NorthwindApi.Services;

namespace NorthwindApi.Controllers;

[ApiController]
[Route("api/employees")]
public class EmployeesController(SqlConnectionFactory db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        await using var conn = await db.CreateAsync();
        await using var cmd = new SqlCommand("SELECT * FROM [Employees] ORDER BY [LastName],[FirstName]", conn);
        await using var reader = await cmd.ExecuteReaderAsync();
        return Ok(await SqlHelper.ReadRowsAsync(reader));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetOne(int id)
    {
        await using var conn = await db.CreateAsync();
        await using var cmd = new SqlCommand("SELECT * FROM [Employees] WHERE [EmployeeID]=@id", conn);
        cmd.Parameters.AddWithValue("@id", id);
        await using var reader = await cmd.ExecuteReaderAsync();
        var rows = await SqlHelper.ReadRowsAsync(reader);
        if (rows.Count == 0) return NotFound();
        return Ok(rows[0]);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] EmployeeRequest body)
    {
        await using var conn = await db.CreateAsync();
        await using var cmd = new SqlCommand(@"
            INSERT INTO [Employees]
              ([FirstName],[LastName],[EmailAddress],[JobTitle],[PrimaryPhone],[SecondaryPhone],[Title],[Notes],
               [AddedBy],[AddedOn],[ModifiedBy],[ModifiedOn])
            OUTPUT INSERTED.[EmployeeID]
            VALUES (@FirstName,@LastName,@EmailAddress,@JobTitle,@PrimaryPhone,@SecondaryPhone,@Title,@Notes,
               'App',GETDATE(),'App',GETDATE())", conn);
        AddParams(cmd, body);
        var newId = await cmd.ExecuteScalarAsync();
        return StatusCode(201, new { EmployeeID = newId });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] EmployeeRequest body)
    {
        await using var conn = await db.CreateAsync();
        await using var cmd = new SqlCommand(@"
            UPDATE [Employees] SET
              [FirstName]=@FirstName,[LastName]=@LastName,[EmailAddress]=@EmailAddress,
              [JobTitle]=@JobTitle,[PrimaryPhone]=@PrimaryPhone,[SecondaryPhone]=@SecondaryPhone,
              [Title]=@Title,[Notes]=@Notes,[ModifiedBy]='App',[ModifiedOn]=GETDATE()
            WHERE [EmployeeID]=@id", conn);
        cmd.Parameters.AddWithValue("@id", id);
        AddParams(cmd, body);
        await cmd.ExecuteNonQueryAsync();
        return Ok(new { success = true });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await using var conn = await db.CreateAsync();
        await using var cmd = new SqlCommand("DELETE FROM [Employees] WHERE [EmployeeID]=@id", conn);
        cmd.Parameters.AddWithValue("@id", id);
        await cmd.ExecuteNonQueryAsync();
        return Ok(new { success = true });
    }

    private static void AddParams(SqlCommand cmd, EmployeeRequest body)
    {
        cmd.Parameters.AddParam("@FirstName", body.FirstName);
        cmd.Parameters.AddParam("@LastName", body.LastName);
        cmd.Parameters.AddParam("@EmailAddress", body.EmailAddress);
        cmd.Parameters.AddParam("@JobTitle", body.JobTitle);
        cmd.Parameters.AddParam("@PrimaryPhone", body.PrimaryPhone);
        cmd.Parameters.AddParam("@SecondaryPhone", body.SecondaryPhone);
        cmd.Parameters.AddParam("@Title", body.Title);
        cmd.Parameters.AddParam("@Notes", body.Notes);
    }
}

public record EmployeeRequest(
    string? FirstName, string? LastName, string? EmailAddress, string? JobTitle,
    string? PrimaryPhone, string? SecondaryPhone, string? Title, string? Notes);
