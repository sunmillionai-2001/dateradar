# DateXray Operations Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local-only operations workbench under `/ops` for planning, generating, recording, and reviewing English X content for `@DateXray`.

**Architecture:** A standalone Next.js 16 App Router application listens on `127.0.0.1:3100`. Server-only modules call DeepSeek, read Git history, and atomically persist local JSON; client pages consume narrow Route Handler APIs. Static brand/template configuration is committed while runtime topics and ledger files are ignored and initialized from committed examples.

**Tech Stack:** Next.js 16.3.4, React 19.2.8, TypeScript 5, Tailwind CSS 4, Vitest, React Testing Library, Node.js filesystem and child-process APIs.

**Spec:** `/Users/sunbaogangdemac/dateradar/ops/docs/design.md`

## Global Constraints

- Keep all implementation, dependencies, data, docs, and tests under `/ops`.
- Bind local development to `127.0.0.1:3100`; do not deploy the workbench.
- Do not change public DateXray routes, relationship-analysis prompts, schemas, validators, or build scripts.
- Never expose or log `DEEPSEEK_API_KEY`; the browser receives only validated generation output.
- Commit `brand-voice.json`, `content-types.json`, `visual-templates.json`, `topics.example.json`, and `content-ledger.example.json`.
- Ignore runtime `topics.json`, `content-ledger.json`, `*.tmp`, `.env*.local`, `.next`, `node_modules`, and coverage output.
- Generated X text must be English, contain exactly three distinct variants, and remain at or below 280 Unicode code points.
- Content provides observable risk education and reference actions; it never decides whether a reader should leave, stay, date, trust, or reject someone.

---

### Task 1: Standalone app and private runtime data policy

**Files:**
- Create: `ops/package.json`
- Create: `ops/package-lock.json`
- Create: `ops/tsconfig.json`
- Create: `ops/next.config.ts`
- Create: `ops/postcss.config.mjs`
- Create: `ops/eslint.config.mjs`
- Create: `ops/vitest.config.ts`
- Create: `ops/vitest.setup.ts`
- Create: `ops/.gitignore`
- Create: `ops/data/brand-voice.json`
- Create: `ops/data/content-types.json`
- Create: `ops/data/visual-templates.json`
- Create: `ops/data/topics.example.json`
- Create: `ops/data/content-ledger.example.json`
- Test: `ops/tests/config.test.ts`

**Interfaces:**
- Produces: the `@/*` alias, `npm run dev|build|lint|typecheck|test` commands, and committed static JSON consumed by later tasks.

- [ ] **Step 1: Create package and tool configuration**

Use the same Next/React/Tailwind versions as the public application. Set `dev` to `next dev -H 127.0.0.1 -p 3100`, `test` to `vitest run`, and add jsdom plus Testing Library dev dependencies.

- [ ] **Step 2: Add `/ops/.gitignore` before runtime files exist**

```gitignore
.next/
node_modules/
coverage/
.env*.local
data/content-ledger.json
data/topics.json
data/*.tmp
```

- [ ] **Step 3: Write the failing configuration test**

```ts
test("ships exactly the six approved content types", async () => {
  const types = await readStaticJson<{ contentTypes: Array<{ id: string }> }>("content-types.json");
  expect(types.contentTypes.map((item) => item.id)).toEqual([
    "anti_fraud", "product_demo", "build_in_public",
    "opinion", "interaction", "founder_pov",
  ]);
});
```

- [ ] **Step 4: Run the test and confirm RED**

Run: `cd ops && npm test -- tests/config.test.ts`
Expected: FAIL because `readStaticJson` and the configuration files do not exist.

- [ ] **Step 5: Add reviewed static configuration and empty examples**

Populate all brand principles, six descriptions/examples/CTAs, and three visual-template definitions from the design. Examples must use invented scenarios and must not claim real user outcomes.

- [ ] **Step 6: Run the configuration test and confirm GREEN**

Run: `cd ops && npm test -- tests/config.test.ts`
Expected: PASS with exactly six valid type IDs.

### Task 2: Typed JSON storage and ledger behavior

