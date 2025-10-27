import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '../generated/prisma/client'

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!)

const prisma = new PrismaClient({ adapter })

export { prisma }
