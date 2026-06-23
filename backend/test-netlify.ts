import jwt from 'jsonwebtoken';
import 'dotenv/config';

async function test() {
  try {
    // We need the admin user's ID to generate a valid token. 
    // Since requireAdmin looks up the user by ID in the database and checks if role === 'ADMIN'.
    // Let's use Prisma to get the admin's ID directly!
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const adminUser = await prisma.user.findUnique({ where: { email: 'admin@neotrade.com' } });
    if (!adminUser) {
      console.log("Admin user not found in DB!");
      return;
    }
    
    const token = jwt.sign({ userId: adminUser.id }, process.env.JWT_SECRET || '');
    console.log("Generated token for", adminUser.id);
    
    const res = await fetch('https://clinquant-medovik-ad2ef1.netlify.app/api/admin/assets', {
      headers: {
        'Cookie': `token=${token}`
      }
    });
    
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Data:", JSON.stringify(data, null, 2));
    
  } catch(e) {
    console.error(e);
  }
}
test();
