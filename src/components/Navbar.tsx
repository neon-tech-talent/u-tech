"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { LogOut, Ticket, Settings, User } from "lucide-react";

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
        <nav className="bg-slate-950/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-12 h-16 md:h-20 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="bg-blue-600 text-white p-1.5 md:p-2 rounded-xl group-hover:rotate-12 transition-all shadow-lg shadow-blue-600/20">
                        <Ticket className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <span className="text-xl md:text-2xl font-black tracking-tighter text-white group-hover:text-blue-400 transition-colors">U-Ticket</span>
                </Link>

                <div className="flex items-center gap-1 md:gap-4">
                    {session ? (
                        <>
                            {role !== 'SCANNER' && role !== 'ADMIN' && (
                                <Link
                                    href="/my-tickets"
                                    className="flex flex-col items-center justify-center p-2 rounded-xl text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                                >
                                    <Ticket className="w-5 h-5" />
                                    <span className="hidden md:block text-[10px] font-black uppercase tracking-widest mt-1">Mis Tickets</span>
                                </Link>
                            )}

                            {(role === 'ADMIN' || role === 'SUPERADMIN' || role === 'SCANNER') && (
                                <Link
                                    href={role === 'SCANNER' ? "/admin/scanner" : "/admin"}
                                    className="flex flex-col items-center justify-center p-2 rounded-xl text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                                >
                                    <Settings className="w-5 h-5" />
                                    <span className="hidden md:block text-[10px] font-black uppercase tracking-widest mt-1">
                                        {role === 'SCANNER' ? 'Boletería' : 'Panel Empresa'}
                                    </span>
                                </Link>
                            )}

                            <div className="h-8 w-[1px] bg-white/10 mx-1 hidden md:block" />

                            <button
                                onClick={handleSignOut}
                                className="flex items-center gap-1.5 md:gap-2 text-sm font-bold text-slate-400 hover:text-red-400 transition-colors p-2"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="hidden md:inline">Cerrar Sesión</span>
                            </button>
                        </>
                    ) : (
                        <div className="flex items-center gap-2 md:gap-4">
                            <Link href="/login" className="text-sm font-bold text-slate-400 hover:text-white px-2">
                                Iniciar Sesión
                            </Link>
                            <Link href="/register" className="bg-white hover:bg-blue-50 text-slate-950 px-4 py-2 md:px-6 md:py-2.5 rounded-full text-sm font-black transition-all hover:scale-105 active:scale-95 shadow-lg shadow-white/5">
                                Registrarse
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
