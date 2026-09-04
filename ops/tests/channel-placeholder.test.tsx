import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { ChannelPlaceholder } from "@/components/channel-placeholder";

describe("future channel placeholder", () => {
  test("marks TikTok unavailable without a publishing control", () => {
    render(<ChannelPlaceholder name="TikTok" description="短视频运营规划将在后续版本加入。" />);

    expect(screen.getByText("尚未实现")).toBeVisible();
    expect(screen.getByRole("heading", { name: "TikTok" })).toBeVisible();
    expect(screen.queryByRole("button", { name: /publish/i })).not.toBeInTheDocument();
  });
});
