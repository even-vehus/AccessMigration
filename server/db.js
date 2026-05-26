require('dotenv').config();
const { DefaultAzureCredential } = require('@azure/identity');
const sql = require('mssql');

let pool = null;

async function getPool() {
  if (pool) return pool;

  const credential = new DefaultAzureCredential();
  const tokenResponse = await credential.getToken(
    'https://database.windows.net/.default'
  );

  const config = {
    server: process.env.DB_SERVER,
    port: parseInt(process.env.DB_PORT, 10),
    database: process.env.DB_NAME,
    options: {
      encrypt: true,
      trustServerCertificate: false,
    },
    authentication: {
      type: 'azure-active-directory-access-token',
      options: {
        token: tokenResponse.token,
      },
    },
  };

  pool = await sql.connect(config);
  return pool;
}

module.exports = { getPool, sql };
