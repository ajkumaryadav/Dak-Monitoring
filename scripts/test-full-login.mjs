import { loginAction } from "../src/app/(auth)/login/actions.ts";

async function testLoginDirect() {
  const formData = new FormData();
  formData.append("email", "collector@collectorate.gov.in");
  formData.append("password", "password123");

  try {
    const result = await loginAction({}, formData);
    console.log("Login Action Result:", result);
  } catch (err) {
    if (err && err.digest && err.digest.startsWith("NEXT_REDIRECT")) {
      console.log("Login Action Succeeded with REDIRECT:", err.digest);
    } else {
      console.error("Login Action Error:", err);
    }
  }
}

testLoginDirect();
