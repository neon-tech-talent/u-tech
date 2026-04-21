import { supabase } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";
import { Calendar, MapPin, Ticket } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
    const { data: events, error } = await supabase
        .from("events")
        .select("*, companies(name)")
        .order("event_date", { ascending: true });

    if (error) {
        return <div className="p-10 text-red-500">Error cargando eventos: {error.message}</div>;
    }

    return (
        <div className="max-w-6xl mx-auto p-6 md:p-10">
            <header className="mb-12">
                <h1 className="text-4xl font-extrabold text-slate-900">Eventos Disponibles</h1>
                <p className="text-slate-500 mt-2">Encuentra los mejores eventos de nuestras empresas aliadas.</p>
            </header>

            {events?.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                    <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-400">No hay eventos programados por el momento.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {events?.map((event) => (
                        <Link
                            key={event.id}
                            href={`/events/${event.id}`}
                            className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl transition-all group"
                        >
                            <div className="h-48 bg-slate-200 group-hover:bg-slate-300 transition-colors flex items-center justify-center">
                                <span className="text-slate-400 font-medium">Sin imagen</span>
                            </div>
                            <div className="p-6">
                                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                                    {event.companies?.name}
                                </span>
                                <h2 className="text-xl font-bold text-slate-900 mt-1 mb-4 flex items-center gap-2">
                                    {event.name}
                                </h2>

                                <div className="space-y-2 text-sm text-slate-600">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-slate-400" />
                                        <span>{formatDate(event.event_date)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-slate-400" />
                                        <span>{event.location_name}</span>
                                    </div>
                                </div>

                                <div className="mt-6 flex items-center justify-between">
                                    <span className="text-slate-400 text-xs">{event.location_type}</span>
                                    <button className="px-4 py-2 bg-slate-900 text-white rounded-lg font-medium group-hover:bg-blue-600 transition-colors text-sm">
                                        Ver Tickets
                                    </button>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
