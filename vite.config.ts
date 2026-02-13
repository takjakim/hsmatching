import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import crypto from "crypto";

const SSO_KEY = "MJU_ineast";

function ssoDecrypt(encryptedBase64: string): string {
  const keyBuffer = Buffer.alloc(16, 0);
  Buffer.from(SSO_KEY, "utf-8").copy(keyBuffer);
  const decipher = crypto.createDecipheriv("aes-128-cbc", keyBuffer, keyBuffer);
  return decipher.update(encryptedBase64, "base64", "utf-8") + decipher.final("utf-8");
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: "sso-receive-dev",
      configureServer(server) {
        server.middlewares.use("/api/sso/receive", (req, res) => {
          if (req.method === "POST") {
            let body = "";
            req.on("data", (chunk: Buffer) => (body += chunk.toString()));
            req.on("end", () => {
              try {
                const params = new URLSearchParams(body);
                const fields = ["membernum", "membername", "departcode", "departname", "majorcode", "majorname"];
                const decrypted: Record<string, string> = {};
                for (const f of fields) {
                  const v = params.get(f);
                  if (v) decrypted[f] = ssoDecrypt(decodeURIComponent(v));
                }
                if (!decrypted.membernum || !decrypted.membername) {
                  res.writeHead(302, { Location: "/mju?error=missing_fields" });
                  return res.end();
                }
                const qs = new URLSearchParams({ sso: "1", ...decrypted });
                res.writeHead(302, { Location: `/mju?${qs.toString()}` });
                res.end();
              } catch (e: any) {
                console.error("SSO decrypt error:", e.message);
                res.writeHead(302, { Location: "/mju?error=invalid_token" });
                res.end();
              }
            });
          } else {
            res.writeHead(405);
            res.end("Method not allowed");
          }
        });
      },
    },
  ],
});