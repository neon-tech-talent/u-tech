"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/utils";
import { BarChart3, TrendingUp, Calendar, Filter, Download } from "lucide-react";

export default function StatsPage() {
    const [stats, setStats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [totalGains, setTotalGains] = useState(0);

    useEffect(() => {
        fetchStats();
    }, [selectedMonth]);

    async function fetchStats() {
        setLoading(true);
        try {
            // Fetch tickets with service charge info
            // Since we added columns, we can filter by month
            const startDate = new Date(`${selectedMonth}-01T00:00:00Z`);
            const endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + 1);

            const { data: tickets, error } = await supabase
                .from("tickets")
                .select("*, events(name)")
                .gte("created_at", startDate.toISOString())
                .lt("created_at", endDate.toISOString())
                .eq("status", "VALID");

            if (error) throw error;

            // Group by event
            const eventStats = (tickets || []).reduce((acc: any, t: any) => {
                const eventName = t.events?.name || "Sin nombre";
                if (!acc[eventName]) {
                    acc[eventName] = { name: eventName, count: 0, serviceChargeTotal: 0 };
                }
                acc[eventName].count += 1;
                acc[eventName].serviceChargeTotal += Number(t.service_charge_amount || 0);
                return acc;
            }, {});

            const statsArray = Object.values(eventStats);
            setStats(statsArray);
            setTotalGains(statsArray.reduce((acc: any, s: any) => acc + (s.serviceChargeTotal || 0), 0) as number);
        } catch (err) {
            console.error("Error fetching stats:", err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-10">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Estadísticas de Ganancias</h1>
                    <p className="text-slate-500 font-medium">Análisis de ingresos por Service Charge</p>
                </div>

                <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl text-slate-600">
                        <Filter className="w-4 h-4" />
                        <span className="text-xs font-black uppercase tracking-widest">Filtrar Mes</span>
                    </div>
                    <input
                        type="month"
                        className="bg-transparent border-none outline-none font-bold text-slate-900 pr-4"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                    />
                </div>
            </header>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-blue-600 rounded-[40px] p-10 text-white shadow-2xl shadow-blue-200 space-y-6 relative overflow-hidden group">
                    <div className="relative z-10 space-y-2">
                        <p className="text-blue-200 text-xs font-black uppercase tracking-[0.3em]">Total Service Charge</p>
                        <h2 className="text-5xl font-black tracking-tighter">{formatCurrency(totalGains)}</h2>
                    </div>
                    <TrendingUp className="absolute -right-6 -bottom-6 w-32 h-32 text-white/10 -rotate-12 transition-transform duration-700 group-hover:scale-110" />
                </div>

                <div className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100 space-y-6">
                    <div className="space-y-2">
                        <p className="text-slate-400 text-xs font-black uppercase tracking-[0.3em]">Tickets Vendidos</p>
                        <h2 className="text-5xl font-black text-slate-900 tracking-tighter">
                            {stats.reduce((acc: number, s: any) => acc + (s.count || 0), 0)}
                        </h2>
                    </div>
                </div>

                <div className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100 space-y-6">
                    <div className="space-y-2">
                        <p className="text-slate-400 text-xs font-black uppercase tracking-[0.3em]">Eventos Activos</p>
                        <h2 className="text-5xl font-black text-slate-900 tracking-tighter">{stats.length}</h2>
                    </div>
                </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                    <h3 className="text-xl font-black text-slate-900">Desglose por Evento</h3>
                    <button className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 transition-colors">
                        <Download className="w-4 h-4" />
                        Exportar Reporte
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50">
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Evento</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Tickets</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ganancia S.C.</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                [1, 2, 3].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={3} className="px-8 py-6 bg-slate-50/50" />
                                    </tr>
                                ))
                            ) : stats.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-8 py-20 text-center text-slate-400 italic">
                                        No hay ventas registradas en este período.
                                    </td>
                                </tr>
                            ) : (
                                stats.map((s, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{s.name}</p>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-600">
                                                {s.count}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <p className="font-black text-slate-900">{formatCurrency(s.serviceChargeTotal)}</p>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        {!loading && stats.length > 0 && (
                            <tfoot>
                                <tr className="bg-slate-900 text-white">
                                    <td className="px-8 py-6 font-black uppercase tracking-widest text-xs">Total del Período</td>
                                    <td className="px-8 py-6 text-center font-bold">
                                        {stats.reduce((acc: number, s: any) => acc + (s.count || 0), 0)}
                                    </td>
                                    <td className="px-8 py-6 text-right font-black text-xl">
                                        {formatCurrency(totalGains)}
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        </div>
    );
}
