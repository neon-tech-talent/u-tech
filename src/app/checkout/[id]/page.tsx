import { supabase } from "@/lib/supabase";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import CheckoutForm from "@/components/CheckoutForm";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({
    params,
    searchParams
}: {
    params: { id: string },
    searchParams: { [key: string]: string | string[] | undefined }
}) {
    const { data: event } = await supabase
        .from("events")
        .select("*, companies(*)")
        .eq("id", params.id)
        .single();

    if (!searchParams.selection) return <div>Faltan parámetros de selección</div>;
    
    const selectionStr = Array.isArray(searchParams.selection) ? searchParams.selection[0] : searchParams.selection;
    const selection = JSON.parse(atob(selectionStr));
    const seatId = Array.isArray(searchParams.seatId) ? searchParams.seatId[0] : searchParams.seatId;
    const { data: ticketTypes } = await supabase
        .from("ticket_types")
        .select("*")
        .in("id", Object.keys(selection));

    if (!event || !ticketTypes) return <div>Error cargando datos de compra</div>;

    const brandStyle = {
        "--primary-color": event.companies?.brand_color || "#0f172a",
    } as React.CSSProperties;

    return (
        <div style={brandStyle} className="min-h-screen bg-slate-50 pb-20">
            <header className="bg-primary text-white py-4 px-6 md:px-10 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-4">
                    <Link href={`/events/${params.id}`} className="hover:opacity-75 transition-opacity">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <h1 className="text-xl font-bold tracking-tight">Finalizar Compra</h1>
                </div>
            </header>

            <div className="max-w-4xl mx-auto mt-10 p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2">
                        <CheckoutForm
                            event={event}
                            ticketTypes={ticketTypes}
                            selection={selection}
                            seatId={seatId}
                        />
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <h3 className="font-bold text-slate-800 mb-4">Resumen de Compra</h3>
                            <div className="space-y-4">
                                {ticketTypes.map(type => (
                                    <div key={type.id} className="flex justify-between text-sm">
                                        <span className="text-slate-600">{selection[type.id]}x {type.name}</span>
                                        <span className="font-bold text-slate-900">${(selection[type.id] * type.price).toLocaleString()}</span>
                                    </div>
                                ))}
                                <div className="pt-4 border-t border-slate-100 space-y-2">
                                    <div className="flex justify-between text-sm text-slate-500">
                                        <span>Subtotal</span>
                                        <span>${ticketTypes.reduce((acc, t) => acc + (t.price * selection[t.id]), 0).toLocaleString()}</span>
                                    </div>
                                    {(event.service_charge_percent || 0) > 0 && (
                                        <div className="flex justify-between text-sm text-blue-600 font-medium">
                                            <span>Service Charge ({event.service_charge_percent}%)</span>
                                            <span>${(ticketTypes.reduce((acc, t) => acc + (t.price * selection[t.id]), 0) * (event.service_charge_percent || 0) / 100).toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div className="pt-2 flex justify-between font-extrabold text-lg border-t border-slate-50">
                                        <span>Total</span>
                                        <span className="text-slate-900">
                                            ${(ticketTypes.reduce((acc, t) => acc + (t.price * selection[t.id]), 0) * (1 + (event.service_charge_percent || 0) / 100)).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 italic text-xs text-blue-600">
                            Tus tickets se reservarán por 5 minutos una vez que inicies el proceso de pago.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
