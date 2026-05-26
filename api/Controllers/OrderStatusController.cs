using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using NorthwindApi.Services;

namespace NorthwindApi.Controllers;

[ApiController]
[Route("api/order-status")]
public class OrderStatusController(SqlConnectionFactory db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        await using var conn = await db.CreateAsync();
        await using var cmd = new SqlCommand("SELECT * FROM [OrderStatus] ORDER BY [SortOrder]", conn);
        await using var reader = await cmd.ExecuteReaderAsync();
        return Ok(await SqlHelper.ReadRowsAsync(reader));
    }
}
