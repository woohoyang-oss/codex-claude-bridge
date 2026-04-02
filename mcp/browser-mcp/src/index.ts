import { startServer } from "./server.js";

startServer().catch((error) => {
  console.error("browser-mcp failed:", error);
  process.exit(1);
});
