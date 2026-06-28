import express from "express";
import { createWAClient } from "./whatsapp.js";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;
const BACKEND_URL = process.env.BACKEND_URL || "http://backend:8000";

let waClient = null;
let currentQR = null;

async function boot() {
  waClient = await createWAClient({
    sessionDir: "./sessions",
    onQR: (qrDataUrl) => {
      currentQR = qrDataUrl;
      console.log("QR code updated — scan at GET /qr");
    },
    onConnected: () => {
      currentQR = null;
      console.log("WhatsApp connected");
    },
    onMessage: async (msg) => {
      try {
        const axios = (await import("axios")).default;
        await axios.post(`${BACKEND_URL}/api/whatsapp/inbound`, msg, { timeout: 10000 });
      } catch (err) {
        console.error("Failed to forward message to backend:", err.message);
      }
    },
  });
}

// GET /qr — returns QR code as data URL or JSON
app.get("/qr", (req, res) => {
  if (!currentQR) {
    return res.json({ qr: null, connected: true });
  }
  res.json({ qr: currentQR, connected: false });
});

// GET /status
app.get("/status", (req, res) => {
  res.json({ connected: currentQR === null, ready: waClient !== null });
});

// POST /send/text
app.post("/send/text", async (req, res) => {
  try {
    const { phone, text } = req.body;
    if (!phone || !text) return res.status(400).json({ error: "phone and text required" });
    const jid = `${phone.replace(/\D/g, "")}@s.whatsapp.net`;
    await waClient.sendMessage(jid, { text });
    res.json({ ok: true });
  } catch (err) {
    console.error("send/text error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /send/list
app.post("/send/list", async (req, res) => {
  try {
    const { phone, header, body, sections } = req.body;
    const jid = `${phone.replace(/\D/g, "")}@s.whatsapp.net`;
    await waClient.sendMessage(jid, {
      listMessage: {
        title: header,
        text: body,
        footerText: "",
        buttonText: "Select",
        listType: 1,
        sections: sections.map((s) => ({
          title: s.title,
          rows: s.rows.map((r) => ({ title: r.title, description: r.description || "", rowId: r.id })),
        })),
      },
    });
    res.json({ ok: true });
  } catch (err) {
    console.error("send/list error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /send/document
app.post("/send/document", async (req, res) => {
  try {
    const { phone, url, filename, caption } = req.body;
    const jid = `${phone.replace(/\D/g, "")}@s.whatsapp.net`;
    await waClient.sendMessage(jid, {
      document: { url },
      mimetype: "application/pdf",
      fileName: filename,
      caption: caption || "",
    });
    res.json({ ok: true });
  } catch (err) {
    console.error("send/document error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /send/image
app.post("/send/image", async (req, res) => {
  try {
    const { phone, url, caption } = req.body;
    const jid = `${phone.replace(/\D/g, "")}@s.whatsapp.net`;
    await waClient.sendMessage(jid, { image: { url }, caption: caption || "" });
    res.json({ ok: true });
  } catch (err) {
    console.error("send/image error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /disconnect — log out and delete session so a fresh QR is shown
app.post("/disconnect", async (req, res) => {
  try {
    if (waClient) {
      await waClient.logout();
    }
  } catch (_) {
    // ignore errors during logout
  }
  // delete session files so next boot shows fresh QR
  const fs = await import("fs");
  const path = await import("path");
  const sessionPath = path.resolve("./sessions");
  for (const f of fs.readdirSync(sessionPath)) {
    if (f !== ".gitkeep") fs.rmSync(path.join(sessionPath, f), { recursive: true, force: true });
  }
  waClient = null;
  currentQR = null;
  // restart connection
  boot().catch(console.error);
  res.json({ ok: true });
});

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => {
  console.log(`Baileys service listening on port ${PORT}`);
});

boot().catch(console.error);
