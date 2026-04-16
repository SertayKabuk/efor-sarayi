import type { SelectHTMLAttributes } from "react";
import { cx } from "@/utils/cx";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  wrapperClassName?: string;
}

export default function Select({
  children,
  className,
  error,
  hint,
  id,
  label,
  wrapperClassName,
  ...props
}: SelectProps) {
  const selectId = id ?? props.name;

  return (
    <div className={cx("space-y-1.5", wrapperClassName)}>
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-primary">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cx(
          "block w-full rounded-xl border border-primary bg-primary px-3.5 py-3 text-sm text-primary shadow-xs transition outline-hidden hover:border-primary focus:border-brand focus:outline-2 focus:-outline-offset-2 focus:outline-brand disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error ? (
        <p className="text-sm font-medium text-error-primary">{error}</p>
      ) : hint ? (
        <p className="text-sm text-tertiary">{hint}</p>
      ) : null}
    </div>
  );
}
