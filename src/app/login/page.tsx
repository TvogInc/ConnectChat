import Link from "next/link";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-8 shadow-2xl">
        <Link href="/" className="text-sm text-cyan-300">
          ← ConnectChat
        </Link>

        <h1 className="mt-6 text-3xl font-bold">Welcome back</h1>
        <p className="mb-8 mt-2 text-slate-400">
          Enter your email to sign in or create an account.
        </p>

        <LoginForm />
      </section>
    </main>
  );
}
