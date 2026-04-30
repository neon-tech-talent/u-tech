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
        <nav className="bg-white border-b border-slate-100 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-12 h-16 md:h-20 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="bg-blue-600 text-white p-1.5 md:p-2 rounded-xl group-hover:rotate-12 transition-all">
                        <Ticket className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <span className="text-xl md:text-2xl font-black tracking-tighter text-slate-900 group-hover:text-blue-600 transition-colors">U-Ticket</span>
                </Link>

                <div className="flex items-center gap-1 md:gap-4">
                    {session ? (
                        <>
                            {role !== 'SCANNER' && role !== 'ADMIN' && (
                                <Link
                                    href="/my-tickets"
                                    className="flex flex-col items-center justify-center p-2 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                >
                                    <Ticket className="w-5 h-5" />
                                    <span className="hidden md:block text-[10px] font-bold uppercase tracking-widest mt-1">Mis Tickets</span>
                                </Link>
                            )}

                            {(role === 'ADMIN' || role === 'SUPERADMIN' || role === 'SCANNER') && (
                                <Link
                                    href={role === 'SCANNER' ? "/admin/scanner" : "/admin"}
                                    className="flex flex-col items-center justify-center p-2 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                >
                                    <Settings className="w-5 h-5" />
                                    <span className="hidden md:block text-[10px] font-bold uppercase tracking-widest mt-1">
                                        {role === 'SCANNER' ? 'Boletería' : 'Panel Empresa'}
                                    </span>
                                </Link>
                            )}

                            <div className="h-8 w-[1px] bg-slate-200 mx-1 hidden md:block" />

                            <button
                                onClick={handleSignOut}
                                className="flex items-center gap-1.5 md:gap-2 text-sm font-bold text-slate-500 hover:text-red-500 transition-colors p-2"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="hidden md:inline">Cerrar Sesión</span>
                            </button>
                        </>
                    ) : (
                        <div className="flex items-center gap-2 md:gap-4">
                            <Link href="/login" className="text-sm font-bold text-slate-600 hover:text-slate-900 px-1">
                                Iniciar Sesión
                            </Link>
                            <Link href="/register" className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 md:px-5 md:py-2.5 rounded-full text-sm font-bold transition-colors whitespace-nowrap">
                                Registrarse
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
