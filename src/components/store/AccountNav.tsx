"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/api";
import { useStore } from "./StoreProvider";
import { ACCOUNT_LINKS } from "./account-links";

export { ACCOUNT_LINKS };

export function AccountNav({ name }: { name: string }) {
  const path = usePathname();
  const { logout } = useStore();

  return (
    <aside>
      <p className="mb-3 hidden font-display text-2xl lg:block">
        Hi, {name.split(" ")[0]}
      </p>

      <nav
        aria-label="Account"
        className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:px-0"
      >
        {ACCOUNT_LINKS.map(([href, label]) => (
          <Link
            key={href}
            href={href}
            aria-current={path === href ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-full px-4 py-2.5 text-[15px] font-medium lg:rounded-2xl",
              path === href
                ? "bg-brand-500 text-white"
                : "hover:bg-blush"
            )}
          >
            {label}
          </Link>
        ))}

        <button
          onClick={logout}
          className="shrink-0 rounded-full px-4 py-2.5 text-left text-[15px] font-medium text-muted hover:bg-blush lg:rounded-2xl"
        >
          Log out
        </button>
      </nav>
    </aside>
  );
}
