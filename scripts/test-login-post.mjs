import https from "node:https";
import fs from "node:fs";

const cert = fs.readFileSync("d:/aj/Dak/certificates/dak_server.crt");

const getReq = https.request(
  {
    hostname: "127.0.0.1",
    port: 443,
    path: "/login",
    method: "GET",
    headers: { Host: "10.70.233.176" },
    ca: cert,
    rejectUnauthorized: false,
  },
  (res) => {
    let body = "";
    res.on("data", (c) => (body += c));
    res.on("end", () => {
      console.log("Status:", res.statusCode);
      // Look for server action ID in HTML scripts or form
      const matches = body.match(/(\$ACTION_ID_[a-zA-Z0-9_$]+|[0-9a-f]{40})/g);
      console.log("Found IDs:", matches);

      // Extract all script contents searching for action id
      const actionMatch = body.match(/"(\$ACTION_ID_[a-f0-9]+|[a-f0-9]{40})"/);
      console.log("Action match:", actionMatch ? actionMatch[1] : null);

      const actionId = "60eb8b859bf35bf7de3fc12624b05ff20f3583494d";
      console.log("Using Action ID:", actionId);

      const boundary = "----WebKitFormBoundary" + Math.random().toString(36).substring(2);
      let payload = `--${boundary}\r\nContent-Disposition: form-data; name="email"\r\n\r\ncollector@collectorate.gov.in\r\n`;
      payload += `--${boundary}\r\nContent-Disposition: form-data; name="password"\r\n\r\npassword123\r\n`;
      payload += `--${boundary}--\r\n`;

      const postReq = https.request(
        {
          hostname: "127.0.0.1",
          port: 443,
          path: "/login",
          method: "POST",
          headers: {
            Host: "10.70.233.176",
            "Content-Type": `multipart/form-data; boundary=${boundary}`,
            "Next-Action": actionId,
            "Origin": "https://10.70.233.176",
            "Referer": "https://10.70.233.176/login",
            "X-Forwarded-Proto": "https",
          },
          ca: cert,
          rejectUnauthorized: false,
        },
        (postRes) => {
          let postBody = "";
          postRes.on("data", (c) => (postBody += c));
          postRes.on("end", () => {
            console.log("POST Status:", postRes.statusCode);
            console.log("POST Set-Cookie:", postRes.headers["set-cookie"]);
            console.log("POST Headers:", postRes.headers);
            console.log("POST Body:", postBody.substring(0, 300));
          });
        }
      );
      postReq.write(payload);
      postReq.end();
    });
  }
);
getReq.end();
