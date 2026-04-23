import { supabase } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";
import { Calendar, MapPin, Ticket, ArrowLeft } from "lucide-react";
import Link from "next/link";
import TicketSelection from "@/components/TicketSelection";

export const dynamic = "force-dynamic";

export default async function EventDetail({ params }: { params: { id: string } }) {
    const { data: event, error: eventError } = await supabase
        .from("events")
        .select("*, companies(*), ticket_types(price), sections(*)")
        .eq("id", params.id)
        .single();

    if (eventError || !event) {
        return <div className="p-10 text-red-500 text-center">Error cargando el evento: {eventError?.message || "No encontrado"}</div>;
    }

    const minPrice = event.ticket_types?.length > 0
        ? Math.min(...event.ticket_types.map((t: any) => t.price))
        : null;

    const brandStyle = {
        "--primary-color": event.companies?.brand_color || "#0f172a",
    } as React.CSSProperties;

    return (
        <div style={brandStyle} className="min-h-screen bg-slate-50 pb-20">
            {/* Simple Navbar */}
            <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/events" className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors font-bold text-sm">
                        <ArrowLeft className="w-4 h-4" />
                        Volver a eventos
                    </Link>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Organizado por</span>
                        <span className="text-sm font-bold text-slate-900">{event.companies?.name}</span>
                    </div>
                </div>
            </header>

            {/* Banner Hero */}
            <div className="relative h-[50vh] min-h-[400px] overflow-hidden bg-slate-900 group">
                {event.banner_url ? (
                    <img
                        src={event.banner_url}
                        alt={event.name}
                        className="w-full h-full object-cover opacity-70 transition-transform duration-1000 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                        <Ticket className="w-32 h-32 text-white/5" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 max-w-7xl mx-auto">
                    <div className="max-w-3xl space-y-6">
                        <h1 className="text-5xl md:text-8xl font-black text-white leading-none tracking-tighter">
                            {event.name}
                        </h1>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 md:px-12 -mt-20 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* INFO SIDE (LEFT) */}
                    <div className="lg:col-span-7 space-y-10">
                        <div className="bg-white rounded-[40px] p-8 md:p-12 shadow-2xl shadow-slate-200/50 border border-slate-100 space-y-12">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-blue-600">
                                        <Calendar className="w-5 h-5" />
                                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">Fecha del Evento</span>
                                    </div>
                                    <p className="text-2xl font-bold text-slate-900">{formatDate(event.event_date)}</p>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-blue-600">
                                        <MapPin className="w-5 h-5" />
                                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">Lugar</span>
                                    </div>
                                    <p className="text-2xl font-bold text-slate-900 leading-tight">{event.location_name}</p>
                                    <span className="inline-block px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-bold uppercase tracking-widest italic">{event.location_type}</span>
                                </div>
                            </div>

                            <div className="space-y-6 pt-10 border-t border-slate-50">
                                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-300">Descripción del evento</h3>
                                <div className="text-slate-600 leading-relaxed text-lg whitespace-pre-wrap font-medium">
                                    {event.description || "Sin descripción proporcionada."}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SELECT SIDE (RIGHT) */}
                    <div className="lg:col-span-5 space-y-8">
                        {/* Summary Card */}
                        <div className="bg-slate-900 rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden group">
                            <div className="relative z-10 space-y-8">
                                {minPrice !== null ? (
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em]">Tickets disponibles desde</p>
                                        <p className="text-7xl font-black tracking-tighter leading-none">${minPrice.toLocaleString()}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <p className="text-2xl font-black uppercase tracking-tighter">Próximamente</p>
                                        <p className="text-slate-500 text-sm">Tickets no disponibles por el momento.</p>
                                    </div>
                                )}

                                <div className="pt-4 flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest border-t border-white/5">
                                    <div className="flex -space-x-2">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800" />
                                        ))}
                                    </div>
                                    <span>+50 personas interesadas</span>
                                </div>
                            </div>
                            <Ticket className="absolute -right-12 -bottom-12 w-48 h-48 text-white/5 -rotate-12 transition-transform duration-700 group-hover:scale-110" />
                        </div>

                        {/* Ticket Selection Component */}
                        <div className="bg-white rounded-[40px] p-2 shadow-xl shadow-slate-200/50 border border-slate-100">
                            <TicketSelection
                                event={event}
                                ticketTypes={event.ticket_types || []}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
