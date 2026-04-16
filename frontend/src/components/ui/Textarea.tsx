import type { TextareaHTMLAttributes } from "react";
import { cx } from "@/utils/cx";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  wrapperClassName?: string;
}

export default function Textarea({
  className,
  error,
  hint,
  id,
  label,
  wrapperClassName,
  ...props
}: TextareaProps) {
  const textareaId = id ?? props.name;

  return (
    <div className={cx("space-y-1.5", wrapperClassName)}>
      {label && (
        <label htmlFor={textareaId} className="block text-sm font-medium text-primary">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={cx(
          "block min-h-28 w-full rounded-xl border border-primary bg-primary px-3.5 py-3 text-sm text-primary shadow-xs transition placeholder:text-placeholder outline-hidden hover:border-primary focus:border-brand focus:outline-2 focus:-outline-offset-2 focus:outline-brand disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
      {error ? (
        <p className="text-sm font-medium text-error-primary">{error}</p>
      ) : hint ? (
        <p className="text-sm text-tertiary">{hint}</p>
      ) : null}
    </div>
  );
}
