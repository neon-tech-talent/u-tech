"use client";

import { supabase } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";
import { Calendar, MapPin, Ticket, Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function EventsPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetchEvents();
    }, []);

    async function fetchEvents() {
        const { data, error } = await supabase
            .from("events")
            .select("*")
            .neq("status", "DELETED")
            .order("event_date", { ascending: true });

        if (!error && data) {
            setEvents(data);
        }
        setLoading(false);
    }

    const filteredEvents = events.filter(event =>
        event.name.toLowerCase().includes(search.toLowerCase()) ||
        event.location_name.toLowerCase().includes(search.toLowerCase()) ||
        event.companies?.name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto p-6 md:p-12 space-y-12">
            <header className="space-y-6">
                <div className="space-y-4">
                    <h1 className="text-5xl font-black text-slate-900 tracking-tight">Eventos Disponibles</h1>
                    <p className="text-xl text-slate-500 max-w-2xl">Descubre experiencias únicas de nuestras empresas aliadas y reserva tu lugar hoy mismo.</p>
                </div>

                {/* Search Bar */}
                <div className="relative max-w-xl group">
                    <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                        <Search className="w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar por nombre, lugar o empresa..."
                        className="w-full pl-16 pr-6 py-5 rounded-[24px] bg-white border-2 border-slate-100 outline-none ring-4 ring-transparent focus:ring-blue-100 focus:border-blue-600 transition-all font-bold shadow-xl shadow-slate-200/50"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    {search && (
                        <button
                            onClick={() => setSearch("")}
                            className="absolute inset-y-0 right-6 flex items-center"
                        >
                            <X className="w-5 h-5 text-slate-400 hover:text-slate-900" />
                        </button>
                    )}
                </div>
            </header>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 opacity-50">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-[400px] bg-slate-100 rounded-[40px] animate-pulse" />
                    ))}
                </div>
            ) : filteredEvents.length === 0 ? (
                <div className="text-center py-32 bg-white rounded-[40px] border-2 border-dashed border-slate-200 shadow-inner">
                    <Ticket className="w-16 h-16 text-slate-200 mx-auto mb-6" />
                    <p className="text-slate-400 font-bold text-xl uppercase tracking-widest">
                        {search ? "No se encontraron eventos para tu búsqueda" : "No hay eventos programados"}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {filteredEvents.map((event) => {
                        const minPrice = event.ticket_types?.length > 0
                            ? Math.min(...event.ticket_types.map((t: any) => t.price))
                            : null;

                        const isCancelled = event.status === 'CANCELLED';

                        return (
                            <Link
                                key={event.id}
                                href={isCancelled ? "#" : `/events/${event.id}`}
                                className={`bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group relative ${isCancelled ? 'opacity-75 cursor-not-allowed grayscale' : ''}`}
                            >
                                <div className="h-64 relative overflow-hidden bg-slate-100">
                                    {event.banner_url ? (
                                        <img
                                            src={event.banner_url}
                                            alt={event.name}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300 font-black text-2xl uppercase tracking-tighter opacity-30 select-none">
                                            {event.name}
                                        </div>
                                    )}
                                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-4 py-1.5 rounded-full shadow-sm">
                                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                                            {event.companies?.name}
                                        </span>
                                    </div>

                                    {isCancelled && (
                                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center">
                                            <div className="bg-red-600 text-white px-6 py-2 rounded-full font-black text-sm uppercase tracking-[0.2em] shadow-2xl rotate-[-5deg]">
                                                CANCELADO
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="p-8 space-y-6">
                                    <h2 className="text-2xl font-black text-slate-900 leading-tight">
                                        {event.name}
                                    </h2>

                                    <div className="space-y-3 text-slate-500 font-bold text-sm">
                                        <div className="flex items-center gap-3">
                                            <Calendar className="w-5 h-5 text-blue-600" />
                                            <span>{formatDate(event.event_date)}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <MapPin className="w-5 h-5 text-blue-600" />
                                            <div className="flex flex-col">
                                                <span className="line-clamp-1">{event.location_name}</span>
                                                {event.address && (
                                                    <span className="text-[10px] text-slate-400 font-medium line-clamp-1">
                                                        {event.address}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                        <div className="space-y-0.5">
                                            {!isCancelled && minPrice !== null && (
                                                <>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Desde</p>
                                                    <p className="text-2xl font-black text-slate-900">${minPrice.toLocaleString()}</p>
                                                </>
                                            )}
                                            {isCancelled && (
                                                <p className="text-red-600 text-xs font-bold uppercase tracking-widest">No disponible</p>
                                            )}
                                        </div>
                                        <div className={`h-12 w-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:rotate-12 transition-all duration-500 ${isCancelled ? 'opacity-20' : ''}`}>
                                            <Ticket className="w-6 h-6" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
