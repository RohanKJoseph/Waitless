/**
 * Runs a command with the monorepo root .env loaded.
 *
 * Prisma's CLI only reads .env from its own working directory (apps/api) or
 * the schema directory, but this repo keeps a single .env at the root. Rather
 * than duplicating secrets, every db:* script goes through this wrapper.
 *
 * Usage: node scripts/with-env.mjs prisma migrate dev --name add-thing
 */
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { config } from "dotenv";

config({
  path: resolve(import.meta.dirname, "../../../.env"),
  override: true,
  quiet: true,
});

const [command, ...args] = process.argv.slice(2);
if (!command) {
  console.error("with-env: no command provided");
  process.exit(1);
}

const result = spawnSync(command, args, {
  stdio: "inherit",
  env: process.env,
  shell: process.platform === "win32",
});

if (result.error) {
  console.error(`with-env: failed to run "${command}":`, result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 0);
