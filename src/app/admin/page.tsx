import { supabase } from "@/lib/supabase";
import { TrendingUp, Users, Ticket, DollarSign } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
    // In a real app we'd filter by company_id from authenticated user
    const { data: events } = await supabase.from("events").select("id");
    const { data: tickets } = await supabase.from("tickets").select("id, status");
    const { data: orders } = await supabase.from("orders").select("total_amount");

    const totalSales = orders?.reduce((acc, o) => acc + o.total_amount, 0) || 0;
    const usedTickets = tickets?.filter(t => t.status === 'USED').length || 0;

    const stats = [
        { label: "Ventas Totales", value: `$${totalSales.toLocaleString()}`, color: "text-blue-600", icon: DollarSign },
        { label: "Tickets Vendidos", value: tickets?.length || 0, color: "text-green-600", icon: Ticket },
        { label: "Asistencia Actual", value: usedTickets, color: "text-purple-600", icon: Users },
        { label: "Eventos Activos", value: events?.length || 0, color: "text-orange-600", icon: TrendingUp },
    ];

    return (
        <div className="space-y-10">
            <header>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Panel General</h1>
                <p className="text-slate-500 font-medium">Resumen de actividad para tu empresa.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-2xl">
                            <stat.icon className={`w-6 h-6 ${stat.color}`} />
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-3xl p-10 shadow-sm border border-slate-100 min-h-[400px] flex items-center justify-center">
                <p className="text-slate-300 font-bold italic text-xl">Actividad reciente - Gráfico (Próximamente)</p>
            </div>
        </div>
    );
}
