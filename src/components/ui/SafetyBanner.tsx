import { cn } from "@/lib/utils";

type SafetyTone = "info" | "warn" | "alert";

type SafetyBannerProps = {
  tone?: SafetyTone;
  title: string;
  body: string;
  className?: string;
};

const tones: Record<SafetyTone, { shell: string; bar: string }> = {
  info: { shell: "border-[#D9CDB4] bg-[#EFE9DC]", bar: "bg-clay" },
  warn: { shell: "border-[#E2C9AB] bg-[#F4E4D5]", bar: "bg-amber" },
  alert: { shell: "border-[#E2A9A4] bg-[#F2D7D5]", bar: "bg-alert" },
};

export function SafetyBanner({ tone = "info", title, body, className }: SafetyBannerProps) {
  return (
    <div className={cn("relative overflow-hidden rounded-xl border p-4 pl-5", tones[tone].shell, className)}>
      <span className={cn("absolute inset-y-0 left-0 w-[3px]", tones[tone].bar)} />
      <p className="font-body text-xs font-semibold text-ink">{title}</p>
      <p className="mt-1 font-body text-xs leading-snug text-ink2">{body}</p>
    </div>
  );
}
