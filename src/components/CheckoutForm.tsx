"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { AlertCircle, Loader2 } from "lucide-react";

interface CheckoutFormProps {
    event: any;
    ticketTypes: any[];
    selection: Record<string, number>;
    seatId?: string;
}

export default function CheckoutForm({ event, ticketTypes, selection, seatId }: CheckoutFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Flatten selection into individual items for the form
    const items = Object.entries(selection).flatMap(([typeId, qty]) => {
        const type = ticketTypes.find(t => t.id === typeId);
        return Array.from({ length: qty }).map((_, i) => ({
            typeId,
            typeName: type?.name,
            id: `${typeId}-${i}`
        }));
    });

    const [holders, setHolders] = useState<Record<string, { name: string, dni: string }>>({});

    const handleInputChange = (id: string, field: 'name' | 'dni', value: string) => {
        setHolders(prev => ({
            ...prev,
            [id]: { ...prev[id] || { name: '', dni: '' }, [field]: value }
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Validation: Check empty fields
        const values = Object.values(holders);
        if (values.length < items.length || values.some(v => !v.name || !v.dni)) {
            setError("Por favor completa todos los campos de nombre y DNI.");
            setLoading(false);
            return;
        }

        // Validation: Check duplicate DNIs
        const dnis = values.map(v => v.dni);
        if (new Set(dnis).size !== dnis.length) {
            setError("No se permiten DNIs duplicados en la misma compra.");
            setLoading(false);
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Debes iniciar sesión para comprar.");

            // 1. Create order
            const subtotal = ticketTypes.reduce((acc, t) => acc + (t.price * selection[t.id]), 0);
            const serviceChargePercent = event.service_charge_percent || 0;
            const serviceChargeTotal = (subtotal * serviceChargePercent) / 100;
            const totalWithCharge = subtotal + serviceChargeTotal;

            const { data: order, error: orderError } = await supabase
                .from("orders")
                .insert({
                    company_id: event.company_id,
                    user_id: user.id,
                    total_amount: totalWithCharge,
                    service_charge_total: serviceChargeTotal,
                    status: 'COMPLETED', // Simulating successful payment for MVP
                    expires_at: new Date(Date.now() + 5 * 60000).toISOString()
                })
                .select()
                .single();

            if (orderError) throw orderError;

            // 2. Create tickets
            const ticketsToInsert = items.map((item, idx) => {
                const type = ticketTypes.find(t => t.id === item.typeId);
                const basePrice = type?.price || 0;
                const scAmount = (basePrice * serviceChargePercent) / 100;
                
                return {
                    company_id: event.company_id,
                    event_id: event.id,
                    order_id: order.id,
                    ticket_type_id: item.typeId,
                    seat_id: idx === 0 ? (seatId || null) : null,
                    dni_holder: holders[item.id].dni,
                    name_holder: holders[item.id].name,
                    base_price: basePrice,
                    service_charge_amount: scAmount,
                    status: 'VALID'
                };
            });

            const { error: ticketsError } = await supabase
                .from("tickets")
                .insert(ticketsToInsert);

            if (ticketsError) throw ticketsError;

            // 3. Update Seat Status if applicable
            if (seatId) {
                await supabase
                    .from("seats")
                    .update({ status: 'SOLD' })
                    .eq("id", seatId);
            }

            // 3. Success! Triger email sending (optional but recommended for UX)
            if (user?.email) {
                // We don't await this to avoid delaying the success page, or we could await it
                fetch("/api/send-ticket", {
                    method: "POST",
                    body: JSON.stringify({
                        orderId: order.id,
                        email: user.email
                    })
                }).catch(err => console.error("Error triggering email:", err));
            }

            router.push(`/checkout/success?orderId=${order.id}`);
        } catch (err: any) {
            setError(err.message || "Ocurrió un error al procesar tu compra.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <h2 className="text-2xl font-bold text-slate-800 mb-8">Datos de los Asistentes</h2>

                <div className="space-y-10">
                    {items.map((item, index) => (
                        <div key={item.id} className="space-y-4">
                            <div className="flex items-center gap-2">
                                <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                                    {index + 1}
                                </span>
                                <h3 className="font-bold text-slate-700">Asistente - {item.typeName}</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Nombre Completo</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ej: Juan Pérez"
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        value={holders[item.id]?.name || ''}
                                        onChange={(e) => handleInputChange(item.id, 'name', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase">DNI / Pasaporte</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Sin puntos ni espacios"
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        value={holders[item.id]?.dni || ''}
                                        onChange={(e) => handleInputChange(item.id, 'dni', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {error && (
                <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex items-center gap-3 text-red-600">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-3"
            >
                {loading ? (
                    <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        Procesando...
                    </>
                ) : (
                    "Confirmar y Pagar"
                )}
            </button>
        </form>
    );
}
