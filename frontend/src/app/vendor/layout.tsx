"use client";

import { VendorSidebar } from "@/components/layout/vendor-sidebar";
import { useAuthStore } from "@/store/auth-store";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const PUBLIC_VENDOR_PATHS = ["/vendor/login", "/vendor/register"];

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isVendor } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isPublicPage = PUBLIC_VENDOR_PATHS.includes(pathname);

  useEffect(() => {
    if (mounted && !isPublicPage && (!isAuthenticated || !isVendor)) {
      router.push("/vendor/login");
    }
  }, [mounted, isAuthenticated, isVendor, isPublicPage, router]);

  if (isPublicPage) {
    return <>{children}</>;
  }

  if (!mounted || !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:block">
        <VendorSidebar />
      </div>

      <Sheet>
        <SheetTrigger asChild className="fixed left-4 top-4 z-50 lg:hidden">
          <Button variant="outline" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <VendorSidebar />
        </SheetContent>
      </Sheet>

      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
