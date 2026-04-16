import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ComponentType,
  type SVGProps,
} from "react";
import Spinner from "@/components/ui/Spinner";
import { cx } from "@/utils/cx";

export type ButtonTone =
  | "primary"
  | "secondary"
  | "tertiary"
  | "destructive"
  | "success";
export type ButtonSize = "sm" | "md" | "lg";
type IconType = ComponentType<SVGProps<SVGSVGElement>>;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: ButtonTone;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  iconLeading?: IconType;
  iconTrailing?: IconType;
}

const toneClasses: Record<ButtonTone, string> = {
  primary:
    "border border-brand bg-brand-solid text-primary_on-brand shadow-xs-skeuomorphic hover:bg-brand-solid_hover",
  secondary:
    "border border-primary bg-primary text-primary shadow-xs hover:bg-secondary",
  tertiary: "bg-transparent text-secondary hover:bg-secondary hover:text-primary",
  destructive:
    "border border-error_subtle bg-error-primary text-error-primary hover:bg-error-secondary",
  success:
    "border border-green-200 bg-success-primary text-success-primary hover:bg-success-secondary dark:border-green-900",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-10 rounded-xl px-3.5 text-sm",
  md: "min-h-11 rounded-xl px-4 text-sm",
  lg: "min-h-12 rounded-2xl px-5 text-sm",
};

export const buttonStyles = ({
  tone = "primary",
  size = "md",
  fullWidth = false,
  iconOnly = false,
  className,
}: {
  tone?: ButtonTone;
  size?: ButtonSize;
  fullWidth?: boolean;
  iconOnly?: boolean;
  className?: string;
}) =>
  cx(
    "inline-flex items-center justify-center gap-2 font-semibold transition duration-150 outline-hidden focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand disabled:pointer-events-none disabled:opacity-50",
    toneClasses[tone],
    sizeClasses[size],
    fullWidth && "w-full",
    iconOnly && {
      sm: "w-10 px-0",
      md: "w-11 px-0",
      lg: "w-12 px-0",
    }[size],
    className,
  );

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    children,
    className,
    disabled,
    fullWidth,
    iconLeading: IconLeading,
    iconTrailing: IconTrailing,
    loading = false,
    size = "md",
    tone = "primary",
    type = "button",
    ...props
  },
  ref,
) {
  const iconOnly = Boolean(!children && (IconLeading || IconTrailing || loading));

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={buttonStyles({
        tone,
        size,
        fullWidth,
        iconOnly,
        className,
      })}
      {...props}
    >
      {loading ? (
        <Spinner size="sm" className="text-current" />
      ) : (
        IconLeading && <IconLeading className="size-5 shrink-0" />
      )}
      {children}
      {!loading && IconTrailing && <IconTrailing className="size-5 shrink-0" />}
    </button>
  );
});

export default Button;
