import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import http from "node:http";
import https from "node:https";
import { resolve } from "node:path";

const projectRoot = process.cwd();
const certPath = resolve(projectRoot, "certificates", "localhost.pfx");
const targetPort = 3051;
const httpsPort = 3050;

console.log("\x1b[36m================================================================\x1b[0m");
console.log("\x1b[36m DAK MONITORING SYSTEM - LOCAL SECURE HTTPS DEV RUNNER\x1b[0m");
console.log("\x1b[36m================================================================\x1b[0m");

if (!existsSync(certPath)) {
  console.log("\x1b[33mGenerating local SSL certificate...\x1b[0m");
  const ps = spawn("powershell", ["-ExecutionPolicy", "Bypass", "-File", resolve(projectRoot, "scripts", "setup-local-ssl.ps1")], {
    stdio: "inherit",
  });
  await new Promise((res, rej) => {
    ps.on("close", (code) => (code === 0 ? res() : rej(new Error(`Cert generation failed with code ${code}`))));
  });
}

console.log(`\x1b[32m[1/2] Loaded SSL certificate:\x1b[0m ${certPath}`);

// Start Next.js internal HTTP dev server on port 3051
console.log(`\x1b[32m[2/2] Launching Next.js internal dev server on port ${targetPort}...\x1b[0m`);
const nextProcess = spawn(
  "npx",
  ["next", "dev", "-p", String(targetPort)],
  {
    cwd: projectRoot,
    stdio: "inherit",
    shell: true,
    env: {
      ...process.env,
      PORT: String(targetPort),
    },
  }
);

// Create HTTPS Reverse Proxy on port 3050
const pfx = readFileSync(certPath);
const proxyServer = https.createServer(
  {
    pfx,
    passphrase: "dak123",
  },
  (clientReq, clientRes) => {
    const options = {
      hostname: "127.0.0.1",
      port: targetPort,
      path: clientReq.url,
      method: clientReq.method,
      headers: {
        ...clientReq.headers,
        host: clientReq.headers.host || `localhost:${httpsPort}`,
        "x-forwarded-proto": "https",
        "x-forwarded-host": clientReq.headers.host || `localhost:${httpsPort}`,
        "x-forwarded-for": clientReq.socket.remoteAddress || "127.0.0.1",
      },
    };

    const proxyReq = http.request(options, (proxyRes) => {
      clientRes.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
      proxyRes.pipe(clientRes, { end: true });
    });

    proxyReq.on("error", (err) => {
      if (!clientRes.headersSent) {
        clientRes.writeHead(502, { "Content-Type": "text/plain" });
        clientRes.end(`Next.js dev server starting up... Please refresh in a moment. (${err.message})`);
      }
    });

    clientReq.pipe(proxyReq, { end: true });
  }
);

// WebSocket Proxy for HMR / Hot Reload
proxyServer.on("upgrade", (clientReq, clientSocket, clientHead) => {
  const options = {
    hostname: "127.0.0.1",
    port: targetPort,
    path: clientReq.url,
    method: clientReq.method,
    headers: {
      ...clientReq.headers,
      "x-forwarded-proto": "https",
      "x-forwarded-host": clientReq.headers.host || `localhost:${httpsPort}`,
    },
  };

  const proxyReq = http.request(options);
  proxyReq.on("upgrade", (proxyRes, proxySocket, proxyHead) => {
    clientSocket.write(
      `HTTP/1.1 101 Switching Protocols\r\n` +
      Object.entries(proxyRes.headers)
        .map(([k, v]) => `${k}: ${v}`)
        .join("\r\n") +
      `\r\n\r\n`
    );
    proxySocket.pipe(clientSocket);
    clientSocket.pipe(proxySocket);
  });

  proxyReq.on("error", () => {
    clientSocket.end();
  });

  proxyReq.end();
});

proxyServer.listen(httpsPort, "0.0.0.0", () => {
  console.log("\x1b[36m================================================================\x1b[0m");
  console.log(`\x1b[32m [SUCCESS] Secure HTTPS Dev Server Ready!\x1b[0m`);
  console.log(`  Local:   \x1b[34mhttps://localhost:${httpsPort}\x1b[0m`);
  console.log(`  Network: \x1b[34mhttps://127.0.0.1:${httpsPort}\x1b[0m`);
  console.log("\x1b[36m================================================================\x1b[0m");
});

function cleanup() {
  proxyServer.close();
  nextProcess.kill();
  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
process.on("exit", cleanup);
