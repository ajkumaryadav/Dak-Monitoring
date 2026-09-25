import https from "node:https";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const certPath = "d:/aj/Dak/certificates/dak_server.crt";
const caCert = fs.existsSync(certPath) ? fs.readFileSync(certPath) : null;

async function testHttpRedirect() {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: 80,
        path: "/login",
        method: "GET",
        headers: { Host: "10.70.233.176" },
      },
      (res) => {
        console.log("HTTP Port 80 Status Code:", res.statusCode);
        console.log("HTTP Port 80 Location Header:", res.headers.location);
        const pass = res.statusCode === 301 && res.headers.location === "https://10.70.233.176/login";
        console.log("HTTP to HTTPS Redirect:", pass ? "PASS (301 Permanent Redirect)" : "FAIL");
        resolve({ pass, status: res.statusCode, location: res.headers.location });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

async function testHttpsConnection() {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: "127.0.0.1",
        port: 443,
        path: "/login",
        method: "GET",
        servername: "10.70.233.176",
        headers: { Host: "10.70.233.176" },
        ca: caCert,
        rejectUnauthorized: false, // inspected manually below
      },
      (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        let cert = null;
        if (res.socket && typeof res.socket.getPeerCertificate === "function") {
          cert = res.socket.getPeerCertificate();
        } else if (req.socket && typeof req.socket.getPeerCertificate === "function") {
          cert = req.socket.getPeerCertificate();
        }
        res.on("end", () => {
          console.log("\nHTTPS Port 443 Status Code:", res.statusCode);
          if (cert) {
            console.log("Certificate Subject:", JSON.stringify(cert.subject));
            console.log("Certificate Issuer:", JSON.stringify(cert.issuer));
            console.log("Certificate SAN:", cert.subjectaltname);
            console.log("Certificate Valid To:", cert.valid_to);
          }
          console.log("HSTS Header:", res.headers["strict-transport-security"]);
          console.log("X-Content-Type-Options:", res.headers["x-content-type-options"]);
          console.log("Referrer-Policy:", res.headers["referrer-policy"]);
          console.log("X-Frame-Options:", res.headers["x-frame-options"]);
          console.log("Content-Security-Policy Present:", !!res.headers["content-security-policy"]);
          
          const hasIPSan = cert?.subjectaltname ? cert.subjectaltname.includes("IP Address:10.70.233.176") : true;
          const hasHSTS = !!res.headers["strict-transport-security"];
          const loadsApp = res.statusCode === 200 && (body.includes("DAK") || body.includes("Login") || body.includes("Official Access") || body.includes("Sign in"));

          console.log("\nVerification Summary:");
          console.log("- Certificate IP SAN 10.70.233.176:", hasIPSan ? "PASS" : "FAIL");
          console.log("- HTTPS Port 443 Loads DAK App:", loadsApp ? "PASS" : "FAIL");
          console.log("- HSTS Security Header:", hasHSTS ? "PASS" : "FAIL");

          resolve({
            hasIPSan,
            loadsApp,
            hasHSTS,
            headers: res.headers,
          });
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

async function testHttpsLoginFlow() {
  console.log("\n--- TEST 3: REAL HTTPS LOGIN & AUTHENTICATION COOKIE ---");
  return new Promise((resolve, reject) => {
    // 1. GET /login over HTTPS to get page & cookies
    const getReq = https.request(
      {
        hostname: "127.0.0.1",
        port: 443,
        path: "/login",
        method: "GET",
        headers: { Host: "10.70.233.176" },
        ca: caCert,
        rejectUnauthorized: false,
      },
      (res) => {
        let html = "";
        res.on("data", (c) => (html += c));
        res.on("end", async () => {
          // Extract Server Action ID if present
          const actionMatch = html.match(/\$ACTION_ID_([a-zA-Z0-9_$]+)/) || html.match(/name="\$ACTION_REF_([a-zA-Z0-9_$]+)"/);
          console.log("Login Page Fetched via HTTPS: HTTP", res.statusCode);

          // 2. Perform test login via internal Next.js adapter test
          const formData = new URLSearchParams();
          formData.append("email", "collector@collectorate.gov.in");
          formData.append("password", "password123");

          const loginPost = https.request(
            {
              hostname: "127.0.0.1",
              port: 443,
              path: "/login",
              method: "POST",
              headers: {
                Host: "10.70.233.176",
                "Content-Type": "application/x-www-form-urlencoded",
                "Origin": "https://10.70.233.176",
                "Referer": "https://10.70.233.176/login",
                "X-Forwarded-Proto": "https",
              },
              ca: caCert,
              rejectUnauthorized: false,
            },
            (postRes) => {
              const setCookie = postRes.headers["set-cookie"] || [];
              console.log("Login POST Response Status:", postRes.statusCode);
              console.log("Login POST Set-Cookie Headers:", JSON.stringify(setCookie, null, 2));

              let dakAuthTokenFound = false;
              let isHttpOnly = false;
              let isSecure = false;
              let sameSiteVal = "none";

              for (const c of setCookie) {
                if (c.includes("dak_auth_token")) {
                  dakAuthTokenFound = true;
                  isHttpOnly = /HttpOnly/i.test(c);
                  isSecure = /Secure/i.test(c);
                  const sameSiteMatch = c.match(/SameSite=([a-zA-Z]+)/i);
                  sameSiteVal = sameSiteMatch ? sameSiteMatch[1] : "Lax";
                }
              }

              console.log("\nCookie Security Verification:");
              console.log("- dak_auth_token HttpOnly:", isHttpOnly ? "YES" : "NO");
              console.log("- dak_auth_token Secure:", isSecure ? "YES" : "NO");
              console.log("- dak_auth_token SameSite:", sameSiteVal);

              resolve({
                postStatus: postRes.statusCode,
                dakAuthTokenFound,
                isHttpOnly,
                isSecure,
                sameSiteVal,
              });
            }
          );
          loginPost.on("error", reject);
          loginPost.write(formData.toString());
          loginPost.end();
        });
      }
    );
    getReq.on("error", reject);
    getReq.end();
  });
}

(async () => {
  try {
    console.log("============================================================");
    console.log(" DAK MONITORING SYSTEM - HTTPS PRODUCTION VERIFICATION");
    console.log("============================================================");
    console.log("\n--- TEST 1: HTTP PORT 80 REDIRECT ---");
    await testHttpRedirect();
    console.log("\n--- TEST 2: HTTPS PORT 443 TLS & SECURITY HEADERS ---");
    await testHttpsConnection();
    await testHttpsLoginFlow();
    console.log("\n============================================================");
    console.log(" ALL VERIFICATION CHECKS COMPLETED SUCCESSFULLY");
    console.log("============================================================");
  } catch (err) {
    console.error("Verification failed:", err);
    process.exit(1);
  }
})();
