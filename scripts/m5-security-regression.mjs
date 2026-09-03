import { spawn } from "node:child_process";
import { createServer } from "node:http";

const firstPort = Number(process.env.DATEXRAY_SECURITY_TEST_PORT ?? 3187);
const appUrls = [`http://127.0.0.1:${firstPort}`, `http://127.0.0.1:${firstPort + 1}`];
const redisPort = firstPort - 1;
const redisUrl = `http://127.0.0.1:${redisPort}`;
const redisToken = "datexray-local-redis-test-token";
const testSigningSecret = "datexray-m5-security-regression-secret-2026";
const transcript = `David: I've been doing crypto trading, made 3x returns this month.
Sarah: I don't know anything about crypto.
David: I'm on an oil rig overseas and can't video call because of security rules.
Sarah: That seems unusual.
David: My love, send me $500 today so we can build our future.`;

const redisData = new Map();
const redisDiagnostics = [];
const serverOutput = new Map();

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

function readRedisValue(key) {
  const entry = redisData.get(key);
  if (!entry) return null;
  if (entry.expiresAt && entry.expiresAt <= Date.now()) {
    redisData.delete(key);
    return null;
  }
  return entry.value;
}

function writeRedisValue(key, value, expiresAt = null) {
  redisData.set(key, { value: String(value), expiresAt });
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function executeFakeRedis(command) {
  const name = String(command[0] ?? "").toUpperCase();

  if (name === "SET") {
    const [, key, value, ...options] = command;
    const normalizedOptions = options.map((option) => String(option).toUpperCase());
    if (normalizedOptions.includes("NX") && readRedisValue(String(key)) !== null) return null;
    const expirationIndex = normalizedOptions.indexOf("EX");
    const expiresAt = expirationIndex >= 0 ? Date.now() + Number(options[expirationIndex + 1]) * 1_000 : null;
    writeRedisValue(String(key), value, expiresAt);
    return "OK";
  }

  if (name === "EVAL") {
    const keyCount = Number(command[2]);
    const keys = command.slice(3, 3 + keyCount).map(String);
    const args = command.slice(3 + keyCount).map(String);
    const [pendingKey, dailyKey] = keys;
    const [accessTokenHash, bypassDailyLimit, dailyLimit, dailyExpiresAt] = args;
    const pending = readRedisValue(pendingKey);
    if (!pending) return ["invalid"];

    const separator = pending.indexOf("\n");
    if (separator < 0) {
      redisData.delete(pendingKey);
      return ["invalid"];
    }
    if (pending.slice(0, separator) !== accessTokenHash) return ["invalid"];

    if (bypassDailyLimit !== "1") {
      const used = Number(readRedisValue(dailyKey) ?? 0);
      if (used >= Number(dailyLimit)) return ["payment_required"];
      writeRedisValue(dailyKey, used + 1, Number(dailyExpiresAt) * 1_000);
    }

    redisData.delete(pendingKey);
    return ["unlocked", pending.slice(separator + 1)];
  }

  throw new Error(`Unsupported fake Redis command: ${name}`);
}

const redisServer = createServer(async (request, response) => {
  try {
    assert(request.headers.authorization === `Bearer ${redisToken}`, "Redis request used an unexpected token");
    const command = await readBody(request);
    assert(Array.isArray(command), "Redis request was not a command array");
    const result = executeFakeRedis(command);
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ result }));
  } catch (error) {
    redisDiagnostics.push(error instanceof Error ? error.message : "Fake Redis failure");
    response.writeHead(400, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ error: error instanceof Error ? error.message : "Fake Redis failure" }));
  }
});

await new Promise((resolve, reject) => {
  redisServer.once("error", reject);
  redisServer.listen(redisPort, "127.0.0.1", resolve);
});

const appServers = appUrls.map((_, index) => {
  const port = firstPort + index;
  const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(port)], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NODE_ENV: "production",
      DEV_MODE: "true",
      AI_PROVIDER: "anthropic",
      ANTHROPIC_API_KEY: "",
      DEEPSEEK_API_KEY: "",
      SHARE_SIGNING_SECRET: testSigningSecret,
      UPSTASH_REDIS_REST_URL: redisUrl,
      UPSTASH_REDIS_REST_TOKEN: redisToken,
      KV_REST_API_URL: "",
      KV_REST_API_TOKEN: "",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  serverOutput.set(child.pid, "");
  const capture = (chunk) => serverOutput.set(child.pid, `${serverOutput.get(child.pid)}${chunk}`.slice(-8_000));
  child.stdout.on("data", capture);
  child.stderr.on("data", capture);
  return child;
});

