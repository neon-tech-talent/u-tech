import { supabase } from "@/lib/supabase";
import { Plus, Calendar, Settings, MapPin, MoreVertical } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminEvents() {
    const { data: events } = await supabase
        .from("events")
        .select("*, ticket_types(count)")
        .order("event_date", { ascending: false });

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
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ubicación</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {events?.map((event) => (
                            <tr key={event.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-8 py-6">
                                    <div className="font-bold text-slate-900">{event.name}</div>
                                    <div className="text-xs text-slate-400 mt-1">{event.id.slice(0, 8)}</div>
                                </td>
                                <td className="px-8 py-6 text-sm text-slate-600 font-medium">
                                    {formatDate(event.event_date)}
                                </td>
                                <td className="px-8 py-6 text-sm text-slate-600 font-medium flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-slate-300" />
                                    {event.location_name}
                                </td>
                                <td className="px-8 py-6">
                                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                        {event.location_type}
                                    </span>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <button className="p-2 text-slate-300 hover:text-slate-900 transition-colors">
                                        <MoreVertical className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
