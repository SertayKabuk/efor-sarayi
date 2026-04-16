import type {
  ComponentType,
  InputHTMLAttributes,
  SVGProps,
} from "react";
import { cx } from "@/utils/cx";

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  icon?: IconType;
  wrapperClassName?: string;
}

const inputClasses =
  "block w-full rounded-xl border border-primary bg-primary px-3.5 py-3 text-sm text-primary shadow-xs transition placeholder:text-placeholder outline-hidden hover:border-primary focus:border-brand focus:outline-2 focus:-outline-offset-2 focus:outline-brand disabled:cursor-not-allowed disabled:opacity-50";

export default function Input({
  error,
  hint,
  icon: Icon,
  id,
  label,
  wrapperClassName,
  className,
  ...props
}: InputProps) {
  const inputId = id ?? props.name;

  return (
    <div className={cx("space-y-1.5", wrapperClassName)}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-primary">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-quaternary" />
        )}
        <input
          id={inputId}
          className={cx(inputClasses, Icon && "pl-11", className)}
          {...props}
        />
      </div>
      {error ? (
        <p className="text-sm font-medium text-error-primary">{error}</p>
      ) : hint ? (
        <p className="text-sm text-tertiary">{hint}</p>
      ) : null}
    </div>
  );
}
