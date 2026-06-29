const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_HJqBUe6DY9fE@ep-ancient-math-adyaukrg.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require'
});
async function update() {
  await client.connect();
  const email = 'admin@neotrade.com';
  const hash = '$2b$10$D2idLzlD5qav/Kkw/zpkMe88QZI9yMyP1fqZBDe0Ln8NZA5CLodgy';
  const res = await client.query("SELECT * FROM \"User\" WHERE email = $1", [email]);
  if (res.rows.length > 0) {
    await client.query("UPDATE \"User\" SET password = $1, role = 'ADMIN' WHERE email = $2", [hash, email]);
    console.log('Updated user password');
  } else {
    // Generate an ID or use crypto.randomUUID (assuming UUID type)
    const crypto = require('crypto');
    const id = crypto.randomUUID();
    await client.query("INSERT INTO \"User\" (id, email, name, password, role, \"fiatBalance\", \"updatedAt\") VALUES ($3, $1, 'Admin', $2, 'ADMIN', 10000, NOW())", [email, hash, id]);
    console.log('Inserted user');
  }
  await client.end();
}
update().catch(console.error);
