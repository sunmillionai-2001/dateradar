import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { ChannelPlaceholder } from "@/components/channel-placeholder";

describe("future channel placeholder", () => {
  test("marks TikTok unavailable without a publishing control", () => {
    render(<ChannelPlaceholder name="TikTok" description="Short-form video planning will live here later." />);

    expect(screen.getByText("Not implemented")).toBeVisible();
    expect(screen.getByRole("heading", { name: "TikTok" })).toBeVisible();
    expect(screen.queryByRole("button", { name: /publish/i })).not.toBeInTheDocument();
  });
});
