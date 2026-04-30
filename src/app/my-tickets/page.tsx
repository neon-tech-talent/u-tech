"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Ticket } from "lucide-react";
import Link from "next/link";
import TicketList from "@/components/TicketList";

export default function MyTicketsPage() {
    const [user, setUser] = useState<any>(null);
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState<string | null>(null);

    useEffect(() => {
        const fetchUserAndTickets = async () => {
            const { data: { user }, error: authError } = await supabase.auth.getUser();

            if (authError || !user) {
                setLoading(false);
                return;
            }

            setUser(user);

            const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
            setRole(profile?.role || 'CUSTOMER');

            if (profile?.role === 'SCANNER' || profile?.role === 'ADMIN') {
                setLoading(false);
                return;
            }

            const { data: ticketsData, error } = await supabase
                .from("tickets")
                .select(`
                  *, 
                  events (
                    name, 
                    event_date, 
                    location_name,
                    companies (name, brand_color)
                  ),
                  orders!inner(user_id)
                `)
                .eq("orders.user_id", user.id)
                .order("created_at", { ascending: false });

            if (!error && ticketsData) {
                setTickets(ticketsData);
            }
            setLoading(false);
        };

        fetchUserAndTickets();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <Ticket className="w-16 h-16 text-slate-300 mb-6" />
                <h1 className="text-3xl font-black text-slate-900 mb-2">Inicia Sesión</h1>
                <p className="text-slate-500 mb-6 font-medium">Debes iniciar sesión para ver tus entradas compradas.</p>
                <Link href="/login" className="bg-blue-600 text-white px-8 py-4 rounded-xl font-black hover:bg-blue-700 transition shadow-lg shadow-blue-200">
                    Ir a Iniciar Sesión
                </Link>
            </div>
        );
    }

    if (role === 'SCANNER' || role === 'ADMIN') {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
                <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-[32px] flex items-center justify-center mb-6">
                    <Ticket className="w-10 h-10" />
                </div>
                <h1 className="text-3xl font-black text-slate-900 mb-2">Acceso Restringido</h1>
                <p className="text-slate-500 max-w-sm mb-8 font-medium">
                    Como {role === 'SCANNER' ? 'Boletero' : 'Administrador'} no tienes acceso a la sección de compra de tickets ni a tus entradas personales desde aquí.
                </p>
                <Link href={role === 'SCANNER' ? "/admin/scanner" : "/admin"} className="bg-blue-600 text-white px-8 py-4 rounded-xl font-black hover:bg-blue-700 transition shadow-lg shadow-blue-200">
                    Ir al {role === 'SCANNER' ? "Escáner" : "Panel Empresa"}
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <header className="bg-white border-b border-slate-200 py-8 px-6 md:px-10">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900">Mis Tickets</h1>
                        <p className="text-slate-500 mt-1">Aquí encontrarás todos tus pases para eventos.</p>
                    </div>
                    <div className="bg-blue-600 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg shadow-blue-100">
                        {tickets?.length || 0} Tickets
                    </div>
                </div>
            </header>

            <div className="max-w-6xl mx-auto p-6 md:p-10">
                {tickets?.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-300">
                        <Ticket className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-slate-800">Aún no tienes tickets</h2>
                        <p className="text-slate-400 mt-2">¿Qué esperas para ir a tu próximo gran evento?</p>
                        <Link href="/events" className="mt-6 inline-block bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-100">
                            Explorar Eventos
                        </Link>
                    </div>
                ) : (
                    <TicketList initialTickets={tickets} />
                )}
            </div>
        </div>
    );
}
