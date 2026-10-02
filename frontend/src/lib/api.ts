const API_BASE = "/api";

function getToken(): string | null {
  return localStorage.getItem("cc_token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem("cc_token");
    window.dispatchEvent(new Event("auth:logout"));
    throw new Error("Session expired");
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data as T;
}

export const api = {
  // Auth
  register: (email: string, password: string, handle: string, displayName: string) =>
    request<{ token: string; user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, handle, displayName }),
    }),
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  getMe: () => request<{ user: User }>("/profile/me"),

  // Profile
  updateProfile: (data: Partial<Pick<User, "displayName" | "bio" | "pronouns" | "status" | "avatarColor" | "theme">>) =>
    request<{ user: User }>("/profile/me", { method: "PATCH", body: JSON.stringify(data) }),
  getAllUsers: () => request<{ users: User[] }>("/profile/all"),
  getUser: (id: string) => request<{ user: User }>(`/profile/${id}`),

  // Direct messages
  getDirectChannels: () => request<{ channels: DirectChannel[] }>("/messages/direct"),
  createDirectChannel: (userId: string) =>
    request<{ channel: { id: string; otherUser: User } }>("/messages/direct", {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),
  getDirectMessages: (channelId: string) => request<{ messages: Message[] }>(`/messages/direct/${channelId}`),
  sendDirectMessage: (channelId: string, content: string) =>
    request<{ message: Message }>(`/messages/direct/${channelId}`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),

  // Spaces
  getSpaces: () => request<{ spaces: Space[] }>("/spaces"),
  createSpace: (name: string, description: string, emoji: string, channelName: string) =>
    request<{ space: Space }>("/spaces", {
      method: "POST",
      body: JSON.stringify({ name, description, emoji, channelName }),
    }),
  discoverSpaces: () => request<{ spaces: DiscoverSpace[] }>("/spaces/discover"),
  joinSpace: (spaceId: string) =>
    request<{ ok: boolean }>(`/spaces/${spaceId}/join`, { method: "POST" }),
  addChannel: (spaceId: string, name: string) =>
    request<{ channel: Channel }>(`/spaces/${spaceId}/channels`, {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
  getChannelMessages: (spaceId: string, channelId: string) =>
    request<{ messages: Message[] }>(`/spaces/${spaceId}/channels/${channelId}/messages`),
  sendChannelMessage: (spaceId: string, channelId: string, content: string) =>
    request<{ message: Message }>(`/spaces/${spaceId}/channels/${channelId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),
};
