import express from "express";

const app = express();
const port = __PORT__;

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "Hello from Express API!" });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
