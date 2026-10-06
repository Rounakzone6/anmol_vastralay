import 'dotenv/config';
import 'reflect-metadata';
import { PrismaService } from './src/services/prisma.service';

async function main() {
  const prisma = new PrismaService();
  await prisma.onModuleInit();

  try {
    await prisma.deliveryPerson.updateMany({ data: { status: 'BUSY' } });
    
    const ravi = await prisma.deliveryPerson.findFirst({ 
      where: { name: { contains: 'Ravi Kumar', mode: 'insensitive' } } 
    });
    
    if (ravi) {
      await prisma.deliveryPerson.update({ 
        where: { id: ravi.id }, 
        data: { status: 'AVAILABLE' } 
      });
      console.log('Set all to BUSY except Ravi Kumar');
    }
  } finally {
    await prisma.onModuleDestroy();
  }
}
main().catch(console.error);
