import { Router, Request, Response } from "express";
import { storagePut } from "./storage";

export const storageUploadRouter = Router();

// Parse raw body for audio uploads
storageUploadRouter.post("/upload-raw", async (req: Request, res: Response) => {
  try {
    const key = (req.query.key as string) || `uploads/${Date.now()}.webm`;
    const contentType = (req.headers["content-type"] as string) || "audio/webm";
    const chunks: Buffer[] = [];

    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", async () => {
      const buffer = Buffer.concat(chunks);
      if (buffer.length === 0) {
        res.status(400).json({ error: "Empty body" });
        return;
      }
      try {
        const { url } = await storagePut(key, buffer, contentType);
        res.json({ url, key });
      } catch (err) {
        console.error("Storage put error:", err);
        res.status(500).json({ error: "Upload failed" });
      }
    });
    req.on("error", (err) => {
      console.error("Request error:", err);
      res.status(500).json({ error: "Request error" });
    });
  } catch (err) {
    console.error("Storage upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});
