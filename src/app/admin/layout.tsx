"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Calendar, Scan, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const navItems = [
        { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
        { href: "/admin/events", icon: Calendar, label: "Eventos" },
        { href: "/admin/scanner", icon: Scan, label: "Escanear QR" },
        { href: "/admin/settings", icon: Settings, label: "Configuración" },
    ];

    return (
        <div className="flex min-h-screen bg-slate-100">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col">
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

                <div className="p-4 mt-auto border-t border-white/5">
                    <button className="flex items-center gap-3 w-full p-4 text-slate-500 hover:text-white transition-colors">
                        <LogOut className="w-5 h-5" />
                        <span className="font-bold">Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            <main className="flex-1 p-10 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
