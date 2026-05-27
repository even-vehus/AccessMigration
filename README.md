# Access Migration App

React + Vite frontend with an ASP.NET Core 10 backend, plus a Python migration script that converts an Access Northwind `.accdb` file into SQL scripts for Microsoft Fabric SQL.

## Goal

After cloning, a user should be able to:

1. Place one or more `.accdb` files in `access_databases/`.
2. Generate migration SQL files.
3. Run those SQL files in Fabric SQL.
4. Start the API and frontend.

## Quick Start

Use this if you already have the repo open in VS Code and want the exact run order.

1. Open a PowerShell terminal in the repository root.
2. Activate the Python environment:

```powershell
.\.venv\Scripts\Activate.ps1
```

3. Generate the migration output, if needed:

```powershell
cd .\northwind-app
python .\migration\extract_access_db.py
```

4. Apply the generated SQL to Fabric SQL with `sqlcmd` using your own Fabric server and database values.
  Use the placeholders below, not literal hardcoded values:

```powershell
sqlcmd -S "<your-fabric-sql-server>,<port>" -d "<your-database-name>" --authentication-method ActiveDirectoryInteractive -N true -Q "SELECT DB_NAME()"
```

```powershell
sqlcmd -S "<your-fabric-sql-server>,<port>" -d "<your-database-name>" --authentication-method ActiveDirectoryInteractive -N true -i ".\migration_output\<database_name>\01_create_tables.sql"
sqlcmd -S "<your-fabric-sql-server>,<port>" -d "<your-database-name>" --authentication-method ActiveDirectoryInteractive -N true -i ".\migration_output\<database_name>\04_insert_data.sql"
sqlcmd -S "<your-fabric-sql-server>,<port>" -d "<your-database-name>" --authentication-method ActiveDirectoryInteractive -N true -i ".\migration_output\<database_name>\02_foreign_keys.sql"
sqlcmd -S "<your-fabric-sql-server>,<port>" -d "<your-database-name>" --authentication-method ActiveDirectoryInteractive -N true -i ".\migration_output\<database_name>\03_indexes.sql"
```

5. Start the API:

```powershell
cd .\api
dotnet run
```

6. Start the frontend in a second terminal:

```powershell
cd .\northwind-app
npm run dev
```

7. Open the app at `http://localhost:5173`.

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/)
- [Node.js](https://nodejs.org/)
- [Python 3.10+](https://www.python.org/)
- Microsoft Access Database Engine / Access ODBC driver (`Microsoft Access Driver (*.mdb, *.accdb)`)
- Azure CLI logged in (`az login`) with access to the Fabric SQL database

## 1. Clone and install dependencies

```bash
git clone <your-repo-url>
cd <cloned-repo-folder>
npm install
```

Example (for this repository name): `cd AccessMigration`

For migration dependencies:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements-migration.txt
```

## 2. Add Access files and generate SQL migration output

1. Copy Access files into `access_databases/`.
2. Run:

```bash
python migration\extract_access_db.py
```

This defaults to `access_databases/Northwind.accdb`.
For other files:

```bash
python migration\extract_access_db.py --db-name AnotherDatabase.accdb
```

Or use a full path override:

```bash
python migration\extract_access_db.py --db-path "C:\path\to\MyDatabase.accdb"
```

Output is generated in `migration_output/<database_name>/`:

- `01_create_tables.sql`
- `02_foreign_keys.sql`
- `03_indexes.sql`
- `04_insert_data.sql`
- `schema.json`
- `schema_summary.md`

## 3. Load generated SQL into Fabric SQL

Run the generated SQL files in this order:

1. `01_create_tables.sql`
2. `04_insert_data.sql`
3. `02_foreign_keys.sql`
4. `03_indexes.sql`

This creates and populates the Northwind schema in Fabric SQL.

You can run the generated SQL from the VS Code terminal with `sqlcmd`.
Use your Fabric SQL server and database values, for example from `api/appsettings.Development.json`.

Connection test:

```powershell
sqlcmd -S "<your-fabric-sql-server>,<port>" -d "<your-database-name>" --authentication-method ActiveDirectoryInteractive -N true -Q "SELECT DB_NAME()"
```

Run the scripts in order:

```powershell
sqlcmd -S "<your-fabric-sql-server>,<port>" -d "<your-database-name>" --authentication-method ActiveDirectoryInteractive -N true -i ".\migration_output\<database_name>\01_create_tables.sql"

sqlcmd -S "<your-fabric-sql-server>,<port>" -d "<your-database-name>" --authentication-method ActiveDirectoryInteractive -N true -i ".\migration_output\<database_name>\04_insert_data.sql"

sqlcmd -S "<your-fabric-sql-server>,<port>" -d "<your-database-name>" --authentication-method ActiveDirectoryInteractive -N true -i ".\migration_output\<database_name>\02_foreign_keys.sql"

sqlcmd -S "<your-fabric-sql-server>,<port>" -d "<your-database-name>" --authentication-method ActiveDirectoryInteractive -N true -i ".\migration_output\<database_name>\03_indexes.sql"
```

Notes:

- If `02_foreign_keys.sql` is not generated, skip that step.
- If you authenticate with Azure CLI instead of interactive login, replace `ActiveDirectoryInteractive` with `ActiveDirectoryAzCli`.
- Run these commands from the repository root so the relative `migration_output\...` paths resolve correctly.

## 4. Configure and run backend

Create `api/appsettings.Development.json`:

```json
{
  "DB_SERVER": "<your-fabric-sql-server>",
  "DB_PORT": "1433",
  "DB_NAME": "<your-database-name>"
}
```

Run backend (http://localhost:3001):

```bash
cd api
dotnet run
```

If you use the quick start above, you can skip straight to the commands there.

## 5. Run frontend

In a second terminal:

```bash
npm run dev
```

Frontend runs at http://localhost:5173 and calls API at http://localhost:3001.

## Project structure

```
northwind-app/
  migration/            # Access -> Fabric SQL extraction tooling
  access_databases/     # Local source .accdb files (ignored in git)
  migration_output/     # Generated SQL/CSV/schema output per database (ignored in git)
  api/                  # ASP.NET Core 10 Web API
  src/                  # React frontend (Vite)
  server/               # Legacy Node.js/Express backend (reference)
```

