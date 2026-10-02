import express from "express";
import cors from "cors";
import http from "http";
import { setupSocket } from "./socket/index.js";
import healthRouter from "./routes/health.js";
import authRouter from "./routes/auth.js";
import profileRouter from "./routes/profile.js";
import messagesRouter from "./routes/messages.js";
import spacesRouter from "./routes/spaces.js";

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());

// Request ID middleware
app.use((req, _res, next) => {
  req.headers["x-request-id"] = req.headers["x-request-id"] || crypto.randomUUID();
  next();
});

// Routes
app.use("/health", healthRouter);
app.use("/v1/meta", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/profile", profileRouter);
app.use("/api/messages", messagesRouter);
app.use("/api/spaces", spacesRouter);

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = parseInt(process.env.PORT || "4000", 10);
const httpServer = server.listen(PORT, () => {
  console.log(`ConnectChat backend running on port ${PORT}`);
});

setupSocket(httpServer);

export { app };
