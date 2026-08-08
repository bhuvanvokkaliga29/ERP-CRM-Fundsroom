import { PrismaClient } from '@prisma/client';
import { AsyncLocalStorage } from 'async_hooks';
import { env } from './env';

export const tenantStorage = new AsyncLocalStorage<string>();

const createPrismaClient = (schema: string) => {
  const baseUrl = process.env.DATABASE_URL || '';
  let urlWithSchema = baseUrl;
  
  if (baseUrl) {
    if (baseUrl.includes('?')) {
      if (baseUrl.includes('schema=')) {
        urlWithSchema = baseUrl.replace(/schema=[^&]+/, `schema=${schema}`);
      } else {
        urlWithSchema += `&schema=${schema}`;
      }
    } else {
      urlWithSchema += `?schema=${schema}`;
    }
  }

  return new PrismaClient({
    datasources: {
      db: { url: urlWithSchema },
    },
    log: env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
};

const prismaMain = createPrismaClient('public');
const prismaDemo = createPrismaClient('demo');

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const tenant = tenantStorage.getStore() || 'main';
    const client = tenant === 'demo' ? prismaDemo : prismaMain;
    const value = Reflect.get(client, prop);
    
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  }
});
