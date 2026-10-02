import { Router } from "express";

const router = Router();

router.get("/live", (_req, res) => {
  res.json({ status: "alive", timestamp: Date.now() });
});

router.get("/ready", (_req, res) => {
  res.json({ status: "ready", timestamp: Date.now() });
});

router.get("/version", (_req, res) => {
  res.json({ name: "ConnectChat", version: "1.0.0" });
});

export default router;
