import { Badge } from "@/components/ui";

/** Account state: dot + label, never colour alone. Disabled wins over everything else. */
export function StatusBadge({ user }) {
  if (user.disabled_at) return <Badge tone="bad">Disabled</Badge>;
  if (!user.is_verified) return <Badge tone="warn">Unverified</Badge>;
  return <Badge tone="good">Active</Badge>;
}
