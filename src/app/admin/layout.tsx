"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Calendar, Scan, Settings, LogOut, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [role, setRole] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function checkAccess() {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push("/login");
                return;
            }

            const { data: profile } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", session.user.id)
                .single();

            const userRole = profile?.role;
            setRole(userRole);

            if (userRole === "CUSTOMER") {
                router.push("/");
            } else if (userRole === "SCANNER" && pathname !== "/admin/scanner") {
                router.push("/admin/scanner");
            } else {
                setIsLoading(false);
            }
        }
        checkAccess();
    }, [pathname, router]);

    const navItems = [
        { href: "/admin", icon: LayoutDashboard, label: "Dashboard", allowed: ["ADMIN", "SUPERADMIN"] },
        { href: "/admin/events", icon: Calendar, label: "Eventos", allowed: ["ADMIN", "SUPERADMIN"] },
        { href: "/admin/stats", icon: BarChart3, label: "Estadísticas", allowed: ["ADMIN", "SUPERADMIN"] },
        { href: "/admin/scanner", icon: Scan, label: "Escanear QR", allowed: ["ADMIN", "SUPERADMIN", "SCANNER"] },
        { href: "/admin/settings", icon: Settings, label: "Config", allowed: ["ADMIN", "SUPERADMIN"] },
    ].filter(item => item.allowed.includes(role || ""));

    if (isLoading) return <div className="min-h-screen bg-slate-100 flex items-center justify-center"><div className="animate-pulse font-bold text-slate-400">Verificando accesos...</div></div>;

    return (
        <div className="flex min-h-screen bg-slate-100">
            {/* Sidebar - desktop only */}
            <aside className="hidden md:flex w-64 bg-slate-900 text-white flex-col">
                <div className="p-8">
                    <h2 className="text-2xl font-black tracking-tight text-blue-400">ADMIN <span className="text-white">U-T</span></h2>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 p-4 rounded-xl transition-all duration-200",
                                    isActive
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                                )}
                            >
                                <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-slate-500")} />
                                <span className="font-bold">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            {/* Main content */}
            <main className="flex-1 p-4 md:p-10 overflow-y-auto pb-24 md:pb-10">
                {children}
            </main>

            {/* Bottom nav bar - mobile only */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-white/10 flex items-center justify-around px-2 py-3 z-50">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all",
                                isActive ? "text-blue-400" : "text-slate-500"
                            )}
                        >
                            <item.icon className="w-6 h-6" />
                            <span className="text-[10px] font-bold">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
