import { getInitials, cn } from "../../lib/utils";

export function Avatar({
  name,
  color,
  size = "md",
  online,
  className,
}: {
  name: string;
  color: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  online?: boolean;
  className?: string;
}) {
  const sizes = {
    xs: "w-6 h-6 text-xs",
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-20 h-20 text-2xl",
  };
  const dotSizes = {
    xs: "w-2 h-2",
    sm: "w-2.5 h-2.5",
    md: "w-3 h-3",
    lg: "w-3.5 h-3.5",
    xl: "w-5 h-5",
  };

  return (
    <div className={cn("relative shrink-0", className)}>
      <div
        className={cn("rounded-full flex items-center justify-center font-semibold text-white shrink-0", sizes[size])}
        style={{ backgroundColor: color }}
      >
        {getInitials(name)}
      </div>
      {online !== undefined && (
        <div
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-2 border-white dark:border-slate-950",
            dotSizes[size],
            online ? "bg-green-500" : "bg-slate-400"
          )}
        />
      )}
    </div>
  );
}
