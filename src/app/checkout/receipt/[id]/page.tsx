import { supabase } from "@/lib/supabase";
import { Ticket, Calendar, MapPin, User, Hash } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export const dynamic = "force-dynamic";

export default async function ReceiptPage({ params }: { params: { id: string } }) {
    const { data: order } = await supabase
        .from("orders")
        .select("*, companies(*)")
        .eq("id", params.id)
        .single();

    const { data: tickets } = await supabase
        .from("tickets")
        .select("*, event_id(*)")
        .eq("order_id", params.id);

    if (!order || !tickets) return <div>Comprobante no encontrado.</div>;

    const event = tickets[0].event_id as any;

    return (
        <div className="min-h-screen bg-white p-8 md:p-20 text-slate-900">
            {/* Header / Brand */}
            <div className="flex justify-between items-start border-b-2 border-slate-100 pb-10 mb-10">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-blue-600 mb-2">U-TICKET</h1>
                    <p className="text-slate-500 font-medium">Comprobante de Pago Electrónico</p>
                </div>
                <div className="text-right">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Orden</p>
                    <p className="text-xl font-mono font-bold">#{order.id.split("-")[0].toUpperCase()}</p>
                </div>
            </div>

            {/* Main Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
                <div className="space-y-6">
                    <div>
                        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Calendar className="w-3 h-3" /> Evento
                        </h2>
                        <p className="text-2xl font-bold">{event.name}</p>
                        <p className="text-slate-600 font-medium mt-1">
                            {format(new Date(event.event_date), "EEEE d 'de' MMMM, yyyy", { locale: es })}
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <MapPin className="w-3 h-3" /> Lugar
                        </h2>
                        <p className="text-lg font-bold">{event.location_name}</p>
                        <p className="text-slate-600 italic">{event.address}</p>
                    </div>
                </div>

                <div className="bg-slate-50 p-8 rounded-[32px] space-y-6">
                    <div>
                        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <User className="w-3 h-3" /> Detalle de la Compra
                        </h2>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-slate-500 font-medium">Cantidad de Tickets</span>
                                <span className="font-bold">{tickets.length}</span>
                            </div>
                            <div className="flex justify-between pt-3 border-t border-slate-200">
                                <span className="text-slate-900 font-bold">Total Pagado</span>
                                <span className="text-2xl font-black text-blue-600">${order.total_amount.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Ticket Holders Table */}
            <div className="mb-12">
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Ticket className="w-3 h-3" /> Listado de Entradas
                </h2>
                <div className="border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Titular</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">DNI</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-right">Código QR</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {tickets.map((t: any) => (
                                <tr key={t.id}>
                                    <td className="px-6 py-5 font-bold text-slate-800">{t.name_holder}</td>
                                    <td className="px-6 py-5 text-slate-600 font-medium">{t.dni_holder}</td>
                                    <td className="px-6 py-5 text-right">
                                        <span className="font-mono text-xs text-slate-400 bg-slate-50 px-3 py-1 rounded-full uppercase">
                                            {t.qr_code.split("-")[0]}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer / Legal */}
            <div className="mt-20 pt-10 border-t border-slate-100 text-center space-y-4">
                <div className="flex justify-center gap-8 mb-6">
                    <div className="w-32 h-32 opacity-10 grayscale">
                        {/* Placeholder for company logo or QR */}
                        <div className="w-full h-full bg-slate-200 rounded-xl" />
                    </div>
                </div>
                <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
                    Este documento es un comprobante válido de compra. Las entradas son personales e intransferibles sujeto a las políticas del organizador.
                    Por favor presente su DNI físico al ingresar al evento.
                </p>
                <div className="flex items-center justify-center gap-2 text-slate-300 font-black tracking-widest text-[10px] uppercase">
                    <Hash className="w-3 h-3" /> U-TICKET v1.0 • {order.companies?.name.toUpperCase()}
                </div>
            </div>

            {/* Auto Print Script */}
            <script dangerouslySetInnerHTML={{ __html: `window.onload = () => { setTimeout(() => window.print(), 500); }` }} />
        </div>
    );
}
