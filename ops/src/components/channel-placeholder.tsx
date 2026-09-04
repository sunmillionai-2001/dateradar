import Link from "next/link";

export function ChannelPlaceholder({ name, description }: { name: string; description: string }) {
  return (
    <main className="page-shell placeholder-page">
      <section className="placeholder-card">
        <div className="placeholder-index">预留<br />渠道</div>
        <div><span>尚未实现</span><h1>{name}</h1><p>{description}</p><p className="placeholder-note">目录和导航入口已经预留。当前版本不包含生成器、账号连接或发布功能。</p><Link href="/channels/x">返回 X 生成器 →</Link></div>
      </section>
    </main>
  );
}
