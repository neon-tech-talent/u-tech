"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { LogOut, Ticket, Settings, User, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

export default function Navbar() {
    const router = useRouter();
    const [session, setSession] = useState<any>(null);
    const [role, setRole] = useState<string | null>(null);

    useEffect(() => {
        // Initial session check
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session?.user) fetchUserRole(session.user.id);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session?.user) {
                fetchUserRole(session.user.id);
            } else {
                setRole(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const { theme, toggleTheme } = useTheme();

    async function fetchUserRole(userId: string) {
        const { data } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", userId)
            .single();
        if (data) setRole(data.role);
    }

    async function handleSignOut() {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    }

    return (
        <nav className="bg-[var(--nav-bg)] backdrop-blur-xl border-b border-white/5 sticky top-0 z-50 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-12 h-16 md:h-20 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="bg-blue-600 text-white p-1.5 md:p-2 rounded-xl group-hover:rotate-12 transition-all shadow-lg shadow-blue-600/20">
                        <Ticket className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <span className="text-xl md:text-2xl font-black tracking-tighter text-[var(--text-primary)] group-hover:text-blue-500 transition-colors">U-Ticket</span>
                </Link>

                <div className="flex items-center gap-1 md:gap-4">
                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-blue-500 hover:bg-blue-500/10 transition-all mr-1"
                        title={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
                    >
                        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>

                    {session ? (
                        <>
                            {role !== 'SCANNER' && role !== 'ADMIN' && (
                                <Link
                                    href="/my-tickets"
                                    className="flex flex-col items-center justify-center p-2 rounded-xl text-[var(--text-secondary)] hover:text-blue-500 hover:bg-blue-500/10 transition-all"
                                >
                                    <Ticket className="w-5 h-5" />
                                    <span className="hidden md:block text-[10px] font-black uppercase tracking-widest mt-1">Mis Tickets</span>
                                </Link>
                            )}

                            {(role === 'ADMIN' || role === 'SUPERADMIN' || role === 'SCANNER') && (
                                <Link
                                    href={role === 'SCANNER' ? "/admin/scanner" : "/admin"}
                                    className="flex flex-col items-center justify-center p-2 rounded-xl text-[var(--text-secondary)] hover:text-blue-500 hover:bg-blue-500/10 transition-all"
                                >
                                    <Settings className="w-5 h-5" />
                                    <span className="hidden md:block text-[10px] font-black uppercase tracking-widest mt-1">
                                        {role === 'SCANNER' ? 'Boletería' : 'Panel Empresa'}
                                    </span>
                                </Link>
                            )}

                            <div className="h-8 w-[1px] bg-slate-200/20 mx-1 hidden md:block" />

                            <button
                                onClick={handleSignOut}
                                className="flex items-center gap-1.5 md:gap-2 text-sm font-bold text-[var(--text-secondary)] hover:text-red-500 transition-colors p-2"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="hidden md:inline">Cerrar Sesión</span>
                            </button>
                        </>
                    ) : (
                        <div className="flex items-center gap-2 md:gap-4">
                            <Link href="/login" className="text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-2">
                                Iniciar Sesión
                            </Link>
                            <Link href="/register" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 md:px-6 md:py-2.5 rounded-full text-sm font-black transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-600/20">
                                Registrarse
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
