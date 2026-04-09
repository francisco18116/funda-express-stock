import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Funda Express - Stock",
};

export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
