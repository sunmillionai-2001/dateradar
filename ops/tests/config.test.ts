import { describe, expect, test } from "vitest";

import { readStaticJson } from "@/lib/data/static";

describe("committed operations configuration", () => {
  test("ships exactly the six approved content types", async () => {
    const types = await readStaticJson<{ contentTypes: Array<{ id: string }> }>("content-types.json");

    expect(types.contentTypes.map((item) => item.id)).toEqual([
      "anti_fraud",
      "product_demo",
      "build_in_public",
      "opinion",
      "interaction",
      "founder_pov",
    ]);
  });

  test("ships the three approved visual template definitions", async () => {
    const data = await readStaticJson<{ templates: Array<{ id: string }> }>("visual-templates.json");

    expect(data.templates.map((item) => item.id)).toEqual([
      "scam-pattern-card",
      "build-log-card",
      "conversation-prompt-card",
    ]);
  });
});
