const baseUrl = process.env.DATEXRAY_TEST_URL ?? "http://localhost:3001";

const cases = [
  {
    name: "normal conversation",
    expectedRisk: "low",
    expectedCategories: [],
    transcript: `Alice: Hey! So glad we finally met up.
Bob: Me too! You're even nicer than your profile.
Alice: Haha thanks, I was a bit nervous honestly.
Bob: No need, this is going well. Wanna grab dinner next week?
Alice: Yeah! Are you free Thursday?
Bob: Thursday works. Want to try that Italian place on 5th?
Alice: Love it, I'll book it.
Bob: Awesome, can't wait.`,
  },
  {
    name: "commitment avoidance / breadcrumbing",
    expectedRisk: "medium",
    expectedCategories: ["avoidant", "breadcrumbing"],
    transcript: `Mia: Good morning babe 😊
Jake: Morning.
Mia: You were quiet yesterday, everything ok?
Jake: Yeah just busy.
Mia: It'd be nice to see you this weekend, maybe finally meet your friends?
Jake: Hmm, they're a bit wild, maybe another time.
Mia: We've been seeing each other 4 months now, I hoped we could talk about where this is going.
Jake: Let's not put pressure on things, go with the flow. I really like you though.
Mia: I like you too, I just want to know we're on the same page.
Jake: We are. Anyway I gotta run, talk soon.`,
  },
  {
    name: "financial scam pattern",
    expectedRisk: "critical",
    expectedCategories: ["scam"],
    transcript: `David: Hello beautiful, I hope this finds you well.
Sarah: Hi David! How's your week?
David: Stressful, but seeing your message made my day. I have something exciting to share.
Sarah: Oh? What is it?
David: I've been trading crypto and made 3x my money. I want to teach you so we can build a future together.
Sarah: I don't know anything about crypto.
David: That's fine, I'll guide you. I'm on an oil rig overseas so can't video call due to security, but I promise I'm real. Send me $500 to start and I'll show you.
Sarah: That seems like a lot...
David: My love, trust me. If you really care about our future you'll do this. I'll pay you back double.`,
  },
];

async function requestReport(testCase) {
  const response = await fetch(`${baseUrl}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcript: testCase.transcript }),
  });
  const report = await response.json();
  if (!response.ok) throw new Error(`${testCase.name}: API returned ${response.status}`);
  return { report, provider: response.headers.get("X-DateXray-Analysis-Provider") ?? "unknown" };
}

for (const testCase of cases) {
  const first = await requestReport(testCase);
  const second = await requestReport(testCase);
  const report = first.report;
  const expectedReportKeys = ["disclaimers", "next_checklist", "radar", "risk_level", "signal_hits", "summary"];
  if (JSON.stringify(Object.keys(report).sort()) !== JSON.stringify(expectedReportKeys)) {
    throw new Error(`${testCase.name}: report does not match the fixed top-level schema`);
  }
  if (report.risk_level !== testCase.expectedRisk) {
    throw new Error(`${testCase.name}: expected ${testCase.expectedRisk}, received ${report.risk_level}`);
  }
  for (const category of testCase.expectedCategories) {
    if (!Number.isInteger(report.radar?.[category]) || report.radar[category] < 1) {
      throw new Error(`${testCase.name}: expected a ${category} signal`);
    }
  }
  if (JSON.stringify(first.report) !== JSON.stringify(second.report)) {
    throw new Error(`${testCase.name}: repeated analysis returned a different report`);
  }

  const signalIds = report.signal_hits.map((hit) => hit.signal_id).join(", ") || "none";
  console.log(`PASS ${testCase.name}: ${report.risk_level}; ${signalIds}; provider=${first.provider}; repeat=identical`);
}
