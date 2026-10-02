import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { getSocket } from "../lib/socket";
import { useAuth } from "../context/AuthContext";
import { Avatar } from "../components/ui/Avatar";
import { MessageBubble, TypingIndicator } from "../components/chat/MessageBubble";
import { MessageInput } from "../components/chat/MessageInput";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { EmptyState } from "../components/ui/EmptyState";
import type { DirectChannel, Message, User } from "../lib/types";
import { formatTime } from "../lib/utils";

export function ChatsPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [channels, setChannels] = useState<DirectChannel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(searchParams.get("dm"));
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState<Record<string, boolean>>({});
  const [showNewChat, setShowNewChat] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [showMobileList, setShowMobileList] = useState(!searchParams.get("dm"));
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Load channels
  const loadChannels = useCallback(async () => {
    try {
      const res = await api.getDirectChannels();
      setChannels(res.channels);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    loadChannels();
  }, [loadChannels]);

  // Load users for new chat modal
  useEffect(() => {
    if (showNewChat) {
      api.getAllUsers().then((res) => setUsers(res.users)).catch(console.error);
    }
  }, [showNewChat]);

  // Load messages for active channel
  useEffect(() => {
    if (!activeChannelId) {
      setMessages([]);
      return;
    }
    api.getDirectMessages(activeChannelId).then((res) => setMessages(res.messages)).catch(console.error);
    setSearchParams({ dm: activeChannelId });
    setShowMobileList(false);
  }, [activeChannelId, setSearchParams]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Socket.IO real-time
  useEffect(() => {
    const socket = getSocket();

    const onDmMessage = (data: { channelId: string; message: Message }) => {
      if (data.channelId === activeChannelId) {
        setMessages((prev) => [...prev, data.message]);
      }
      loadChannels();
    };

    const onTyping = (data: { channelId: string; userId: string; isTyping: boolean }) => {
      if (data.channelId === activeChannelId && data.userId !== user?.id) {
        setTyping((prev) => ({ ...prev, [data.userId]: data.isTyping }));
      }
    };

    socket.on("dm:message", onDmMessage);
    socket.on("dm:typing", onTyping);

    return () => {
      socket.off("dm:message", onDmMessage);
      socket.off("dm:typing", onTyping);
    };
  }, [activeChannelId, user?.id, loadChannels]);

  const handleSend = (content: string) => {
    if (!activeChannelId) return;
    const socket = getSocket();
    socket.emit("dm:send", { channelId: activeChannelId, content });
  };

  const handleTyping = (isTyping: boolean) => {
    if (!activeChannelId) return;
    const socket = getSocket();
    socket.emit("dm:typing", { channelId: activeChannelId, isTyping });
  };

  const startChat = async (userId: string) => {
    try {
      const res = await api.createDirectChannel(userId);
      await loadChannels();
      setActiveChannelId(res.channel.id);
      setShowNewChat(false);
    } catch (e) {
      console.error(e);
    }
  };

  const activeChannel = channels.find((c) => c.id === activeChannelId);
  const activeTyping = Object.entries(typing).filter(([, v]) => v);

  return (
    <div className="flex h-full overflow-hidden">
      {/* DM List */}
      <div className={`${showMobileList ? "flex" : "hidden"} md:flex flex-col w-full md:w-72 lg:w-80 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900`}>
        <div className="px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">Chats</h1>
          <button
            onClick={() => setShowNewChat(true)}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {channels.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-slate-400 mb-3">No conversations yet</p>
              <Button size="sm" onClick={() => setShowNewChat(true)}>Start a chat</Button>
            </div>
          ) : (
            channels.map((ch) => (
              <button
                key={ch.id}
                onClick={() => setActiveChannelId(ch.id)}
                className={`flex items-center gap-3 w-full px-3 py-2.5 transition-colors text-left ${
                  activeChannelId === ch.id
                    ? "bg-brand-50 dark:bg-brand-950/40"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
              >
                <Avatar name={ch.otherUser.displayName} color={ch.otherUser.avatarColor} size="md" online={ch.otherUser.isOnline} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{ch.otherUser.displayName}</span>
                    {ch.lastMessage && (
                      <span className="text-[11px] text-slate-400 shrink-0">{formatTime(ch.lastMessage.createdAt)}</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                    {ch.lastMessage ? `${ch.lastMessage.sender.id === user?.id ? "You: " : ""}${ch.lastMessage.content}` : "No messages yet"}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat window */}
      <div className={`${showMobileList ? "hidden" : "flex"} flex-col flex-1 bg-slate-50 dark:bg-slate-950`}>
        {activeChannel ? (
          <>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <button onClick={() => setShowMobileList(true)} className="md:hidden text-slate-400">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              <Avatar name={activeChannel.otherUser.displayName} color={activeChannel.otherUser.avatarColor} size="sm" online={activeChannel.otherUser.isOnline} />
              <div>
                <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{activeChannel.otherUser.displayName}</h2>
                <p className="text-xs text-slate-400">{activeChannel.otherUser.isOnline ? "Online" : "Offline"}</p>
              </div>
            </div>
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto scrollbar-thin py-2">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-slate-400">No messages yet. Say hello! 👋</p>
                </div>
              ) : (
                <>
                  {messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} isOwn={msg.senderId === user?.id} />
                  ))}
                  {activeTyping.map(([uid]) => {
                    const ch = channels.find((c) => c.id === activeChannelId);
                    if (!ch) return null;
                    return <TypingIndicator key={uid} name={ch.otherUser.displayName} />;
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>
            <MessageInput onSend={handleSend} onTyping={handleTyping} />
          </>
        ) : (
          <EmptyState
            icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>}
            title="Select a conversation"
            message="Choose a chat from the list or start a new one to begin messaging."
            action={<Button onClick={() => setShowNewChat(true)}>Start a new chat</Button>}
          />
        )}
      </div>

      {/* New chat modal */}
      <Modal open={showNewChat} onClose={() => setShowNewChat(false)} title="Start a new chat">
        <div className="space-y-1 max-h-80 overflow-y-auto scrollbar-thin">
          {users.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No other users yet</p>
          ) : (
            users.map((u) => (
              <button
                key={u.id}
                onClick={() => startChat(u.id)}
                className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
              >
                <Avatar name={u.displayName} color={u.avatarColor} size="md" online={u.isOnline} />
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{u.displayName}</p>
                  <p className="text-xs text-slate-400">@{u.handle}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
}
