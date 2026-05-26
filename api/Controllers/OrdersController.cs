using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using NorthwindApi.Services;

namespace NorthwindApi.Controllers;

[ApiController]
[Route("api/orders")]
public class OrdersController(SqlConnectionFactory db) : ControllerBase
{
    private const string OrderSelectSql = @"
        SELECT o.*,
          c.[CustomerName],
          e.[FirstName] + ' ' + e.[LastName] AS EmployeeName,
          s.[StatusName]
        FROM [Orders] o
        LEFT JOIN [Customers] c ON o.[CustomerID] = c.[CustomerID]
        LEFT JOIN [Employees] e ON o.[EmployeeID] = e.[EmployeeID]
        LEFT JOIN [OrderStatus] s ON o.[StatusID] = s.[StatusID]";

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        await using var conn = await db.CreateAsync();
        await using var cmd = new SqlCommand(OrderSelectSql + " ORDER BY o.[OrderDate] DESC", conn);
        await using var reader = await cmd.ExecuteReaderAsync();
        return Ok(await SqlHelper.ReadRowsAsync(reader));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetOne(int id)
    {
        await using var conn = await db.CreateAsync();

        await using var orderCmd = new SqlCommand(OrderSelectSql + " WHERE o.[OrderID]=@id", conn);
        orderCmd.Parameters.AddWithValue("@id", id);
        await using var orderReader = await orderCmd.ExecuteReaderAsync();
        var orders = await SqlHelper.ReadRowsAsync(orderReader);
        if (orders.Count == 0) return NotFound();
        await orderReader.CloseAsync();

        await using var detailCmd = new SqlCommand(@"
            SELECT od.*, p.[ProductName], p.[ProductCode]
            FROM [OrderDetails] od
            LEFT JOIN [Products] p ON od.[ProductID] = p.[ProductID]
            WHERE od.[OrderID]=@id", conn);
        detailCmd.Parameters.AddWithValue("@id", id);
        await using var detailReader = await detailCmd.ExecuteReaderAsync();
        var details = await SqlHelper.ReadRowsAsync(detailReader);

        var result = orders[0];
        result["details"] = details;
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] OrderRequest body)
    {
        await using var conn = await db.CreateAsync();

        await using var orderCmd = new SqlCommand(@"
            INSERT INTO [Orders]
              ([EmployeeID],[CustomerID],[OrderDate],[ShippedDate],[PaidDate],[Notes],[StatusID],
               [AddedBy],[AddedOn],[ModifiedBy],[ModifiedOn])
            OUTPUT INSERTED.[OrderID]
            VALUES (@EmployeeID,@CustomerID,@OrderDate,@ShippedDate,@PaidDate,@Notes,@StatusID,
               'App',GETDATE(),'App',GETDATE())", conn);
        AddOrderParams(orderCmd, body);
        var orderId = (int)(await orderCmd.ExecuteScalarAsync())!;

        if (body.Details is { Count: > 0 })
            await InsertDetails(conn, orderId, body.Details);

        return StatusCode(201, new { OrderID = orderId });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] OrderRequest body)
    {
        await using var conn = await db.CreateAsync();

        await using var updateCmd = new SqlCommand(@"
            UPDATE [Orders] SET
              [EmployeeID]=@EmployeeID,[CustomerID]=@CustomerID,
              [OrderDate]=@OrderDate,[ShippedDate]=@ShippedDate,[PaidDate]=@PaidDate,
              [Notes]=@Notes,[StatusID]=@StatusID,[ModifiedBy]='App',[ModifiedOn]=GETDATE()
            WHERE [OrderID]=@id", conn);
        updateCmd.Parameters.AddWithValue("@id", id);
        AddOrderParams(updateCmd, body);
        await updateCmd.ExecuteNonQueryAsync();

        if (body.Details is not null)
        {
            await using var deleteCmd = new SqlCommand("DELETE FROM [OrderDetails] WHERE [OrderID]=@id", conn);
            deleteCmd.Parameters.AddWithValue("@id", id);
            await deleteCmd.ExecuteNonQueryAsync();

            if (body.Details.Count > 0)
                await InsertDetails(conn, id, body.Details);
        }

        return Ok(new { success = true });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await using var conn = await db.CreateAsync();

        await using var delDetails = new SqlCommand("DELETE FROM [OrderDetails] WHERE [OrderID]=@id", conn);
        delDetails.Parameters.AddWithValue("@id", id);
        await delDetails.ExecuteNonQueryAsync();

        await using var delOrder = new SqlCommand("DELETE FROM [Orders] WHERE [OrderID]=@id", conn);
        delOrder.Parameters.AddWithValue("@id", id);
        await delOrder.ExecuteNonQueryAsync();

        return Ok(new { success = true });
    }

    private static void AddOrderParams(SqlCommand cmd, OrderRequest body)
    {
        cmd.Parameters.AddParam("@EmployeeID", body.EmployeeID);
        cmd.Parameters.AddParam("@CustomerID", body.CustomerID);
        cmd.Parameters.AddParam("@OrderDate", body.OrderDate);
        cmd.Parameters.AddParam("@ShippedDate", body.ShippedDate);
        cmd.Parameters.AddParam("@PaidDate", body.PaidDate);
        cmd.Parameters.AddParam("@Notes", body.Notes);
        cmd.Parameters.AddParam("@StatusID", body.StatusID);
    }

    private static async Task InsertDetails(SqlConnection conn, int orderId, List<OrderDetailRequest> details)
    {
        foreach (var d in details)
        {
            await using var cmd = new SqlCommand(@"
                INSERT INTO [OrderDetails]
                  ([OrderID],[ProductID],[Quantity],[UnitPrice],[AddedBy],[AddedOn],[ModifiedBy],[ModifiedOn])
                VALUES (@OrderID,@ProductID,@Quantity,@UnitPrice,'App',GETDATE(),'App',GETDATE())", conn);
            cmd.Parameters.AddWithValue("@OrderID", orderId);
            cmd.Parameters.AddParam("@ProductID", d.ProductID);
            cmd.Parameters.AddParam("@Quantity", d.Quantity);
            cmd.Parameters.AddParam("@UnitPrice", d.UnitPrice);
            await cmd.ExecuteNonQueryAsync();
        }
    }
}

public record OrderDetailRequest(int? ProductID, int? Quantity, decimal? UnitPrice);

public record OrderRequest(
    int? EmployeeID, int? CustomerID,
    DateTime? OrderDate, DateTime? ShippedDate, DateTime? PaidDate,
    string? Notes, int? StatusID,
    List<OrderDetailRequest>? Details);
