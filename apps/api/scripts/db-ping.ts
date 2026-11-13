import { prisma, checkDatabase } from "../src/config/prisma";
import { redis, checkRedis } from "../src/config/redis";

async function main() {
  const [db, cache] = await Promise.all([checkDatabase(), checkRedis()]);
  const result = { db: db ? "up" : "down", redis: cache ? "up" : "down" };
  console.log(JSON.stringify(result));

  await Promise.allSettled([prisma.$disconnect(), redis.quit()]);
  if (!db || !cache) process.exit(1);
}

main().catch(async (error) => {
  console.error(error);
  await Promise.allSettled([prisma.$disconnect(), redis.quit()]);
  process.exit(1);
});