async function waitForServers() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const failed = appServers.find((server) => server.exitCode !== null);
    if (failed) throw new Error(`Production server exited early.\n${serverOutput.get(failed.pid)}`);
    try {
      const responses = await Promise.all(appUrls.map((url) => fetch(url)));
      if (responses.every((response) => response.ok)) return;
    } catch {
      // The production servers are still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Production servers did not become ready.\n${[...serverOutput.values()].join("\n")}`);
}

async function analyze(sequence) {
  const analyzeIndex = sequence % appUrls.length;
  const analyzeUrl = appUrls[analyzeIndex];
  const unlockUrl = appUrls[(analyzeIndex + 1) % appUrls.length];
  const response = await fetch(`${analyzeUrl}/api/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-vercel-forwarded-for": `203.0.113.${sequence}`,
    },
    body: JSON.stringify({ transcript }),
  });
  const body = await response.json();
  assert(response.status === 200, `analysis ${sequence} returned ${response.status}: ${JSON.stringify(body)}; redis=${redisDiagnostics.at(-1) ?? "no diagnostic"}`);
  assert(response.headers.get("x-datexray-report-store") === "redis", "analysis did not use the shared Redis report store");
  assert(sameKeys(body, ["report_id", "unlock_token", "expires_at", "created_at", "report"]), "analysis envelope changed unexpectedly");
  assert(sameKeys(body.report, ["risk_level", "summary", "radar", "disclaimers"]), "free report contains unexpected fields");
  assert(!hasForbiddenKey(body, new Set(["signal_hits", "matched_quote", "explanation", "advice", "next_checklist"])), "analysis response leaked a full-tier field");
  return { body, unlockUrl };
}

async function unlock(analysis, token = analysis.body.unlock_token) {
  const response = await fetch(`${analysis.unlockUrl}/api/unlock`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ report_id: analysis.body.report_id, unlock_token: token }),
  });
  assert(response.headers.get("x-datexray-report-store") === "redis", "unlock did not use the shared Redis report store");
  return { response, body: await response.json() };
}

function mutateToken(token) {
  const final = token.at(-1);
  return `${token.slice(0, -1)}${final === "A" ? "B" : "A"}`;
}

try {
  await waitForServers();

  let signedShareToken = "";
  let evidenceQuote = "";

  for (let index = 1; index <= 100; index += 1) {
    const analysis = await analyze(index);

    if (index === 1) {
      const invalid = await unlock(analysis, mutateToken(analysis.body.unlock_token));
      assert(invalid.response.status === 410, `invalid unlock token returned ${invalid.response.status}: ${JSON.stringify(invalid.body)}`);
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

  const validShare = await fetch(`${appUrls[0]}/report/shared?share=${encodeURIComponent(signedShareToken)}`);
  const validHtml = await validShare.text();
  assert(validShare.status === 200 && validHtml.includes(evidenceQuote), "valid signed share did not render its evidence");

  const tamperedShare = await fetch(`${appUrls[1]}/report/shared?share=${encodeURIComponent(mutateToken(signedShareToken))}`);
  const tamperedHtml = await tamperedShare.text();
  assert(tamperedShare.status === 200, "tampered share route did not render a safe error page");
  assert(tamperedHtml.includes("This shared report cannot be verified."), "tampered share was not marked invalid");
  assert(!tamperedHtml.includes(evidenceQuote), "tampered share leaked report evidence");

  const nonCanonicalShare = await fetch(`${appUrls[0]}/report/shared?share=${encodeURIComponent(`${signedShareToken}!`)}`);
  const nonCanonicalHtml = await nonCanonicalShare.text();
  assert(nonCanonicalHtml.includes("This shared report cannot be verified."), "non-canonical signature text was accepted");
  assert(!nonCanonicalHtml.includes(evidenceQuote), "non-canonical signature text leaked report evidence");

  const unsignedShare = await fetch(`${appUrls[1]}/report/shared?share=${encodeURIComponent(JSON.stringify({ report: "forged" }))}`);
  const unsignedHtml = await unsignedShare.text();
  assert(unsignedHtml.includes("This shared report cannot be verified."), "unsigned constructed share was accepted");

  console.log("PASS locked analysis responses contain only the free tier");
  console.log("PASS pending reports unlock across two production instances through shared Redis");
  console.log("PASS unlock credentials are secret-bound, one-time, and invalid attempts do not consume reports");
  console.log("PASS the shared UTC-day counter allows 100 unlocks and returns $4.99 payment_required on the 101st");
  console.log("PASS production ignores DEV_MODE and forged or tampered share links reveal no evidence");
} finally {
  for (const server of appServers) server.kill("SIGTERM");
  await new Promise((resolve) => redisServer.close(resolve));
}
