using Microsoft.Data.SqlClient;

namespace NorthwindApi.Services;

public static class SqlExtensions
{
    /// <summary>Adds a parameter, converting C# null to DBNull.Value for SQL.</summary>
    public static void AddParam(this SqlParameterCollection p, string name, object? value)
        => p.AddWithValue(name, value ?? (object)DBNull.Value);
}
