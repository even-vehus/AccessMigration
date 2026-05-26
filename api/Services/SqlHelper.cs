using Microsoft.Data.SqlClient;

namespace NorthwindApi.Services;

public static class SqlHelper
{
    public static async Task<List<Dictionary<string, object?>>> ReadRowsAsync(SqlDataReader reader)
    {
        var results = new List<Dictionary<string, object?>>();
        while (await reader.ReadAsync())
        {
            var row = new Dictionary<string, object?>();
            for (int i = 0; i < reader.FieldCount; i++)
                row[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
            results.Add(row);
        }
        return results;
    }
}
