using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using NorthwindApi.Services;

namespace NorthwindApi.Controllers;

[ApiController]
[Route("api/settings")]
public class SettingsController(SqlConnectionFactory db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        await using var conn = await db.CreateAsync();
        await using var cmd = new SqlCommand("SELECT * FROM [SystemSettings]", conn);
        await using var reader = await cmd.ExecuteReaderAsync();
        var settings = new Dictionary<string, string?>();
        while (await reader.ReadAsync())
        {
            var key = reader["SettingName"]?.ToString();
            var value = reader.IsDBNull(reader.GetOrdinal("SettingValue"))
                ? null
                : reader["SettingValue"]?.ToString();
            if (key is not null)
                settings[key] = value;
        }
        return Ok(settings);
    }
}
