import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  acceptFriendRequest,
  sendFriendRequest,
  signOut,
} from "./actions";

type DashboardProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

type RequestRow = {
  id: string;
  sender: {
    username: string;
    display_name: string | null;
  } | null;
};

type FriendshipRow = {
  user_a: string;
  user_b: string;
  profileA: {
    username: string;
    display_name: string | null;
  } | null;
  profileB: {
    username: string;
    display_name: string | null;
  } | null;
};

export default async function DashboardPage({
  searchParams,
}: DashboardProps) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [profileResult, requestsResult, friendshipsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("username, display_name")
      .eq("id", user.id)
      .single(),

    supabase
      .from("friend_requests")
      .select(`
        id,
        sender:profiles!friend_requests_sender_id_fkey (
          username,
          display_name
        )
      `)
      .eq("receiver_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),

    supabase
      .from("friendships")
      .select(`
        user_a,
        user_b,
        profileA:profiles!friendships_user_a_fkey (
          username,
          display_name
        ),
        profileB:profiles!friendships_user_b_fkey (
          username,
          display_name
        )
      `)
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`),
  ]);

  const profile = profileResult.data;
  const requests = (requestsResult.data ?? []) as unknown as RequestRow[];
  const friendships = (friendshipsResult.data ??
    []) as unknown as FriendshipRow[];

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-900/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-bold text-cyan-300">ConnectChat</h1>
            <p className="text-sm text-slate-400">
              @{profile?.username ?? "user"}
            </p>
          </div>

          <form action={signOut}>
            <button className="rounded-lg border border-white/10 px-4 py-2 text-sm hover:bg-white/5">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 p-6 md:grid-cols-3">
        <section className="rounded-2xl border border-white/10 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold">Add someone</h2>
          <p className="mt-1 text-sm text-slate-400">
            Search using their exact username.
          </p>

          <form action={sendFriendRequest} className="mt-5 space-y-3">
            <input
              name="username"
              required
              placeholder="user_a1b2c3d4"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-cyan-400"
            />

            <button className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 hover:bg-cyan-300">
              Send request
            </button>
          </form>

          {params.error && (
            <p className="mt-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-300">
              {params.error}
            </p>
          )}

          {params.success && (
            <p className="mt-4 rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-300">
              {params.success}
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-white/10 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold">Requests</h2>

          <div className="mt-5 space-y-3">
            {requests.length === 0 && (
              <p className="text-sm text-slate-400">
                You have no pending requests.
              </p>
            )}

            {requests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between rounded-xl bg-white/5 p-3"
              >
                <div>
                  <p className="font-medium">
                    {request.sender?.display_name ?? "ConnectChat user"}
                  </p>
                  <p className="text-sm text-slate-400">
                    @{request.sender?.username}
                  </p>
                </div>

                <form action={acceptFriendRequest}>
                  <input
                    type="hidden"
                    name="requestId"
                    value={request.id}
                  />
                  <button className="rounded-lg bg-emerald-400 px-3 py-2 text-sm font-semibold text-slate-950">
                    Accept
                  </button>
                </form>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold">Friends</h2>

          <div className="mt-5 space-y-3">
            {friendships.length === 0 && (
              <p className="text-sm text-slate-400">
                Add someone to start chatting.
              </p>
            )}

            {friendships.map((friendship) => {
              const friend =
                friendship.user_a === user.id
                  ? friendship.profileB
                  : friendship.profileA;

              return (
                <div
                  key={`${friendship.user_a}-${friendship.user_b}`}
                  className="rounded-xl bg-white/5 p-3"
                >
                  <p className="font-medium">
                    {friend?.display_name ?? "ConnectChat user"}
                  </p>
                  <p className="text-sm text-slate-400">
                    @{friend?.username}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
