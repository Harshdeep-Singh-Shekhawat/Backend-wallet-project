import { NextResponse } from 'next/server';
import { Client } from 'pg';
import { cookies } from 'next/headers';

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
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const authRes = await fetch(`${backendUrl}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!authRes.ok) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authData = await authRes.json();
    if (!authData.authenticated || authData.user?.role !== 'ADMIN') {
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
    return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
  }
}
