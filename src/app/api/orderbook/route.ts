import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    const asset = await prisma.asset.findUnique({ where: { symbol } });
    if (!asset) return NextResponse.json({ bids: [], asks: [] });

    // Fetch active bids and asks for this asset
    const rawBids = await prisma.order.findMany({
      where: { assetId: asset.id, type: 'BUY', status: { in: ['PENDING', 'PARTIAL'] } },
      select: { price: true, quantity: true, filledQuantity: true },
    });

    const rawAsks = await prisma.order.findMany({
      where: { assetId: asset.id, type: 'SELL', status: { in: ['PENDING', 'PARTIAL'] } },
      select: { price: true, quantity: true, filledQuantity: true },
    });

    // Aggregate by price level
    const aggregate = (orders: any[]) => {
      const map = new Map<number, number>();
      orders.forEach(o => {
        if (!o.price) return;
        const remaining = o.quantity - o.filledQuantity;
        if (remaining <= 0) return;
        map.set(o.price, (map.get(o.price) || 0) + remaining);
      });
      return Array.from(map.entries()).map(([price, quantity]) => ({ price, quantity }));
    };

    const bids = aggregate(rawBids).sort((a, b) => b.price - a.price); // Highest bids first
    const asks = aggregate(rawAsks).sort((a, b) => a.price - b.price); // Lowest asks first

    // Limit to top 10 levels for UI
    return NextResponse.json({ 
      bids: bids.slice(0, 10), 
      asks: asks.slice(0, 10) 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
