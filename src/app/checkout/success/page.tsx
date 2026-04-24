import { supabase } from "@/lib/supabase";
import { CheckCircle, ArrowRight, Download } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SuccessPage({ searchParams }: { searchParams: { orderId: string } }) {
    const { data: order } = await supabase
        .from("orders")
        .select("*, companies(*)")
        .eq("id", searchParams.orderId)
        .single();

    const { data: tickets } = await supabase
        .from("tickets")
        .select("*, event_id(name, event_date, location_name)")
        .eq("order_id", searchParams.orderId);

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center space-y-6 border border-slate-100">
                <div className="flex justify-center">
                    <div className="bg-green-100 p-4 rounded-full">
                        <CheckCircle className="w-12 h-12 text-green-600" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-3xl font-extrabold text-slate-900">¡Compra Exitosa!</h1>
                    <p className="text-slate-500">Tu orden #{searchParams.orderId.slice(0, 8)} ha sido procesada.</p>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl text-left space-y-4">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-400 font-medium tracking-wide uppercase text-[10px]">Evento</span>
                        <span className="font-bold text-slate-700">{(tickets?.[0]?.event_id as any)?.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-400 font-medium tracking-wide uppercase text-[10px]">Tickets</span>
                        <span className="font-bold text-slate-700">{tickets?.length}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-4 border-t border-slate-200">
                        <span className="text-slate-400 font-medium tracking-wide uppercase text-[10px]">Total Pagado</span>
                        <span className="font-extrabold text-blue-600">${order?.total_amount?.toLocaleString()}</span>
                    </div>
                </div>

                <div className="space-y-3">
                    <Link
                        href="/my-tickets"
                        className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
                    >
                        Ver Mis Tickets
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                        href={`/checkout/receipt/${searchParams.orderId}`}
                        target="_blank"
                        className="w-full bg-white text-slate-600 py-4 rounded-xl font-bold border border-slate-200 flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Descargar Comprobante
                    </Link>
                </div>

                <p className="text-xs text-slate-400">
                    Se ha enviado un correo de confirmación a tu cuenta.
                </p>
            </div>
        </div>
    );
}
