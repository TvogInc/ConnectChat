"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function sendFriendRequest(formData: FormData) {
  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();

  if (!username) {
    redirect("/dashboard?error=Enter+a+username");
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: receiver } = await supabase
    .from("profiles")
    .select("id")
    .ilike("username", username)
    .maybeSingle();

  if (!receiver) {
    redirect("/dashboard?error=User+not+found");
  }

  if (receiver.id === user.id) {
    redirect("/dashboard?error=You+cannot+add+yourself");
  }

  const { error } = await supabase.from("friend_requests").insert({
    sender_id: user.id,
    receiver_id: receiver.id,
  });

  if (error) {
    redirect(`/dashboard?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  redirect("/dashboard?success=Friend+request+sent");
}

export async function acceptFriendRequest(formData: FormData) {
  const requestId = String(formData.get("requestId") ?? "");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase.rpc("accept_friend_request", {
    request_id: requestId,
  });

  if (error) {
    redirect(`/dashboard?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  redirect("/dashboard?success=Friend+request+accepted");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
