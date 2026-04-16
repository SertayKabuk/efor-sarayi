import type { ReactNode } from "react";
import { Dialog, Modal, ModalOverlay } from "react-aria-components";
import { XClose } from "@untitledui/icons";
import { cx } from "@/utils/cx";

interface ModalDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode | ((close: () => void) => ReactNode);
  footer?: ReactNode | ((close: () => void) => ReactNode);
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "max-w-lg",
  md: "max-w-2xl",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
} as const;

export default function ModalDialog({
  children,
  description,
  footer,
  isOpen,
  onOpenChange,
  size = "lg",
  title,
}: ModalDialogProps) {
  return (
    <ModalOverlay
      isDismissable
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4 backdrop-blur-sm"
    >
      <Modal className={cx("w-full", sizeClasses[size])}>
        <Dialog className="overflow-hidden rounded-3xl border border-secondary bg-primary shadow-xl outline-hidden">
          {({ close }) => (
            <>
              <div className="flex items-start gap-4 border-b border-secondary px-6 py-5">
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-semibold text-primary">{title}</h2>
                  {description && (
                    <p className="mt-1 text-sm text-secondary">{description}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={close}
                  className="inline-flex size-10 items-center justify-center rounded-xl text-quaternary transition hover:bg-secondary hover:text-primary"
                  aria-label="Close dialog"
                >
                  <XClose className="size-5" />
                </button>
              </div>
              <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
                {typeof children === "function" ? children(close) : children}
              </div>
              {footer && (
                <div className="flex flex-wrap items-center justify-end gap-3 border-t border-secondary bg-secondary px-6 py-4">
                  {typeof footer === "function" ? footer(close) : footer}
                </div>
              )}
            </>
          )}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
