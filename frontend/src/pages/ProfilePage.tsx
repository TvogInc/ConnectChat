import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Avatar } from "../components/ui/Avatar";
import { Button, Input, TextArea } from "../components/ui/Button";
import { formatTime } from "../lib/utils";

const avatarColors = ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ef4444", "#14b8a6", "#f97316", "#64748b"];

export function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [status, setStatus] = useState("");
  const [avatarColor, setAvatarColor] = useState("#6366f1");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName);
      setBio(user.bio || "");
      setPronouns(user.pronouns || "");
      setStatus(user.status || "");
      setAvatarColor(user.avatarColor);
    }
  }, [user]);

  if (!user) return null;

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await api.updateProfile({ displayName, bio, pronouns, status, avatarColor });
      updateUser(res.user);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Your Profile</h1>

        {/* Profile preview card */}
        <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-6 mb-6">
          <div className="flex items-center gap-4">
            <Avatar name={displayName || user.displayName} color={avatarColor} size="xl" online={user.isOnline} />
            <div className="text-white">
              <h2 className="text-xl font-bold">{displayName || user.displayName}</h2>
              <p className="text-brand-100 text-sm">@{user.handle}</p>
              <p className="text-brand-200 text-sm mt-1">{status || user.status}</p>
              {pronouns && <p className="text-brand-300 text-xs mt-0.5">{pronouns}</p>}
            </div>
          </div>
          {bio && <p className="text-brand-100 text-sm mt-3">{bio}</p>}
        </div>

        {/* Edit form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Avatar color</label>
            <div className="flex flex-wrap gap-2">
              {avatarColors.map((color) => (
                <button
                  key={color}
                  onClick={() => setAvatarColor(color)}
                  className={`w-9 h-9 rounded-full transition-transform ${avatarColor === color ? "ring-2 ring-offset-2 ring-brand-500 ring-offset-slate-50 dark:ring-offset-slate-950 scale-110" : "hover:scale-105"}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <Input label="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" />
          <Input label="Pronouns" value={pronouns} onChange={(e) => setPronouns(e.target.value)} placeholder="e.g. she/her, he/him, they/them" />
          <Input label="Status" value={status} onChange={(e) => setStatus(e.target.value)} placeholder="What's on your mind?" />
          <TextArea label="Bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell people about yourself" rows={3} />

          <div className="flex items-center gap-3 pt-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
            {saved && <span className="text-sm text-green-600 dark:text-green-400">✓ Saved successfully</span>}
          </div>
        </div>

        {/* Account info */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Account</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Email</span>
              <span className="text-slate-700 dark:text-slate-300">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Handle</span>
              <span className="text-slate-700 dark:text-slate-300">@{user.handle}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Member since</span>
              <span className="text-slate-700 dark:text-slate-300">{user.createdAt ? formatTime(user.createdAt) : "Recently"}</span>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Button variant="danger" onClick={logout}>Log out</Button>
        </div>
      </div>
    </div>
  );
}
