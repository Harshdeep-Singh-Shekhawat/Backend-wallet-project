import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  try {
    const userId = await requireAuth();
    const watchlists = await prisma.watchlist.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json({ watchlists });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireAuth();
    const { symbol } = await request.json();

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    const uppercaseSymbol = symbol.toUpperCase();

    // Check if it already exists
    const existing = await prisma.watchlist.findUnique({
      where: {
        userId_symbol: {
          userId,
          symbol: uppercaseSymbol,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ watchlist: existing });
    }

    const watchlist = await prisma.watchlist.create({
      data: {
        userId,
        symbol: uppercaseSymbol,
      },
    });

    return NextResponse.json({ watchlist });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = await requireAuth();
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    await prisma.watchlist.delete({
      where: {
        userId_symbol: {
          userId,
          symbol: symbol.toUpperCase(),
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