**Files:**
- Create: `ops/src/lib/types.ts`
- Create: `ops/src/lib/data/static.ts`
- Create: `ops/src/lib/data/paths.ts`
- Create: `ops/src/lib/data/json-store.ts`
- Create: `ops/src/lib/ledger/ledger.ts`
- Create: `ops/src/lib/ledger/cadence.ts`
- Test: `ops/tests/json-store.test.ts`
- Test: `ops/tests/ledger.test.ts`

**Interfaces:**
- Produces: `readRuntimeJson<T>(name, fallbackName, dataDir?)`, `writeRuntimeJson<T>(name, value, dataDir?)`, `upsertCopiedEntry(input, options?)`, `updateLedgerEntry(id, patch, options?)`, `searchLedger(entries, filters)`, `engagementRate(metrics)`, and `deriveDailyCadence(entries, date)`.

- [ ] **Step 1: Write failing initialization and ledger tests**

```ts
test("initializes an ignored runtime file from its committed example", async () => {
  const topics = await readRuntimeJson("topics.json", "topics.example.json", tempDataDir);
  expect(topics).toEqual({ version: 1, topics: [] });
  expect(JSON.parse(await readFile(join(tempDataDir, "topics.json"), "utf8"))).toEqual(topics);
});

test("re-copy updates one entry instead of duplicating it", async () => {
  await upsertCopiedEntry(copyInput, { dataDir: tempDataDir, now: fixedNow });
  await upsertCopiedEntry({ ...copyInput, finalText: "Edited" }, { dataDir: tempDataDir, now: later });
  const ledger = await readLedger({ dataDir: tempDataDir });
  expect(ledger.entries).toHaveLength(1);
  expect(ledger.entries[0]).toMatchObject({ finalText: "Edited", copyCount: 2 });
});
```

- [ ] **Step 2: Run tests and confirm RED**

Run: `cd ops && npm test -- tests/json-store.test.ts tests/ledger.test.ts`
Expected: FAIL because the storage and ledger modules are missing.

- [ ] **Step 3: Implement atomic JSON storage**

Resolve only allowlisted files inside the configured data directory, copy the example on first read, serialize writes through a per-path promise queue, write `<filename>.<uuid>.tmp`, then rename it over the runtime file.

- [ ] **Step 4: Implement ledger operations and derived values**

Use `crypto.randomUUID()`, normalize non-negative integer metrics, deduplicate by `generationId + variantIndex`, implement text/type/date/status/high-performer filters, and return zero engagement when impressions are zero.

- [ ] **Step 5: Run tests and confirm GREEN**

Run: `cd ops && npm test -- tests/json-store.test.ts tests/ledger.test.ts`
Expected: PASS, with all writes contained in the temporary test directory.

### Task 3: DeepSeek generation and validation

**Files:**
- Create: `ops/src/lib/ai/prompt.ts`
- Create: `ops/src/lib/ai/schema.ts`
- Create: `ops/src/lib/ai/deepseek.ts`
- Create: `ops/src/lib/ai/generate.ts`
- Test: `ops/tests/generate.test.ts`

**Interfaces:**
- Produces: `generateXDrafts(input, dependencies?) -> Promise<GenerationResult>` and `generateGitInsights(commits, dependencies?) -> Promise<GitInsightResult>`.
- Consumes: committed brand and content-type configuration from Task 1.

- [ ] **Step 1: Write failing output-boundary tests**

```ts
test("returns three distinct English drafts within 280 code points", async () => {
  const result = await generateXDrafts(input, { fetch: fakeValidDeepSeek, apiKey: "test-key" });
  expect(result.drafts).toHaveLength(3);
  expect(new Set(result.drafts.map((draft) => draft.text)).size).toBe(3);
  expect(result.drafts.every((draft) => Array.from(draft.text).length <= 280)).toBe(true);
});

test("repairs one invalid response and rejects a second invalid response", async () => {
  await expect(generateXDrafts(input, { fetch: alwaysInvalid, apiKey: "test-key" }))
    .rejects.toThrow("DeepSeek returned invalid X drafts after one repair attempt");
});
```

- [ ] **Step 2: Run tests and confirm RED**

Run: `cd ops && npm test -- tests/generate.test.ts`
Expected: FAIL because generation modules are missing.

- [ ] **Step 3: Implement strict parsing and prompts**

Validate input lengths, exact object keys, exactly three non-empty drafts, uniqueness, and the 280-code-point limit. Build prompts from reviewed static configuration. Include the decision boundary, source-fact boundary, and prompt-injection boundary.

