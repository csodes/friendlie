import Link from "next/link";
import { cn } from "@/lib/utils";

/** Friendlie wordmark. Two overlapping circles = a platonic connection. */
export function Logo({
  className,
  href = "/",
}: {
  className?: string;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className={cn("flex items-center gap-2 font-semibold", className)}
    >
      <span className="relative inline-flex h-7 w-10 items-center">
        <span className="absolute left-0 h-6 w-6 rounded-full bg-primary" />
        <span className="absolute left-3 h-6 w-6 rounded-full bg-sunshine/80 mix-blend-multiply" />
      </span>
      <span className="text-lg tracking-tight">Friendlie</span>
    </Link>
  );
}
