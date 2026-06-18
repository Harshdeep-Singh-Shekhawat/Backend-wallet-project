import { prisma } from './prisma';

export async function processOrder(orderId: string) {
  // Using an interactive transaction to ensure atomicity
  await prisma.$transaction(async (tx) => {
    // 1. Fetch the incoming order
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { asset: true, user: true },
    });

    if (!order) return;
    if (order.status !== 'PENDING' && order.status !== 'PARTIAL') return;
    if (order.orderType !== 'LIMIT' || !order.price) return; // Only processing LIMIT orders for now

    let remainingQuantity = order.quantity - order.filledQuantity;
    if (remainingQuantity <= 0) return;

    // 2. Find matching orders
    let matchingOrders: any[] = [];
    
    if (order.type === 'BUY') {
      matchingOrders = await tx.order.findMany({
        where: {
          assetId: order.assetId,
          type: 'SELL',
          status: { in: ['PENDING', 'PARTIAL'] },
          price: { lte: order.price }, // Seller wants less than or equal to what buyer is willing to pay
        },
        orderBy: [
          { price: 'asc' }, // Best price first
          { createdAt: 'asc' }, // Oldest first
        ],
      });
    } else if (order.type === 'SELL') {
      matchingOrders = await tx.order.findMany({
        where: {
          assetId: order.assetId,
          type: 'BUY',
          status: { in: ['PENDING', 'PARTIAL'] },
          price: { gte: order.price }, // Buyer is willing to pay more than or equal to what seller wants
        },
        orderBy: [
          { price: 'desc' }, // Best price first
          { createdAt: 'asc' }, // Oldest first
        ],
      });
    }

    // 3. Process matches
    for (const match of matchingOrders) {
      if (remainingQuantity <= 0) break;
      if (!match.price) continue;

      const matchRemaining = match.quantity - match.filledQuantity;
      const fillQuantity = Math.min(remainingQuantity, matchRemaining);
      
      // Execution price is the maker's price (the order that was already on the book)
      const executionPrice = match.price; 
      const totalValue = fillQuantity * executionPrice;

      // --- Update Orders ---
      const newMatchFilled = match.filledQuantity + fillQuantity;
      const matchStatus = Math.abs(newMatchFilled - match.quantity) < 0.000001 ? 'FILLED' : 'PARTIAL';
      await tx.order.update({
        where: { id: match.id },
        data: { filledQuantity: newMatchFilled, status: matchStatus },
      });

      const newOrderFilled = order.filledQuantity + fillQuantity;
      remainingQuantity -= fillQuantity;
      const orderStatus = Math.abs(newOrderFilled - order.quantity) < 0.000001 ? 'FILLED' : 'PARTIAL';
      await tx.order.update({
        where: { id: order.id },
        data: { filledQuantity: newOrderFilled, status: orderStatus },
      });

      // --- Settle Funds & Portfolios ---
      const buyerId = order.type === 'BUY' ? order.userId : match.userId;
      const sellerId = order.type === 'SELL' ? order.userId : match.userId;
      const buyPriceLimit = order.type === 'BUY' ? order.price : match.price; // The limit price the buyer locked funds at

      // Seller: Un-lock asset quantity, add fiat balance
      await tx.portfolio.updateMany({
        where: { userId: sellerId, assetId: order.assetId },
        data: {
          lockedQuantity: { decrement: fillQuantity },
          quantity: { decrement: fillQuantity },
        },
      });
      await tx.user.update({
        where: { id: sellerId },
        data: {
          fiatBalance: { increment: totalValue },
        },
      });

      // Buyer: Unlock fiat, refund price difference if executed better than limit, add asset quantity
      const lockedFiatAmount = fillQuantity * buyPriceLimit;
      const refundAmount = lockedFiatAmount - totalValue; // (buyLimit - executionPrice) * qty

      await tx.user.update({
        where: { id: buyerId },
        data: {
          lockedFiatBalance: { decrement: lockedFiatAmount },
          fiatBalance: { increment: refundAmount }, // Refund if matched at better price
        },
      });

      // Update Buyer Portfolio
      let buyerPortfolio = await tx.portfolio.findUnique({
        where: { userId_assetId: { userId: buyerId, assetId: order.assetId } },
      });
      if (buyerPortfolio) {
        // Calculate new average purchase price
        const existingQty = buyerPortfolio.quantity;
        const existingCost = existingQty * buyerPortfolio.averagePurchasePrice;
        const newAvg = (existingCost + totalValue) / (existingQty + fillQuantity);
        
        await tx.portfolio.update({
          where: { id: buyerPortfolio.id },
          data: {
            quantity: { increment: fillQuantity },
            averagePurchasePrice: newAvg,
          },
        });
      } else {
        await tx.portfolio.create({
          data: {
            userId: buyerId,
            assetId: order.assetId,
            quantity: fillQuantity,
            averagePurchasePrice: executionPrice,
          },
        });
      }

      // --- Create Transactions ---
      await tx.transaction.create({
        data: {
          userId: buyerId,
          assetId: order.assetId,
          type: 'BUY',
          quantity: fillQuantity,
          pricePerUnit: executionPrice,
          totalValue: totalValue,
        },
      });
      await tx.transaction.create({
        data: {
          userId: sellerId,
          assetId: order.assetId,
          type: 'SELL',
          quantity: fillQuantity,
          pricePerUnit: executionPrice,
          totalValue: totalValue,
        },
      });
    }
  });
}
