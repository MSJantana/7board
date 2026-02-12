// @ts-ignore
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { expand } from 'dotenv-expand';

const myEnv = dotenv.config();
expand(myEnv);

// Initialize Prisma Client
const prisma = new PrismaClient();

export default prisma;
