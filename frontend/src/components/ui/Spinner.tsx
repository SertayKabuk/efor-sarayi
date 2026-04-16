import { cx } from "@/utils/cx";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "size-4 border-2",
  md: "size-5 border-2",
  lg: "size-8 border-[3px]",
} as const;

export default function Spinner({ size = "md", className }: SpinnerProps) {
  return (
    <span
      className={cx(
        "inline-block animate-spin rounded-full border-current border-t-transparent text-brand-primary",
        sizeClasses[size],
        className,
      )}
      aria-hidden="true"
    />
  );
}