- [ ] **Step 4: Implement the ops-local DeepSeek adapter**

Call `https://api.deepseek.com/chat/completions` with model `deepseek-v4-pro`, `thinking: { type: "disabled" }`, JSON response format, `temperature: 0.6`, and an abort timeout. Require `DEEPSEEK_API_KEY` unless explicitly injected by tests. Retry validation repair once and never log prompt or response content.

- [ ] **Step 5: Run tests and confirm GREEN**

Run: `cd ops && npm test -- tests/generate.test.ts`
Expected: PASS without network access.

### Task 4: Safe Git log extraction

**Files:**
- Create: `ops/src/lib/git/history.ts`
- Test: `ops/tests/git-history.test.ts`

**Interfaces:**
- Produces: `readGitHistory(rangeDays, dependencies?) -> Promise<GitCommit[]>`.

- [ ] **Step 1: Write failing range and parser tests**

```ts
test.each([1, 15, 365])("rejects non-allowlisted range %s", async (range) => {
  await expect(readGitHistory(range, { execFile: fakeExecFile, repoRoot: "/repo" }))
    .rejects.toThrow("Range must be 7, 14, or 30 days");
});

test("parses commit facts without reading working tree content", async () => {
  const commits = await readGitHistory(7, { execFile: fixtureExecFile, repoRoot: "/repo" });
  expect(commits[0]).toEqual({ hash: "ae3e92d", date: "2026-09-04T08:00:00+08:00", subject: "docs: switch plan", files: ["product-spec.md"] });
});
```

- [ ] **Step 2: Run test and confirm RED**

Run: `cd ops && npm test -- tests/git-history.test.ts`
Expected: FAIL because `readGitHistory` is missing.

- [ ] **Step 3: Implement argument-array Git execution**

Use promisified `execFile("git", ["log", ...], { cwd: repoRoot })` with record and field separators. Accept only 7, 14, or 30 and cap returned commits. Do not invoke a shell.

- [ ] **Step 4: Run test and confirm GREEN**

Run: `cd ops && npm test -- tests/git-history.test.ts`
Expected: PASS and prove the fake receives an argument array.

### Task 5: Local Route Handler API

**Files:**
- Create: `ops/src/app/api/bootstrap/route.ts`
- Create: `ops/src/app/api/generate/route.ts`
- Create: `ops/src/app/api/git-insights/route.ts`
- Create: `ops/src/app/api/ledger/route.ts`
- Create: `ops/src/app/api/ledger/[id]/route.ts`
- Create: `ops/src/app/api/topics/route.ts`
- Create: `ops/src/app/api/topics/[id]/route.ts`
- Create: `ops/src/lib/http.ts`
- Create: `ops/src/lib/topics/topics.ts`
- Test: `ops/tests/routes.test.ts`

**Interfaces:**
- Produces: JSON APIs for bootstrap data, generation, Git insights, ledger read/write/update, and topic CRUD.
- Consumes: Tasks 1–4 server functions.

- [ ] **Step 1: Write failing Route Handler tests**

```ts
test("generate rejects an unknown content type before provider work", async () => {
  const response = await POST(new Request("http://localhost/api/generate", {
    method: "POST", body: JSON.stringify({ contentType: "unknown", material: "hello" }),
  }));
  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({ error: "Choose one of the six supported content types." });
});
```

- [ ] **Step 2: Run test and confirm RED**

Run: `cd ops && npm test -- tests/routes.test.ts`
Expected: FAIL because Route Handlers are missing.

- [ ] **Step 3: Implement thin validated handlers**

Return `{ data }` on success and `{ error }` on failure. Use status 400 for validation, 500 for local storage/Git failures, 502 for invalid provider responses, and 503 when `DEEPSEEK_API_KEY` is absent. Export `runtime = "nodejs"` for filesystem and child-process handlers.

- [ ] **Step 4: Run test and confirm GREEN**

Run: `cd ops && npm test -- tests/routes.test.ts`
Expected: PASS with injected provider/Git boundaries and temporary data.

### Task 6: App shell and today dashboard

