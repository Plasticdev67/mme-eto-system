// Run: npx tsx scripts/set-password.ts <email> <password>
import { hash } from "bcryptjs"
import { PrismaClient } from "../src/generated/prisma"

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2]
  const password = process.argv[3]

  if (!email || !password) {
    console.log("Usage: npx tsx scripts/set-password.ts <email> <password>")
    process.exit(1)
  }

  const passwordHash = await hash(password, 12)

  const user = await prisma.user.update({
    where: { email },
    data: { passwordHash },
  })

  console.log(`Password set for ${user.name} (${user.email})`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
