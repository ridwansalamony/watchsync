import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";
let connection: ReturnType<typeof drizzle<typeof schema>> | undefined;
export function database() {
  if (!process.env.DATABASE_URL)
    throw new Error("DATABASE_URL belum dikonfigurasi.");
  return (connection ??= drizzle(
    new Pool({ connectionString: process.env.DATABASE_URL }),
    { schema },
  ));
}
