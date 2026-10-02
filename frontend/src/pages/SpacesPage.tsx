import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { getSocket } from "../lib/socket";
import { useAuth } from "../context/AuthContext";
import { Avatar } from "../components/ui/Avatar";
import { MessageBubble, TypingIndicator } from "../components/chat/MessageBubble";
import { MessageInput } from "../components/chat/MessageInput";
import { Button, Input } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { EmptyState } from "../components/ui/EmptyState";
import type { Space, Message, User, DiscoverSpace } from "../lib/types";
import { cn } from "../lib/utils";

export function SpacesPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [activeSpaceId, setActiveSpaceId] = useState<string | null>(searchParams.get("s"));
  const [activeChannelId, setActiveChannelId] = useState<string | null>(searchParams.get("c"));
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState<Record<string, boolean>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [showDiscover, setShowDiscover] = useState(false);
  const [discoverSpaces, setDiscoverSpaces] = useState<DiscoverSpace[]>([]);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newEmoji, setNewEmoji] = useState("💬");
  const [showChannelList, setShowChannelList] = useState(false);
  const [showSpaceList, setShowSpaceList] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadSpaces = useCallback(async () => {
    try {
      const res = await api.getSpaces();
      setSpaces(res.spaces);
      // Auto-select first space/channel if none selected
      if (res.spaces.length > 0 && !activeSpaceId) {
        const first = res.spaces[0];
        setActiveSpaceId(first.id);
        if (first.channels.length > 0) setActiveChannelId(first.channels[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  }, [activeSpaceId]);

  useEffect(() => {
    loadSpaces();
  }, [loadSpaces]);

  // Load messages when channel changes
  useEffect(() => {
    if (!activeSpaceId || !activeChannelId) {
      setMessages([]);
      return;
    }
    api.getChannelMessages(activeSpaceId, activeChannelId)
      .then((res) => setMessages(res.messages))
      .catch(console.error);
    setSearchParams({ s: activeSpaceId, c: activeChannelId });
    setShowChannelList(false);
    setShowSpaceList(false);
  }, [activeSpaceId, activeChannelId, setSearchParams]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Socket.IO real-time
  useEffect(() => {
    const socket = getSocket();

    const onChannelMessage = (data: { channelId: string; message: Message }) => {
      if (data.channelId === activeChannelId) {
        setMessages((prev) => [...prev, data.message]);
      }
    };

    const onTyping = (data: { channelId: string; userId: string; isTyping: boolean }) => {
      if (data.channelId === activeChannelId && data.userId !== user?.id) {
        setTyping((prev) => ({ ...prev, [data.userId]: data.isTyping }));
      }
    };

    socket.on("channel:message", onChannelMessage);
    socket.on("channel:typing", onTyping);

    return () => {
      socket.off("channel:message", onChannelMessage);
      socket.off("channel:typing", onTyping);
    };
  }, [activeChannelId, user?.id]);

  const handleSend = (content: string) => {
    if (!activeChannelId) return;
    const socket = getSocket();
    socket.emit("channel:send", { channelId: activeChannelId, content });
  };

  const handleTyping = (isTyping: boolean) => {
    if (!activeChannelId) return;
    const socket = getSocket();
    socket.emit("channel:typing", { channelId: activeChannelId, isTyping });
  };

  const handleCreateSpace = async () => {
    if (!newName.trim()) return;
    try {
      const res = await api.createSpace(newName, newDesc, newEmoji, "general");
      await loadSpaces();
      setActiveSpaceId(res.space.id);
      if (res.space.channels[0]) setActiveChannelId(res.space.channels[0].id);
      setShowCreate(false);
      setNewName("");
      setNewDesc("");
      setNewEmoji("💬");
    } catch (e) {
      console.error(e);
    }
  };

  const handleDiscover = async () => {
    setShowDiscover(true);
    try {
      const res = await api.discoverSpaces();
      setDiscoverSpaces(res.spaces);
    } catch (e) {
      console.error(e);
    }
  };

  const handleJoin = async (spaceId: string) => {
    try {
      await api.joinSpace(spaceId);
      await loadSpaces();
      setShowDiscover(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddChannel = async (name: string) => {
    if (!activeSpaceId || !name.trim()) return;
    try {
      await api.addChannel(activeSpaceId, name);
      await loadSpaces();
    } catch (e) {
      console.error(e);
    }
  };

  const activeSpace = spaces.find((s) => s.id === activeSpaceId);
  const activeChannel = activeSpace?.channels.find((c) => c.id === activeChannelId);

  // Collect typing users
  const typingUsers: User[] = [];
  if (activeSpace) {
    for (const [uid, isTyping] of Object.entries(typing)) {
      if (isTyping) {
        const m = activeSpace.members.find((m) => m.id === uid);
        if (m) typingUsers.push(m);
      }
    }
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Space list */}
      <div className={`${showSpaceList ? "flex" : "hidden"} lg:flex flex-col w-16 lg:w-60 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0`}>
        <div className="hidden lg:block px-4 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">Spaces</h1>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
          <div className="flex lg:flex-col gap-2">
            {spaces.map((space) => (
              <button
                key={space.id}
                onClick={() => {
                  setActiveSpaceId(space.id);
                  if (space.channels[0]) setActiveChannelId(space.channels[0].id);
                  setShowSpaceList(false);
                }}
                className={cn(
                  "flex items-center gap-2.5 lg:w-full p-2 lg:px-3 rounded-xl transition-colors shrink-0",
                  activeSpaceId === space.id
                    ? "bg-brand-50 dark:bg-brand-950/40"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                )}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ backgroundColor: `${space.emoji === "💬" ? "#6366f1" : "#f3f4f6"}15` }}>
                  {space.emoji}
                </div>
                <div className="hidden lg:block flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{space.name}</p>
                  <p className="text-xs text-slate-400">{space.members.length} members</p>
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className="p-2 space-y-1 border-t border-slate-200 dark:border-slate-800">
          <button onClick={() => setShowCreate(true)} className="hidden lg:flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            Create space
          </button>
          <button onClick={handleDiscover} className="hidden lg:flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
            Discover
          </button>
          <button onClick={() => setShowCreate(true)} className="lg:hidden flex items-center justify-center w-10 h-10 mx-auto rounded-lg bg-brand-600 text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          </button>
        </div>
      </div>

      {/* Channel list */}
      {activeSpace && (
        <div className={`${showChannelList ? "flex" : "hidden"} md:flex flex-col w-48 lg:w-56 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 shrink-0`}>
          <div className="px-4 py-3.5 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <button onClick={() => setShowSpaceList(true)} className="lg:hidden text-slate-400">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              <span className="text-lg">{activeSpace.emoji}</span>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{activeSpace.name}</h2>
            </div>
            {activeSpace.description && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{activeSpace.description}</p>}
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin py-2 px-2">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide px-2 mb-1">Channels</p>
            {activeSpace.channels.map((ch) => (
              <button
                key={ch.id}
                onClick={() => { setActiveChannelId(ch.id); setShowChannelList(false); }}
                className={cn(
                  "flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-sm transition-colors",
                  activeChannelId === ch.id
                    ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-sm font-medium"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                <span className="text-slate-400">#</span>
                {ch.name}
              </button>
            ))}
            <AddChannelButton onAdd={handleAddChannel} />

            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide px-2 mt-4 mb-1">Members</p>
            {activeSpace.members.map((m) => (
              <div key={m.id} className="flex items-center gap-2 px-2.5 py-1.5">
                <Avatar name={m.displayName} color={m.avatarColor} size="xs" online={m.isOnline} />
                <span className="text-sm text-slate-500 dark:text-slate-400 truncate">{m.displayName}</span>
                {m.role === "owner" && <span className="text-[10px] text-brand-500">★</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chat window */}
      <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950">
        {activeChannel ? (
          <>
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              {activeSpace && (
                <button onClick={() => setShowChannelList(true)} className="md:hidden text-slate-400">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
                </button>
              )}
              <span className="text-slate-400 text-lg">#</span>
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{activeChannel.name}</h2>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin py-2">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-slate-400">No messages in this channel yet.</p>
                </div>
              ) : (
                <>
                  {messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} isOwn={msg.senderId === user?.id} />
                  ))}
                  {typingUsers.length > 0 && (
                    <TypingIndicator name={typingUsers.map((u) => u.displayName.split(" ")[0]).join(", ")} />
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>
            <MessageInput onSend={handleSend} onTyping={handleTyping} placeholder={`Message #${activeChannel.name}`} />
          </>
        ) : (
          <EmptyState
            icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /><circle cx="9" cy="7" r="4" /></svg>}
            title="Join or create a space"
            message="Spaces are where communities and teams gather. Create one or discover spaces to join."
            action={<Button onClick={() => setShowCreate(true)}>Create a space</Button>}
          />
        )}
      </div>

      {/* Create space modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create a new space">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Emoji</label>
            <div className="flex gap-2">
              {["💬", "🏠", "🚀", "🎮", "🎵", "📚", "💼", "🌟"].map((e) => (
                <button
                  key={e}
                  onClick={() => setNewEmoji(e)}
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-colors",
                    newEmoji === e ? "bg-brand-100 dark:bg-brand-950 ring-2 ring-brand-500" : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <Input label="Space name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Design Team" />
          <Input label="Description (optional)" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="What's this space about?" />
          <Button onClick={handleCreateSpace} disabled={!newName.trim()} className="w-full">Create space</Button>
        </div>
      </Modal>

      {/* Discover modal */}
      <Modal open={showDiscover} onClose={() => setShowDiscover(false)} title="Discover spaces" className="max-w-lg">
        <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
          {discoverSpaces.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No spaces available to join</p>
          ) : (
            discoverSpaces.map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/50 flex items-center justify-center text-lg">{s.emoji}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{s.name}</p>
                  <p className="text-xs text-slate-400">{s.description || "No description"} · {s._count.members} members</p>
                </div>
                <Button size="sm" onClick={() => handleJoin(s.id)}>Join</Button>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
}

function AddChannelButton({ onAdd }: { onAdd: (name: string) => void }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  if (!adding) {
    return (
      <button
        onClick={() => setAdding(true)}
        className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
      >
        <span>+</span> Add channel
      </button>
    );
  }

  return (
    <div className="flex gap-1 px-1 py-1">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && name.trim()) {
            onAdd(name);
            setName("");
            setAdding(false);
          }
          if (e.key === "Escape") setAdding(false);
        }}
        onBlur={() => { if (!name.trim()) setAdding(false); }}
        placeholder="channel name"
        className="flex-1 text-sm px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
      <button onClick={() => { if (name.trim()) { onAdd(name); setName(""); setAdding(false); } }} className="text-brand-500 text-sm px-1">✓</button>
    </div>
  );
}
