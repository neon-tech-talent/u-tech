import { supabase } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";
import { Calendar, MapPin, Ticket } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
    const { data: events, error } = await supabase
        .from("events")
        .select("*, companies(name), ticket_types(price)")
        .order("event_date", { ascending: true });

    if (error) {
        return <div className="p-10 text-red-500 text-center">Error cargando eventos: {error.message}</div>;
    }

    return (
        <div className="max-w-7xl mx-auto p-6 md:p-12 space-y-12">
            <header className="space-y-4">
                <h1 className="text-5xl font-black text-slate-900 tracking-tight">Eventos Disponibles</h1>
                <p className="text-xl text-slate-500 max-w-2xl">Descubre experiencias únicas de nuestras empresas aliadas y reserva tu lugar hoy mismo.</p>
            </header>

            {events?.length === 0 ? (
                <div className="text-center py-32 bg-white rounded-[40px] border-2 border-dashed border-slate-200 shadow-inner">
                    <Ticket className="w-16 h-16 text-slate-200 mx-auto mb-6" />
                    <p className="text-slate-400 font-bold text-xl uppercase tracking-widest">No hay eventos programados</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {events?.map((event) => {
                        const minPrice = event.ticket_types?.length > 0
                            ? Math.min(...event.ticket_types.map((t: any) => t.price))
                            : null;

                        return (
                            <Link
                                key={event.id}
                                href={`/events/${event.id}`}
                                className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group relative"
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
                                            <span className="line-clamp-1">{event.location_name}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                        <div className="space-y-0.5">
                                            {minPrice !== null && (
                                                <>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Desde</p>
                                                    <p className="text-2xl font-black text-slate-900">${minPrice.toLocaleString()}</p>
                                                </>
                                            )}
                                        </div>
                                        <div className="h-12 w-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:rotate-12 transition-all duration-500">
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
