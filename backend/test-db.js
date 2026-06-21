const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://neondb_owner:npg_HJqBUe6DY9fE@ep-ancient-math-adyaukrg.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require' });

client.connect().then(() => {
  return client.query('SELECT COUNT(*) FROM "Alert"');
}).then(res => {
  console.log('Total alerts:', res.rows[0].count);
}).catch(console.error).finally(() => client.end());
