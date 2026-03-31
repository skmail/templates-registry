## Express API

A minimal Express.js API built with TypeScript and Bun.

### Tech Stack

| Layer         | Technology      | Purpose                          |
| ------------- | --------------- | -------------------------------- |
| **Runtime**   | **Bun**         | Fast JavaScript/TypeScript runtime |
| **Framework** | **Express.js**  | HTTP server and routing          |
| **Language**  | **TypeScript**  | Type-safe JavaScript             |

### Project Structure

- `src/index.ts` — Application entry point with route definitions
- `package.json` — Dependencies and scripts

### Getting Started

```bash
bun install
bun run src/index.ts
```

### Adding Routes

Add new routes in `src/index.ts`:

```typescript
app.get("/your-route", (_req, res) => {
  res.json({ data: "your data" });
});
```
