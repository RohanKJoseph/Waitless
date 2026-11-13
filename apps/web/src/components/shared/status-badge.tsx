import { APPOINTMENT_STATUS_META, type AppointmentStatus, type BadgeTone } from "@waitless/shared";
import { Badge, type BadgeProps } from "@/components/ui/badge";

const TONE_TO_VARIANT: Record<BadgeTone, NonNullable<BadgeProps["variant"]>> = {
  neutral: "neutral",
  muted: "muted",
  info: "info",
  success: "success",
  warning: "warning",
  danger: "danger",
};

export function StatusBadge({
  status,
  className,
  withDot = false,
}: {
  status: AppointmentStatus;
  className?: string;
  withDot?: boolean;
}) {
  const meta = APPOINTMENT_STATUS_META[status];
  return (
    <Badge variant={TONE_TO_VARIANT[meta.tone]} className={className}>
      {withDot && <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />}
      {meta.label}
    </Badge>
  );
}
