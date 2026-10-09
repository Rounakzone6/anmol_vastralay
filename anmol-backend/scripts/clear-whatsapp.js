const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing whatsapp sessions...');
  await prisma.whatsappSession.deleteMany();
  console.log('✅ Cleared broken WhatsApp sessions from database');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
