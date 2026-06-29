import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import pino from "pino";
import qrcode from "qrcode";
import fs from "fs";

const logger = pino({ level: "silent" });

export async function createWAClient({ sessionDir, onQR, onConnected, onMessage }) {
  fs.mkdirSync(sessionDir, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
  const { version } = await fetchLatestBaileysVersion();

  let sock;

  function connect() {
    sock = makeWASocket({
      version,
      auth: state,
      logger,
      printQRInTerminal: false,
      browser: ["Medha Platform", "Chrome", "1.0"],
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {
      if (qr) {
        const dataUrl = await qrcode.toDataURL(qr);
        onQR(dataUrl);
      }

      if (connection === "open") {
        onConnected();
      }

      if (connection === "close") {
        const code = new Boom(lastDisconnect?.error)?.output?.statusCode;
        const shouldReconnect = code !== DisconnectReason.loggedOut;
        console.log(`Connection closed (code=${code}). Reconnect: ${shouldReconnect}`);
        if (shouldReconnect) {
          setTimeout(connect, 3000);
        }
      }
    });

    sock.ev.on("messages.upsert", async ({ messages, type }) => {
      console.log(`[msg] upsert type=${type} count=${messages.length}`);
      for (const msg of messages) {
        const jid = msg.key.remoteJid || "";
        const fromMe = msg.key.fromMe;
        const msgTypes = msg.message ? Object.keys(msg.message) : [];
        console.log(`[msg] jid=${jid} fromMe=${fromMe} type=${type} msgTypes=${msgTypes.join(",")}`);

        if (type !== "notify") { console.log("[msg] skipped: not notify"); continue; }
        if (fromMe) { console.log("[msg] skipped: fromMe"); continue; }
        if (!msg.message) { console.log("[msg] skipped: no message body"); continue; }

        // Clean phone number for storage/display (digits only)
        const phone = jid.replace(/@(s\.whatsapp\.net|lid|g\.us)$/, "").replace(/\D/g, "");
        // Full JID needed to send replies back (especially @lid addresses)
        const replyJid = jid;
        const messageId = msg.key.id || "";

        let text = "";
        if (msg.message.conversation) {
          text = msg.message.conversation;
        } else if (msg.message.extendedTextMessage?.text) {
          text = msg.message.extendedTextMessage.text;
        } else if (msg.message.listResponseMessage?.singleSelectReply?.selectedRowId) {
          text = msg.message.listResponseMessage.singleSelectReply.selectedRowId;
        } else if (msg.message.buttonsResponseMessage?.selectedButtonId) {
          text = msg.message.buttonsResponseMessage.selectedButtonId;
        } else if (msg.message.templateButtonReplyMessage?.selectedId) {
          text = msg.message.templateButtonReplyMessage.selectedId;
        }

        console.log(`[msg] phone=${phone} jid=${replyJid} text="${text}"`);
        if (text) {
          await onMessage({ phone, replyJid, text, messageId });
        }
      }
    });
  }

  connect();

  await new Promise((resolve) => setTimeout(resolve, 500));

  return sock;
}
