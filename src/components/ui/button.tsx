import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ct/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-neon text-on-neon hover:bg-neon-dim shadow-[0_8px_20px_-8px_color-mix(in_oklab,var(--color-neon)_70%,transparent)] active:translate-y-px",
        secondary: "bg-surface text-fg border border-glass-edge shadow-glass hover:bg-surface-2",
        ghost: "text-muted hover:text-fg hover:bg-fg/5",
        outline: "border border-line-strong text-fg hover:border-neon/50 hover:text-neon",
        violet: "bg-violet/12 text-violet border border-violet/30 hover:bg-violet/20",
        danger: "bg-danger/10 text-danger border border-danger/25 hover:bg-danger/20",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-11 px-5 text-sm rounded-2xl",
        icon: "size-9",
      },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export function Button({ className, variant, size, asChild, loading, children, disabled, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp className={cn(buttonVariants({ variant, size }), className)} disabled={disabled || loading} {...props}>
      {asChild ? (
        children
      ) : (
        <>
          {loading && <Loader2 className="animate-spin" />}
          {children}
        </>
      )}
    </Comp>
  );
}

export { buttonVariants };