**Files:**
- Create: `ops/src/app/layout.tsx`
- Create: `ops/src/app/globals.css`
- Create: `ops/src/app/page.tsx`
- Create: `ops/src/components/app-shell.tsx`
- Create: `ops/src/components/today-dashboard.tsx`
- Create: `ops/src/components/status-pill.tsx`
- Test: `ops/tests/today-dashboard.test.tsx`

**Interfaces:**
- Produces: responsive navigation and a dashboard consuming bootstrap ledger data.

- [ ] **Step 1: Write the failing dashboard behavior test**

```tsx
test("shows the anti-fraud, progress, and interaction cadence states", async () => {
  render(<TodayDashboard entries={fixtureEntries} today="2026-09-04" />);
  expect(screen.getByText("Anti-fraud").closest("article")).toHaveTextContent("Published");
  expect(screen.getByText("Build progress").closest("article")).toHaveTextContent("Copied");
  expect(screen.getByText("Interaction").closest("article")).toHaveTextContent("Not prepared");
});
```

- [ ] **Step 2: Run test and confirm RED**

Run: `cd ops && npm test -- tests/today-dashboard.test.tsx`
Expected: FAIL because UI components are missing.

- [ ] **Step 3: Implement the shell and dashboard**

Use an editorial operations-desk visual system: warm paper background, near-black ink, signal lime for ready actions, coral for attention, compact numeric summaries, strong hierarchy, and responsive cards. Preserve focus indicators and reduced-motion behavior.

- [ ] **Step 4: Run test and confirm GREEN**

Run: `cd ops && npm test -- tests/today-dashboard.test.tsx`
Expected: PASS with all three derived states visible.

### Task 7: X generator and copy-to-ledger workflow

**Files:**
- Create: `ops/src/app/channels/x/page.tsx`
- Create: `ops/src/components/x-generator.tsx`
- Create: `ops/src/components/git-importer.tsx`
- Create: `ops/src/components/draft-card.tsx`
- Test: `ops/tests/x-generator.test.tsx`

**Interfaces:**
- Produces: material/type generation, Git insight selection, editable drafts, clipboard copying, and ledger upsert.

- [ ] **Step 1: Write failing clipboard-boundary tests**

```tsx
test("records the edited draft only after clipboard success", async () => {
  render(<XGenerator initialData={fixtureBootstrap} api={fakeApi} clipboard={successfulClipboard} />);
  await user.type(screen.getByLabelText("Source material"), "A real product change");
  await user.click(screen.getByRole("button", { name: "Generate 3 drafts" }));
  await user.clear(screen.getByLabelText("Edit draft 1"));
  await user.type(screen.getByLabelText("Edit draft 1"), "Edited final post");
  await user.click(screen.getByRole("button", { name: "Copy and log draft 1" }));
  expect(fakeApi.loggedEntries).toHaveLength(1);
  expect(fakeApi.loggedEntries[0].finalText).toBe("Edited final post");
});
```

- [ ] **Step 2: Run test and confirm RED**

Run: `cd ops && npm test -- tests/x-generator.test.tsx`
Expected: FAIL because the generator is missing.

- [ ] **Step 3: Implement generation, editing, and copying**

Show live character counts, disable copy over 280 characters, preserve drafts after recoverable errors, call clipboard first, then ledger. If ledger persistence fails after copying, show “Copied, but not logged” plus a retry action.

- [ ] **Step 4: Implement Git import inside the generator**

Offer fixed 7/14/30-day controls, list fact-supported insights with commit hashes, and place the selected `whatChanged/whyItMatters/lesson` into the editable source field.

- [ ] **Step 5: Run test and confirm GREEN**

Run: `cd ops && npm test -- tests/x-generator.test.tsx`
Expected: PASS for success, clipboard failure, ledger failure/retry, edit, and over-limit behavior.

### Task 8: Library, ledger, and review pages

**Files:**
- Create: `ops/src/app/library/page.tsx`
- Create: `ops/src/app/ledger/page.tsx`
- Create: `ops/src/app/review/page.tsx`
- Create: `ops/src/components/library-workspace.tsx`
- Create: `ops/src/components/ledger-workspace.tsx`
- Create: `ops/src/components/review-workspace.tsx`
- Create: `ops/src/components/visual-template-card.tsx`
- Test: `ops/tests/workspaces.test.tsx`

**Interfaces:**
- Produces: static library browsing, topic CRUD, ledger search/reuse, metrics editing, and top-performer marking.

