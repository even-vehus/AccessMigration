# Northwind App

React + Vite frontend with an ASP.NET Core backend for browsing and managing Northwind data stored in Fabric SQL.

Migration tooling is intentionally split into a separate repository:
https://github.com/even-vehus/access-to-sql-migration

## Scope of this repository

This repository contains:

1. `api/` for the ASP.NET Core API.
2. `src/` for the React frontend.
3. `server/` as a legacy Node.js backend reference.

This repository does not contain Access (`.accdb`) extraction scripts.

## Prerequisites

- [.NET SDK](https://dotnet.microsoft.com/)
- [Node.js](https://nodejs.org/)
- Access to an already provisioned Fabric SQL database

## Quick Start

Run these commands from this repository root (`northwind-app/`).

1. Configure API settings in `api/appsettings.Development.json`:

```json
{
  "DB_SERVER": "<your-fabric-sql-server>",
  "DB_PORT": "1433",
  "DB_NAME": "<your-database-name>"
}
```

2. Start API:

```powershell
cd .\api
dotnet run
```

3. Start frontend in a second terminal:

```powershell
npm install
npm run dev
```

4. Open http://localhost:5173.

## Database Migration

If you need to generate SQL from Access `.accdb` files, use the dedicated migration repo:

https://github.com/even-vehus/access-to-sql-migration

Run migration there first, load data into Fabric SQL, then use this app against that database.

Expected workflow across repositories:

1. Use `access-to-sql-migration` to extract Access data and generate SQL.
2. Apply generated SQL to your Fabric SQL database.
3. Run this `northwind-app` repo against that populated Fabric SQL database.

## Project Structure

```
northwind-app/
  api/                  # ASP.NET Core Web API
  src/                  # React frontend (Vite)
  server/               # Legacy Node.js/Express backend
```

