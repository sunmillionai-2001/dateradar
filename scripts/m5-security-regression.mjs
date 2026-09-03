import { spawn } from "node:child_process";

const port = Number(process.env.DATEXRAY_SECURITY_TEST_PORT ?? 3187);
const baseUrl = `http://127.0.0.1:${port}`;
const testSigningSecret = "datexray-m5-security-regression-secret-2026";
const transcript = `David: I've been doing crypto trading, made 3x returns this month.
Sarah: I don't know anything about crypto.
David: I'm on an oil rig overseas and can't video call because of security rules.
Sarah: That seems unusual.
David: My love, send me $500 today so we can build our future.`;

let serverOutput = "";
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(port)], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    NODE_ENV: "production",
    DEV_MODE: "true",
    AI_PROVIDER: "anthropic",
    ANTHROPIC_API_KEY: "",
    DEEPSEEK_API_KEY: "",
    SHARE_SIGNING_SECRET: testSigningSecret,
  },
  stdio: ["ignore", "pipe", "pipe"],
});

server.stdout.on("data", (chunk) => { serverOutput = `${serverOutput}${chunk}`.slice(-8_000); });
server.stderr.on("data", (chunk) => { serverOutput = `${serverOutput}${chunk}`.slice(-8_000); });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sameKeys(value, expected) {
  return JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...expected].sort());
}

function hasForbiddenKey(value, forbidden) {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some((item) => hasForbiddenKey(item, forbidden));
  return Object.entries(value).some(([key, child]) => forbidden.has(key) || hasForbiddenKey(child, forbidden));
}

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`Production server exited early.\n${serverOutput}`);
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {
      // The production server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Production server did not become ready.\n${serverOutput}`);
}

async function analyze(sequence) {
  const response = await fetch(`${baseUrl}/api/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-vercel-forwarded-for": `203.0.113.${sequence}`,
    },
    body: JSON.stringify({ transcript }),
  });
  const body = await response.json();
  assert(response.status === 200, `analysis ${sequence} returned ${response.status}: ${JSON.stringify(body)}`);
  assert(sameKeys(body, ["report_id", "unlock_token", "expires_at", "created_at", "report"]), "analysis envelope changed unexpectedly");
  assert(sameKeys(body.report, ["risk_level", "summary", "radar", "disclaimers"]), "free report contains unexpected fields");
  assert(!hasForbiddenKey(body, new Set(["signal_hits", "matched_quote", "explanation", "advice", "next_checklist"])), "analysis response leaked a full-tier field");
  return body;
}

async function unlock(analysis, token = analysis.unlock_token) {
  const response = await fetch(`${baseUrl}/api/unlock`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ report_id: analysis.report_id, unlock_token: token }),
  });
  return { response, body: await response.json() };
}

function mutateToken(token) {
  const final = token.at(-1);
  return `${token.slice(0, -1)}${final === "A" ? "B" : "A"}`;
}

try {
  await waitForServer();

  let signedShareToken = "";
  let evidenceQuote = "";

  for (let index = 1; index <= 100; index += 1) {
    const analysis = await analyze(index);

    if (index === 1) {
      const invalid = await unlock(analysis, mutateToken(analysis.unlock_token));
      assert(invalid.response.status === 410, "invalid unlock token was not rejected");
    }

    const unlocked = await unlock(analysis);
    assert(unlocked.response.status === 200, `complimentary unlock ${index} returned ${unlocked.response.status}`);
    assert(sameKeys(unlocked.body, ["full_report", "share_token", "unlock_source"]), "unlock response changed unexpectedly");
    assert(sameKeys(unlocked.body.full_report, ["signal_hits", "next_checklist"]), "unlock did not return exactly the full tier");
    assert(unlocked.body.unlock_source === "daily_free", "DEV_MODE affected a production server");

    if (index === 1) {
      signedShareToken = unlocked.body.share_token;
      evidenceQuote = unlocked.body.full_report.signal_hits[0]?.matched_quote ?? "";
      assert(evidenceQuote.length > 0, "mock report did not include evidence for share verification");

      const replay = await unlock(analysis);
      assert(replay.response.status === 410, "one-time unlock credentials were replayable");
    }
  }

  const overQuota = await analyze(101);
  const blocked = await unlock(overQuota);
  assert(blocked.response.status === 402, `101st unlock returned ${blocked.response.status}, expected 402`);
  assert(blocked.body.code === "payment_required" && blocked.body.price === "$4.99", "quota response did not expose the reserved payment state");

  const validShare = await fetch(`${baseUrl}/report/shared?share=${encodeURIComponent(signedShareToken)}`);
  const validHtml = await validShare.text();
  assert(validShare.status === 200 && validHtml.includes(evidenceQuote), "valid signed share did not render its evidence");

  const tamperedShare = await fetch(`${baseUrl}/report/shared?share=${encodeURIComponent(mutateToken(signedShareToken))}`);
  const tamperedHtml = await tamperedShare.text();
  assert(tamperedShare.status === 200, "tampered share route did not render a safe error page");
  assert(tamperedHtml.includes("This shared report cannot be verified."), "tampered share was not marked invalid");
  assert(!tamperedHtml.includes(evidenceQuote), "tampered share leaked report evidence");

  const nonCanonicalShare = await fetch(`${baseUrl}/report/shared?share=${encodeURIComponent(`${signedShareToken}!`)}`);
  const nonCanonicalHtml = await nonCanonicalShare.text();
  assert(nonCanonicalHtml.includes("This shared report cannot be verified."), "non-canonical signature text was accepted");
  assert(!nonCanonicalHtml.includes(evidenceQuote), "non-canonical signature text leaked report evidence");

  const unsignedShare = await fetch(`${baseUrl}/report/shared?share=${encodeURIComponent(JSON.stringify({ report: "forged" }))}`);
  const unsignedHtml = await unsignedShare.text();
  assert(unsignedHtml.includes("This shared report cannot be verified."), "unsigned constructed share was accepted");

  console.log("PASS locked analysis responses contain only the free tier");
  console.log("PASS unlock credentials are secret-bound, one-time, and invalid attempts do not consume reports");
  console.log("PASS first 100 UTC-day unlocks are complimentary and the 101st returns $4.99 payment_required");
  console.log("PASS production ignores DEV_MODE and forged or tampered share links reveal no evidence");
} finally {
  server.kill("SIGTERM");
}
