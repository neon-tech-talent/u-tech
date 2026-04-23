"use client";

import { supabase } from "@/lib/supabase";
import { Plus, Calendar, Settings, MapPin, MoreVertical, Trash2, Ban, CheckCircle } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminEvents() {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchEvents();
    }, []);

    async function fetchEvents() {
        const { data, error } = await supabase
            .from("events")
            .select("*, ticket_types(count)")
            .neq("status", "DELETED")
            .order("event_date", { ascending: false });

        if (!error && data) {
            setEvents(data);
        }
        setLoading(false);
    }

    async function handleStatusChange(eventId: string, newStatus: string) {
        const actionLabel = newStatus === 'CANCELLED' ? 'cancelar' : 'activar';
        if (!confirm(`¿Estás seguro de que deseas ${actionLabel} este evento?`)) return;

        const { error } = await supabase
            .from("events")
            .update({ status: newStatus })
            .eq("id", eventId);

        if (error) {
            alert("Error al cambiar estado: " + error.message);
        } else {
            fetchEvents();
        }
    }

    async function handleDelete(eventId: string) {
        if (!confirm("¿ESTÁS SEGURO? Esta acción no se puede deshacer y ocultará el evento permanentemente.")) return;

        // Soft delete
        const { error } = await supabase
            .from("events")
            .update({ status: 'DELETED' })
            .eq("id", eventId);

        if (error) {
            alert("Error al eliminar: " + error.message);
        } else {
            setEvents(events.filter(e => e.id !== eventId));
        }
    }

    return (
        <div className="space-y-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Mis Eventos</h1>
                    <p className="text-slate-500 font-medium">Gestiona tus eventos, tickets y configuraciones.</p>
                </div>
                <Link
                    href="/admin/events/new"
                    className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-500 transition-all shadow-xl shadow-blue-100"
                >
                    <Plus className="w-5 h-5" />
                    Crear Evento
                </Link>
            </div>

            <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Evento</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="px-8 py-12 text-center text-slate-400 font-bold animate-pulse uppercase tracking-widest">
                                    Cargando eventos...
                                </td>
                            </tr>
                        ) : events.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-8 py-12 text-center text-slate-400 font-bold uppercase tracking-widest">
                                    No tienes eventos creados
                                </td>
                            </tr>
                        ) : events.map((event) => (
                            <tr key={event.id} className={`hover:bg-slate-50 transition-colors group ${event.status === 'CANCELLED' ? 'bg-red-50/30' : ''}`}>
                                <td className="px-8 py-6">
                                    <div className="font-bold text-slate-900">{event.name}</div>
                                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                                        <MapPin className="w-3 h-3" />
                                        {event.location_name}
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-sm text-slate-600 font-medium">
                                    {formatDate(event.event_date)}
                                </td>
                                <td className="px-8 py-6">
                                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${event.status === 'CANCELLED'
                                            ? 'bg-red-100 text-red-600'
                                            : 'bg-green-100 text-green-600'
                                        }`}>
                                        {event.status === 'CANCELLED' ? 'CANCELADO' : 'ACTIVO'}
                                    </span>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => handleStatusChange(event.id, event.status === 'CANCELLED' ? 'ACTIVE' : 'CANCELLED')}
                                            className={`p-2 rounded-xl transition-all ${event.status === 'CANCELLED'
                                                    ? 'text-green-600 hover:bg-green-50'
                                                    : 'text-orange-600 hover:bg-orange-50'
                                                }`}
                                            title={event.status === 'CANCELLED' ? "Reactivar Evento" : "Cancelar Evento"}
                                        >
                                            {event.status === 'CANCELLED' ? <CheckCircle className="w-5 h-5" /> : <Ban className="w-5 h-5" />}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(event.id)}
                                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                            title="Eliminar Evento"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
