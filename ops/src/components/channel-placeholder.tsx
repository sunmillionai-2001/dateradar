import Link from "next/link";

export function ChannelPlaceholder({ name, description }: { name: string; description: string }) {
  return (
    <main className="page-shell placeholder-page">
      <section className="placeholder-card">
        <div className="placeholder-index">FUTURE<br />CHANNEL</div>
        <div><span>Not implemented</span><h1>{name}</h1><p>{description}</p><p className="placeholder-note">The directory and navigation entry are reserved. No generator, account connection, or publishing action exists in this release.</p><Link href="/channels/x">Return to the X studio →</Link></div>
      </section>
    </main>
  );
}
