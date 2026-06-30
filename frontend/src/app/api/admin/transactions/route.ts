import { NextResponse } from 'next/server';
import { Client } from 'pg';
import { cookies } from 'next/headers';
import * as jose from 'jose';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  let token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : '';

  if (!token) {
    const cookieStore = await cookies();
    token = cookieStore.get('token')?.value || '';
  }

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-key-for-development-only');
    const { payload } = await jose.jwtVerify(token, secret);
    
    if (!payload.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Connect to Neon DB
    const client = new Client({
      connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_HJqBUe6DY9fE@ep-ancient-math-adyaukrg.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require'
    });
    
    await client.connect();

    const query = `
      SELECT t.id, t.type, t.quantity, t."pricePerUnit", t."totalValue", t.timestamp,
             u.name as "userName", u.email as "userEmail",
             a.symbol as "assetSymbol"
      FROM "Transaction" t
      JOIN "User" u ON t."userId" = u.id
      LEFT JOIN "Asset" a ON t."assetId" = a.id
      ORDER BY t.timestamp DESC;
    `;
    
    const res = await client.query(query);
    await client.end();

    return NextResponse.json({ transactions: res.rows });
  } catch (error) {
    console.error('Admin Transactions Route Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
