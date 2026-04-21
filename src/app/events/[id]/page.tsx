import { supabase } from "@/lib/supabase";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Calendar, MapPin, Info, ArrowLeft } from "lucide-react";
import Link from "next/link";
import TicketSelection from "@/components/TicketSelection";

export const dynamic = "force-dynamic";

export default async function EventDetail({ params }: { params: { id: string } }) {
    const { data: event, error: eventError } = await supabase
        .from("events")
        .select("*, companies(*)")
        .eq("id", params.id)
        .single();

    const { data: ticketTypes, error: typesError } = await supabase
        .from("ticket_types")
        .select("*")
        .eq("event_id", params.id);

    if (eventError || typesError || !event) {
        return <div className="p-10 text-red-500 text-center">Error cargando el evento: {eventError?.message || "No encontrado"}</div>;
    }

    // Inject branding
    const brandStyle = {
        "--primary-color": event.companies?.brand_color || "#0f172a",
    } as React.CSSProperties;

    return (
        <div style={brandStyle} className="min-h-screen bg-slate-50 pb-20">
            {/* Branding Header */}
            <header className="bg-primary text-white py-4 px-6 md:px-10 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-4">
                    <Link href="/events" className="hover:opacity-75 transition-opacity">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <h1 className="text-xl font-bold tracking-tight">{event.companies?.name}</h1>
                </div>
            </header>

            <div className="max-w-4xl mx-auto mt-10 p-6 md:p-0">
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
                    <div className="h-64 bg-slate-200 flex items-center justify-center text-slate-400">
                        BANNER DEL EVENTO
                    </div>

                    <div className="p-8 md:p-12">
                        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                            <div className="space-y-4 flex-1">
                                <h2 className="text-4xl font-extrabold text-slate-900">{event.name}</h2>
                                <div className="space-y-2 text-slate-600">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-5 h-5 text-blue-600" />
                                        <span className="font-medium">{formatDate(event.event_date)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-5 h-5 text-blue-600" />
                                        <span className="font-medium">{event.location_name}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-blue-700 flex items-center gap-3">
                                <Info className="w-5 h-5 shrink-0" />
                                <p className="text-sm font-medium">Quedan pocos tickets disponibles</p>
                            </div>
                        </div>

                        <div className="mt-10 border-t border-slate-100 pt-10">
                            <h3 className="text-2xl font-bold text-slate-800 mb-6 font-primary">Selecciona tus Tickets</h3>
                            <TicketSelection
                                event={event}
                                ticketTypes={ticketTypes || []}
                            />
                        </div>

                        <div className="mt-10 border-t border-slate-100 pt-10">
                            <h3 className="text-xl font-bold text-slate-800 mb-4">Sobre el evento</h3>
                            <div className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                                {event.description || "Sin descripción proporcionada."}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
