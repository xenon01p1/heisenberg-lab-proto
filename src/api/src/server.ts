import app from "./index";

const port = Number(process.env.PORT ?? 3000);

Bun.serve({
  port,
  fetch: app.fetch,
});

console.log(`Heisenberg API listening on http://localhost:${port}`);