- [ ] **Step 1: Write failing workspace tests**

```tsx
test("filters ledger text and reuses a result in the generator", async () => {
  render(<LedgerWorkspace initialEntries={fixtureEntries} api={fakeApi} />);
  await user.type(screen.getByLabelText("Search ledger"), "video call");
  expect(screen.getByText(/refusing every video call/i)).toBeVisible();
  expect(screen.queryByText(/shipping the poster/i)).not.toBeInTheDocument();
});

test("updates metrics and marks a published post as a top performer", async () => {
  render(<ReviewWorkspace initialEntries={publishedEntries} api={fakeApi} />);
  await user.type(screen.getByLabelText("Impressions"), "1000");
  await user.click(screen.getByRole("checkbox", { name: "Top performer" }));
  await user.click(screen.getByRole("button", { name: "Save review" }));
  expect(fakeApi.updated.metrics.impressions).toBe(1000);
  expect(fakeApi.updated.isTopPerformer).toBe(true);
});
```

- [ ] **Step 2: Run test and confirm RED**

Run: `cd ops && npm test -- tests/workspaces.test.tsx`
Expected: FAIL because workspace components are missing.

- [ ] **Step 3: Implement the library**

Render brand rules and all content-type examples read-only, CSS previews for three templates, and editable topic cards. “Use in generator” navigates to `/channels/x?topic=<id>`.

- [ ] **Step 4: Implement ledger and review workspaces**

Keep filters client-side for local data volume. Allow copied entries to be marked published, historical text to be reused through a query-safe identifier, published metrics to be saved as non-negative integers, and manual top-performer marking.

- [ ] **Step 5: Run test and confirm GREEN**

Run: `cd ops && npm test -- tests/workspaces.test.tsx`
Expected: PASS for filters, reuse navigation, topic mutations, metric normalization, and top-performer updates.

### Task 9: Channel placeholders, docs, and isolation verification

**Files:**
- Create: `ops/src/app/channels/tiktok/page.tsx`
- Create: `ops/src/app/channels/reddit/page.tsx`
- Create: `ops/src/components/channel-placeholder.tsx`
- Create: `ops/README.md`
- Modify: `ops/docs/implementation-plan.md`
- Test: `ops/tests/channel-placeholder.test.tsx`

**Interfaces:**
- Produces: explicit expansion points, operator setup instructions, and final verification evidence.

- [ ] **Step 1: Write and run the failing placeholder test**

```tsx
test("marks future channels unavailable without a publishing control", () => {
  render(<ChannelPlaceholder name="TikTok" />);
  expect(screen.getByText("Not implemented")).toBeVisible();
  expect(screen.queryByRole("button", { name: /publish/i })).not.toBeInTheDocument();
});
```

Run: `cd ops && npm test -- tests/channel-placeholder.test.tsx`
Expected: FAIL because `ChannelPlaceholder` is missing.

- [ ] **Step 2: Implement placeholders and local README**

Document `npm install`, copying only the DeepSeek key into `ops/.env.local`, `npm run dev`, the `127.0.0.1:3100` URL, data privacy, backup expectations, tests, and the fact that copied/published content is never sent to X automatically.

- [ ] **Step 3: Run complete ops verification**

Run:

```bash
cd ops
npm test
npm run typecheck
npm run lint
npm run build
```

Expected: all commands exit zero with no test failures or lint/type errors.

- [ ] **Step 4: Verify public-app isolation**

Run from repository root:

```bash
npm run typecheck
npm run lint
npm run build
git check-ignore -v ops/data/content-ledger.json ops/data/topics.json
git status --short
```

Expected: public checks exit zero; both runtime data paths are ignored; no `.env.local`, runtime ledger, runtime topics, temporary file, or build output appears in status.

- [ ] **Step 5: Verify the local workbench manually**

Run: `cd ops && npm run dev`
Open: `http://127.0.0.1:3100`
Confirm dashboard, generator, Git import, library, ledger, review, and placeholders render; stop the server after the smoke test.

- [ ] **Step 6: Commit and push**

```bash
git add ops
git commit -m "feat: add local operations workbench"
git push origin main
```

Confirm the commit contains static configuration and examples but excludes runtime ledger/topics and all secrets.
