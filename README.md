# Northwind App

React + Vite frontend with an ASP.NET Core 10 backend, plus a Python migration script that converts an Access Northwind `.accdb` file into SQL scripts for Microsoft Fabric SQL.

## Goal

After cloning, a user should be able to:

1. Place `Northwind.accdb` in the repository root.
2. Generate migration SQL files.
3. Run those SQL files in Fabric SQL.
4. Start the API and frontend.

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/)
- [Node.js](https://nodejs.org/)
- [Python 3.10+](https://www.python.org/)
- Microsoft Access Database Engine / Access ODBC driver (`Microsoft Access Driver (*.mdb, *.accdb)`)
- Azure CLI logged in (`az login`) with access to the Fabric SQL database

## 1. Clone and install dependencies

```bash
git clone <your-repo-url>
cd northwind-app
npm install
```

For migration dependencies:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements-migration.txt
```

## 2. Add Access file and generate SQL migration output

1. Copy your Access file to the repo root and name it `Northwind.accdb`.
2. Run:

```bash
python migration\extract_access_db.py
```

Output is generated in `migration_output/`:

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
  migration_output/     # Generated SQL/CSV/schema output (ignored in git)
  api/                  # ASP.NET Core 10 Web API
  src/                  # React frontend (Vite)
  server/               # Legacy Node.js/Express backend (reference)
```

