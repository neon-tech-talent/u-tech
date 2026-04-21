"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Scan, CheckCircle, XCircle, Loader2, User } from "lucide-react";

export default function QRScanner() {
    const [qrInput, setQrInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string; ticket?: any } | null>(null);

    const handleScan = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setResult(null);

        try {
            // 1. Check if ticket exists
            const { data: ticket, error: fetchError } = await supabase
                .from("tickets")
                .select("*, events(name)")
                .eq("qr_code", qrInput)
                .single();

            if (fetchError || !ticket) {
                setResult({ success: false, message: "Ticket INVÁLIDO o no encontrado." });
                return;
            }

            // 2. Check if already used
            if (ticket.status === 'USED') {
                setResult({ success: false, message: "Este ticket YA FUE USADO.", ticket });
                return;
            }

            // 3. Mark as used
            const { error: updateError } = await supabase
                .from("tickets")
                .update({ status: 'USED' })
                .eq("id", ticket.id);

            if (updateError) throw updateError;

            setResult({
                success: true,
                message: "¡Acceso PERMITIDO! Ticket validado correctamente.",
                ticket
            });
            setQrInput("");
        } catch (err) {
            setResult({ success: false, message: "Error técnico al validar." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-10">
            <header className="text-center">
                <div className="bg-blue-600 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-100 text-white">
                    <Scan className="w-8 h-8" />
                </div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Validador de Acceso</h1>
                <p className="text-slate-500 font-medium">Ingresa el código QR o escanea el ticket del asistente.</p>
            </header>

            <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 space-y-8">
                <form onSubmit={handleScan} className="flex gap-4">
                    <input
                        type="text"
                        placeholder="Pega el código QR aquí..."
                        className="flex-1 px-6 py-5 rounded-2xl bg-slate-50 border-none outline-none ring-2 ring-transparent focus:ring-blue-600 transition-all font-mono text-sm"
                        value={qrInput}
                        onChange={(e) => setQrInput(e.target.value)}
                    />
                    <button
                        type="submit"
                        disabled={loading || !qrInput}
                        className="bg-slate-900 text-white px-8 py-5 rounded-2xl font-bold hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center gap-2"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Validar"}
                    </button>
                </form>

                {result && (
                    <div className={`p-8 rounded-[32px] animate-in zoom-in duration-300 ${result.success ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'
                        }`}>
                        <div className="flex items-start gap-6">
                            {result.success ? (
                                <CheckCircle className="w-12 h-12 text-green-600 shrink-0" />
                            ) : (
                                <XCircle className="w-12 h-12 text-red-600 shrink-0" />
                            )}

                            <div className="space-y-4">
                                <div>
                                    <h3 className={`text-xl font-black ${result.success ? 'text-green-900' : 'text-red-900'}`}>
                                        {result.message}
                                    </h3>
                                    {result.ticket && (
                                        <p className="text-slate-500 text-sm font-medium mt-1">
                                            Evento: <span className="text-slate-800 font-bold">{result.ticket.events.name}</span>
                                        </p>
                                    )}
                                </div>

                                {result.ticket && (
                                    <div className="flex items-center gap-4 bg-white/50 p-4 rounded-2xl border border-white">
                                        <div className="bg-white p-2 rounded-xl shadow-sm text-slate-400">
                                            <User className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Asistente</p>
                                            <p className="font-bold text-slate-900">{result.ticket.name_holder}</p>
                                            <p className="text-xs text-slate-500">DNI: {result.ticket.dni_holder}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="text-center">
                <p className="text-slate-300 text-xs font-bold uppercase tracking-[0.3em]">Modo Staff - Seguridad U-Ticket</p>
            </div>
        </div>
    );
}
