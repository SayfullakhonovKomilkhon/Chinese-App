import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center font-medium transition-colors duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:pointer-events-none disabled:opacity-50 rounded-xl",
  {
    variants: {
      variant: {
        default: "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm hover:shadow-md",
        destructive: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm hover:shadow-md",
        outline: "border-2 border-slate-300 bg-white text-slate-800 hover:bg-slate-50 hover:border-blue-400 hover:text-blue-800",
        secondary: "bg-slate-100 text-slate-800 hover:bg-slate-200 active:bg-slate-300 border border-slate-300",
        ghost: "text-slate-800 hover:bg-slate-100 hover:text-slate-900",
        link: "text-blue-700 underline-offset-4 hover:underline hover:text-blue-800",
        success: "bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-sm hover:shadow-md",
        warning: "bg-amber-600 text-white hover:bg-amber-700 active:bg-amber-800 shadow-sm hover:shadow-md",
        purple: "bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800 shadow-sm hover:shadow-md",
        pink: "bg-pink-600 text-white hover:bg-pink-700 active:bg-pink-800 shadow-sm hover:shadow-md",
        cyan: "bg-cyan-600 text-white hover:bg-cyan-700 active:bg-cyan-800 shadow-sm hover:shadow-md",
      },
      size: {
        default: "h-11 px-6 py-3",
        sm: "h-9 px-4 py-2 text-sm",
        lg: "h-12 px-8 py-3 text-base",
        xl: "h-14 px-10 py-4 text-lg",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants } 