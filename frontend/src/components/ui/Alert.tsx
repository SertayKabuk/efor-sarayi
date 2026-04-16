import type { HTMLAttributes } from "react";
import { cx } from "@/utils/cx";

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  tone?: "error" | "warning" | "success" | "info";
}

const toneClasses = {
  error: "border border-error_subtle bg-error-primary text-error-primary",
  warning:
    "border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  success:
    "border border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300",
  info: "border border-brand bg-brand-primary text-brand-secondary",
} as const;

export default function Alert({
  className,
  tone = "info",
  ...props
}: AlertProps) {
  return (
    <div
      className={cx(
        "rounded-2xl px-4 py-3 text-sm font-medium shadow-xs",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
