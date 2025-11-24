const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const store = await prisma.store.findFirst()
  console.log('Store ID:', store?.id || 'No store found')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
