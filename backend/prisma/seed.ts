import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('Seeding database...')

  // Create a default user
  const user = await prisma.user.create({
    data: {
      email: 'demo@example.com',
      name: 'Demo User',
      fiatBalance: 0.0,
    },
  })
  
  console.log(`Created default user with ID: ${user.id}`)

  // Seed some default assets
  const btc = await prisma.asset.create({
    data: {
      symbol: 'BTC',
      name: 'Bitcoin',
      type: 'CRYPTO',
    },
  })

  const eth = await prisma.asset.create({
    data: {
      symbol: 'ETH',
      name: 'Ethereum',
      type: 'CRYPTO',
    },
  })

  const aapl = await prisma.asset.create({
    data: {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      type: 'STOCK',
    },
  })

  const msft = await prisma.asset.create({
    data: {
      symbol: 'MSFT',
      name: 'Microsoft Corp.',
      type: 'STOCK',
    },
  })

  console.log(`Created default assets: BTC, ETH, AAPL, MSFT`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
