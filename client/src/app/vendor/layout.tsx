"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useVendorStore } from "@/store/vendorStore";
import {
  Building2,
  LayoutDashboard,
  FileText,
  ClipboardCheck,
  LogOut,
} from "lucide-react";

const publicPaths = ["/vendor/login", "/vendor/register"];

const navItems = [
  { href: "/vendor/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vendor/templates", label: "Policy Templates", icon: FileText },
  { href: "/vendor/applications", label: "Applications", icon: ClipboardCheck },
];

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { vendor, token, loadVendor, logout } = useVendorStore();

  const isPublicPage = publicPaths.includes(pathname);

  useEffect(() => {
    if (!isPublicPage && token) {
      loadVendor();
    }
  }, [isPublicPage, token, loadVendor]);

  useEffect(() => {
    if (!isPublicPage && !token) {
      router.replace("/vendor/login");
    }
  }, [isPublicPage, token, router]);

  // Public pages (login/register) — no sidebar
  if (isPublicPage) {
    return <>{children}</>;
  }

  // Authenticated vendor layout
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-white flex flex-col">
        <div className="flex h-16 items-center gap-2 px-6 border-b">
          <Building2 className="h-7 w-7 text-indigo-600" />
          <span className="text-lg font-bold">Vendor Portal</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/vendor/dashboard"
                ? pathname === "/vendor/dashboard"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Vendor info + logout */}
        <div className="border-t p-3 space-y-2">
          {vendor && (
            <div className="px-3 py-1">
              <p className="text-sm font-medium truncate">{vendor.companyName}</p>
              <p className="text-xs text-gray-400 truncate">{vendor.email}</p>
            </div>
          )}
          <button
            onClick={() => {
              logout();
              router.replace("/vendor/login");
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 flex-1 p-8 bg-gray-50 min-h-screen">{children}</main>
    </div>
  );
}

