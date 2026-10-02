import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { Avatar } from "../components/ui/Avatar";
import { Button } from "../components/ui/Button";
import { formatTime } from "../lib/utils";
import type { DirectChannel, Space, User } from "../lib/types";
import { useNavigate } from "react-router-dom";

export function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dms, setDms] = useState<DirectChannel[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    Promise.all([api.getDirectChannels(), api.getSpaces(), api.getAllUsers()])
      .then(([dmRes, spaceRes, userRes]) => {
        setDms(dmRes.channels);
        setSpaces(spaceRes.spaces);
        setUsers(userRes.users);
      })
      .catch(console.error);
  }, []);

  if (!user) return null;

  const onlineUsers = users.filter((u) => u.isOnline);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Avatar name={user.displayName} color={user.avatarColor} size="lg" online={user.isOnline} />
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {greeting}, {user.displayName.split(" ")[0]}!
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{user.status}</p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {[
            { label: "New Chat", desc: "Message someone", to: "/chats", icon: "💬", color: "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400" },
            { label: "Spaces", desc: `${spaces.length} joined`, to: "/spaces", icon: "🏠", color: "bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400" },
            { label: "Live", desc: "Voice & video", to: "/live", icon: "📹", color: "bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400" },
            { label: "Profile", desc: "Edit your info", to: "/you", icon: "👤", color: "bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400" },
          ].map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.to)}
              className="flex flex-col items-start p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-md transition-all text-left"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-2 ${action.color}`}>
                {action.icon}
              </div>
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{action.label}</span>
              <span className="text-xs text-slate-400 dark:text-slate-500">{action.desc}</span>
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          {/* Recent DMs */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Recent Chats</h2>
              <button onClick={() => navigate("/chats")} className="text-xs text-brand-600 dark:text-brand-400 hover:underline">View all</button>
            </div>
            {dms.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-500 py-4 text-center">No conversations yet</p>
            ) : (
              <div className="space-y-1">
                {dms.slice(0, 4).map((dm) => (
                  <button
                    key={dm.id}
                    onClick={() => navigate(`/chats?dm=${dm.id}`)}
                    className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
                  >
                    <Avatar name={dm.otherUser.displayName} color={dm.otherUser.avatarColor} size="sm" online={dm.otherUser.isOnline} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{dm.otherUser.displayName}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                        {dm.lastMessage ? dm.lastMessage.content : "No messages yet"}
                      </p>
                    </div>
                    {dm.lastMessage && (
                      <span className="text-[11px] text-slate-400 shrink-0">{formatTime(dm.lastMessage.createdAt)}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Your Spaces */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Your Spaces</h2>
              <button onClick={() => navigate("/spaces")} className="text-xs text-brand-600 dark:text-brand-400 hover:underline">View all</button>
            </div>
            {spaces.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-500 py-4 text-center">No spaces joined yet</p>
            ) : (
              <div className="space-y-1">
                {spaces.slice(0, 4).map((space) => (
                  <button
                    key={space.id}
                    onClick={() => navigate(`/spaces?s=${space.id}`)}
                    className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
                  >
                    <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-950/50 flex items-center justify-center text-lg">
                      {space.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{space.name}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{space.channels.length} channels · {space.members.length} members</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Online users */}
        {onlineUsers.length > 0 && (
          <div className="mt-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-4">Online Now</h2>
            <div className="flex flex-wrap gap-3">
              {onlineUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={async () => {
                    const res = await api.createDirectChannel(u.id);
                    navigate(`/chats?dm=${res.channel.id}`);
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Avatar name={u.displayName} color={u.avatarColor} size="xs" online />
                  <span className="text-sm text-slate-700 dark:text-slate-300">{u.displayName}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
