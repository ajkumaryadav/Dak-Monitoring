import http from "node:http";
import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const projectRoot = process.cwd();

// Load environment variables without external dependencies
for (const envFile of [".env.production", ".env", ".env.local"]) {
  const envPath = path.resolve(projectRoot, envFile);
  if (fs.existsSync(envPath)) {
    try {
      const raw = fs.readFileSync(envPath, "utf8");
      for (const line of raw.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
          const eqIdx = trimmed.indexOf("=");
          if (eqIdx > 0) {
            const key = trimmed.slice(0, eqIdx).trim();
            const val = trimmed.slice(eqIdx + 1).trim().replace(/^["'](.*)["']$/, "$1");
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      }
    } catch {}
  }
}

const HTTP_PORT = parseInt(process.env.HTTP_PORT || "80", 10);
const HTTPS_PORT = parseInt(process.env.HTTPS_PORT || process.env.PORT || "443", 10);
const INTERNAL_PORT = parseInt(process.env.INTERNAL_PORT || "3050", 10);
const HOSTNAME = process.env.HOSTNAME || "0.0.0.0";

console.log("================================================================");
console.log(" DAK MONITORING SYSTEM - PRODUCTION SECURE HTTPS RUNNER");
console.log("================================================================");
console.log(` HTTPS Port:    ${HTTPS_PORT} (0.0.0.0)`);
console.log(` HTTP Port:     ${HTTP_PORT} (0.0.0.0 -> HTTPS Redirect)`);
console.log(` Internal Next: 127.0.0.1:${INTERNAL_PORT}`);
console.log("================================================================");

// 1. Resolve TLS Certificates
let tlsOptions = null;
const certDir = path.resolve(projectRoot, "certificates");
const certFile = path.resolve(certDir, "dak_server.crt");
const keyFile = path.resolve(certDir, "dak_server.key");
const pfxFile = path.resolve(certDir, "localhost.pfx");

// Secure Modern TLS Cipher Configuration (Eliminates ROBOT attack, SHA-1, and non-PFS ciphers)
const STRONG_PFS_CIPHERS = [
  "ECDHE-ECDSA-AES256-GCM-SHA384",
  "ECDHE-RSA-AES256-GCM-SHA384",
  "ECDHE-ECDSA-CHACHA20-POLY1305",
  "ECDHE-RSA-CHACHA20-POLY1305",
  "ECDHE-ECDSA-AES128-GCM-SHA256",
  "ECDHE-RSA-AES128-GCM-SHA256",
  "!aNULL",
  "!eNULL",
  "!EXPORT",
  "!DES",
  "!RC4",
  "!MD5",
  "!PSK",
  "!SRP",
  "!CAMELLIA",
  "!SHA1",
  "!SHA",
  "!RSA",
  "!3DES",
  "!CBC",
].join(":");

const baseTlsSettings = {
  minVersion: "TLSv1.2",
  maxVersion: "TLSv1.3",
  honorCipherOrder: true,
  ciphers: STRONG_PFS_CIPHERS,
  ecdhCurve: "X25519:prime256v1:secp384r1",
};

if (fs.existsSync(certFile) && fs.existsSync(keyFile)) {
  console.log(`[TLS] Using certificate: ${certFile}`);
  tlsOptions = {
    ...baseTlsSettings,
    cert: fs.readFileSync(certFile),
    key: fs.readFileSync(keyFile),
  };
} else if (fs.existsSync(pfxFile)) {
  console.log(`[TLS] Using PFX bundle: ${pfxFile}`);
  tlsOptions = {
    ...baseTlsSettings,
    pfx: fs.readFileSync(pfxFile),
    passphrase: "dak123",
  };
} else {
  console.warn("[TLS Warning] No certificates found in ./certificates/ folder!");
  console.warn("Generating fallback self-signed certificate...");
  const sslScript = path.resolve(projectRoot, "scripts", "setup-local-ssl.ps1");
  if (fs.existsSync(sslScript)) {
    const { execSync } = await import("node:child_process");
    try {
      execSync(`powershell -ExecutionPolicy Bypass -File "${sslScript}"`, { stdio: "inherit" });
      if (fs.existsSync(pfxFile)) {
        tlsOptions = {
          ...baseTlsSettings,
          pfx: fs.readFileSync(pfxFile),
          passphrase: "dak123",
        };
      }
    } catch (err) {
      console.error("[TLS Error] Failed to generate fallback certificate:", err.message);
    }
  }
}

if (!tlsOptions) {
  console.error("[FATAL] Unable to initialize TLS context without certificates.");
  process.exit(1);
}

// 2. Start Next.js standalone server internally
console.log(`[1/3] Starting Next.js standalone server on 127.0.0.1:${INTERNAL_PORT}...`);

const serverJsPath = path.resolve(projectRoot, "server.js");
if (!fs.existsSync(serverJsPath)) {
  console.error(`[FATAL] Standalone server.js not found at ${serverJsPath}!`);
  process.exit(1);
}

const nextEnv = {
  ...process.env,
  PORT: String(INTERNAL_PORT),
  HOSTNAME: "127.0.0.1",
  NODE_ENV: "production",
};

const nextProcess = spawn(process.execPath, [serverJsPath], {
  cwd: projectRoot,
  env: nextEnv,
  stdio: ["ignore", "inherit", "inherit"],
});

nextProcess.on("error", (err) => {
  console.error("[FATAL] Failed to spawn Next.js process:", err);
  process.exit(1);
});

nextProcess.on("exit", (code, signal) => {
  console.log(`[Next.js] Process exited with code ${code}, signal ${signal}`);
  process.exit(code || 0);
});

// Helper for proxying requests
function proxyHttpRequest(req, res, isHttps = true) {
  const clientHost = req.headers.host || (isHttps ? `10.70.233.176:${HTTPS_PORT}` : `10.70.233.176:${HTTP_PORT}`);
  const remoteIp = req.socket.remoteAddress || "127.0.0.1";

  const options = {
    hostname: "127.0.0.1",
    port: INTERNAL_PORT,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: clientHost,
      "x-forwarded-proto": isHttps ? "https" : "http",
      "x-forwarded-host": clientHost,
      "x-forwarded-for": remoteIp,
    },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    // Add security headers to response
    const headers = { ...proxyRes.headers };
    if (isHttps) {
      headers["strict-transport-security"] = "max-age=31536000; includeSubDomains; preload";
    }
    headers["x-content-type-options"] = "nosniff";
    headers["x-frame-options"] = "DENY";
    headers["x-permitted-cross-domain-policies"] = "none";
    headers["referrer-policy"] = "strict-origin-when-cross-origin";
    headers["permissions-policy"] = "camera=(), microphone=(), geolocation=(), browsing-topics=()";
    
    // Strict standard CSP satisfying AppScan
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
      "object-src 'none'",
    ];
    if (isHttps) {
      cspDirectives.push("upgrade-insecure-requests");
    }
    headers["content-security-policy"] = cspDirectives.join("; ");

    // Prevent caching of sensitive routes
    if (req.url?.startsWith("/login") || req.url?.startsWith("/dashboard") || req.url?.startsWith("/api")) {
      headers["cache-control"] = "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
      headers["pragma"] = "no-cache";
      headers["expires"] = "0";
    }

    res.writeHead(proxyRes.statusCode || 200, headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on("error", (err) => {
    if (!res.headersSent) {
      res.writeHead(502, { "Content-Type": "text/plain" });
      res.end(`Next.js service initializing... Please refresh in a few seconds. (${err.message})`);
    }
  });

  req.pipe(proxyReq, { end: true });
}

// 3. Create HTTPS Server (Port 443)
console.log(`[2/3] Initializing HTTPS server on ${HOSTNAME}:${HTTPS_PORT}...`);
const httpsServer = https.createServer(tlsOptions, (req, res) => {
  proxyHttpRequest(req, res, true);
});

// WebSocket Upgrade Handling (for real-time notifications or HMR)
httpsServer.on("upgrade", (req, socket, head) => {
  const clientHost = req.headers.host || `10.70.233.176:${HTTPS_PORT}`;
  const options = {
    hostname: "127.0.0.1",
    port: INTERNAL_PORT,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      "x-forwarded-proto": "https",
      "x-forwarded-host": clientHost,
    },
  };

  const proxyReq = http.request(options);
  proxyReq.on("upgrade", (proxyRes, proxySocket, proxyHead) => {
    socket.write(
      `HTTP/1.1 101 Switching Protocols\r\n` +
      Object.entries(proxyRes.headers)
        .map(([k, v]) => `${k}: ${v}`)
        .join("\r\n") +
      `\r\n\r\n`
    );
    proxySocket.pipe(socket);
    socket.pipe(proxySocket);
  });

  proxyReq.on("error", () => {
    socket.end();
  });

  proxyReq.end();
});

httpsServer.listen(HTTPS_PORT, HOSTNAME, () => {
  console.log(`  ✓ HTTPS Server listening at https://${HOSTNAME === "0.0.0.0" ? "10.70.233.176" : HOSTNAME}:${HTTPS_PORT}`);
});

// 4. Create HTTP Server (Port 80) -> Redirect to HTTPS (or serve health checks)
console.log(`[3/3] Initializing HTTP to HTTPS redirect service on ${HOSTNAME}:${HTTP_PORT}...`);
const httpServer = http.createServer((req, res) => {
  // Allow health checks on HTTP directly for local diagnostics if requested
  if (req.url === "/api/health" || req.url === "/healthz") {
    proxyHttpRequest(req, res, false);
    return;
  }

  // Redirect all other requests to HTTPS
  const rawHost = req.headers.host || "10.70.233.176";
  const hostWithoutPort = rawHost.split(":")[0];
  const targetUrl = HTTPS_PORT === 443
    ? `https://${hostWithoutPort}${req.url}`
    : `https://${hostWithoutPort}:${HTTPS_PORT}${req.url}`;

  res.writeHead(301, {
    Location: targetUrl,
    "Content-Type": "text/html",
  });
  res.end(`<!DOCTYPE html><html><head><title>301 Moved Permanently</title></head><body><h1>301 Moved Permanently</h1><p>Redirecting to <a href="${targetUrl}">${targetUrl}</a></p></body></html>`);
});

httpServer.on("error", (err) => {
  if (err.code === "EADDRINUSE" || err.code === "EACCES") {
    console.warn(`[HTTP Notice] Port ${HTTP_PORT} is in use or restricted. HTTP redirect listener disabled. HTTPS on ${HTTPS_PORT} remains active.`);
  } else {
    console.error(`[HTTP Error] ${err.message}`);
  }
});

httpServer.listen(HTTP_PORT, HOSTNAME, () => {
  console.log(`  ✓ HTTP Redirect service listening at http://${HOSTNAME === "0.0.0.0" ? "10.70.233.176" : HOSTNAME}:${HTTP_PORT} -> HTTPS`);
});

// Graceful Shutdown
function shutdown() {
  console.log("\nShutting down DAK HTTPS service...");
  try { httpsServer.close(); } catch {}
  try { httpServer.close(); } catch {}
  try { nextProcess.kill("SIGTERM"); } catch {}
  setTimeout(() => process.exit(0), 1000);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
