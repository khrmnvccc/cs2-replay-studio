import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-neon/70 focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-neon text-black hover:bg-[#c6ff5c] shadow-[0_0_0_1px_rgba(180,255,46,0.4),0_10px_30px_-10px_rgba(180,255,46,0.6)] hover:shadow-[0_0_0_1px_rgba(180,255,46,0.6),0_14px_40px_-10px_rgba(180,255,46,0.75)] active:translate-y-px",
        secondary: "bg-surface-3 text-fg border border-line-strong hover:bg-[#21262c] hover:border-white/20",
        ghost: "text-muted hover:text-fg hover:bg-white/5",
        outline: "border border-line-strong text-fg hover:border-neon/50 hover:text-neon",
        violet: "bg-violet/15 text-[#c4b5ff] border border-violet/30 hover:bg-violet/25",
        danger: "bg-danger/10 text-danger border border-danger/25 hover:bg-danger/20",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-[15px]",
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
