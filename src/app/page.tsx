import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="text-xl font-bold text-cyan-300">ConnectChat</span>

        <Link
          href="/login"
          className="rounded-xl border border-white/10 px-5 py-2 hover:bg-white/5"
        >
          Sign in
        </Link>
      </nav>

      <section className="mx-auto flex max-w-6xl flex-col items-center px-6 py-28 text-center">
        <div className="mb-6 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-300">
          Real-time conversations without limits
        </div>

        <h1 className="max-w-4xl text-5xl font-black tracking-tight md:text-7xl">
          Chat, call and connect in{" "}
          <span className="text-cyan-300">one place.</span>
        </h1>

        <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-400">
          ConnectChat brings private messaging, friend requests, group chats,
          screen sharing and high-quality video calls together.
        </p>

        <Link
          href="/login"
          className="mt-10 rounded-2xl bg-cyan-400 px-7 py-4 font-bold text-slate-950 transition hover:scale-105 hover:bg-cyan-300"
        >
          Start connecting
        </Link>
      </section>
    </main>
  );
}
