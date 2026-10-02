import { EmptyState } from "../components/ui/EmptyState";
import { Button } from "../components/ui/Button";

export function LivePage() {
  return (
    <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <EmptyState
        icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>}
        title="Live is coming soon"
        message="Voice and video calls, screen sharing, and live rooms are part of the next release. Stay tuned!"
        action={<Button variant="secondary" onClick={() => {}}>Get notified</Button>}
      />
    </div>
  );
}
