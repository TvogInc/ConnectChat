import type { Message } from "../../lib/types";
import { Avatar } from "../ui/Avatar";
import { formatMessageTime, cn } from "../../lib/utils";

export function MessageBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
  return (
    <div className={cn("flex gap-2.5 px-4 py-1 hover:bg-slate-50 dark:hover:bg-slate-900/50 group", isOwn && "flex-row-reverse")}>
      <Avatar name={message.sender.displayName} color={message.sender.avatarColor} size="sm" className="mt-0.5" />
      <div className={cn("flex flex-col max-w-[70%]", isOwn && "items-end")}>
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{message.sender.displayName}</span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">{formatMessageTime(message.createdAt)}</span>
        </div>
        <div
          className={cn(
            "px-3.5 py-2 rounded-2xl text-sm leading-relaxed break-words",
            isOwn
              ? "bg-brand-600 text-white rounded-br-md"
              : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-md"
          )}
        >
          {message.content}
        </div>
      </div>
    </div>
  );
}

export function TypingIndicator({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-1 text-xs text-slate-400 dark:text-slate-500">
      <span className="flex gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse-dot" />
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse-dot" style={{ animationDelay: "0.2s" }} />
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse-dot" style={{ animationDelay: "0.4s" }} />
      </span>
      <span>{name} is typing…</span>
    </div>
  );
}
