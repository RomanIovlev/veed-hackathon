import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "error" | "active";

interface StatusBadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-secondary text-secondary-foreground",
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  error: "bg-rose-100 text-rose-700",
  active: "bg-accent text-accent-foreground",
};

export function StatusBadge({ children, variant = "default" }: StatusBadgeProps) {
  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium", variantClasses[variant])}>
      {children}
    </span>
  );
}
