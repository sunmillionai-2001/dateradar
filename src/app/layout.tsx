import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "DateRadar — See the signals clearly",
    template: "%s | DateRadar",
  },
  description:
    "A private relationship risk radar that checks dating conversations for observable warning signals.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
