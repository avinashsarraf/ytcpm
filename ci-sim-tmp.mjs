import { startTestDatabase } from "./scripts/cms-test-db.mjs";
const db = await startTestDatabase({ port: 55433 });
console.log("READY", db.databaseUrl);
process.on("SIGTERM", async () => { await db.stop(); process.exit(0); });
setTimeout(async () => { await db.stop(); process.exit(0); }, 600000);
