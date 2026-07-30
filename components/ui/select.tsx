import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select className={cn("h-10 w-full appearance-none rounded-lg border border-input bg-background px-3 pr-9 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring", className)} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-3 size-4 text-muted-foreground" />
    </div>
  );
}
