using Azure.Core;
using Azure.Identity;
using Microsoft.Data.SqlClient;

namespace NorthwindApi.Services;

public class SqlConnectionFactory
{
    private readonly string _connectionString;
    private readonly DefaultAzureCredential _credential = new();
    private const string Scope = "https://database.windows.net/.default";

    public SqlConnectionFactory(IConfiguration config)
    {
        var server = config["DB_SERVER"];
        var port = config["DB_PORT"] ?? "1433";
        var database = config["DB_NAME"];
        _connectionString =
            $"Server={server},{port};Database={database};Encrypt=True;TrustServerCertificate=False;";
    }

    public async Task<SqlConnection> CreateAsync()
    {
        var tokenResponse = await _credential.GetTokenAsync(
            new TokenRequestContext([Scope]));
        var conn = new SqlConnection(_connectionString)
        {
            AccessToken = tokenResponse.Token
        };
        await conn.OpenAsync();
        return conn;
    }
}
