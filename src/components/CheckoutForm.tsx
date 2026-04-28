"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { AlertCircle, Loader2, CreditCard, QrCode, Wallet, CheckCircle2, XCircle, ArrowRight } from "lucide-react";

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
    const [step, setStep] = useState<'details' | 'payment'>('details');
    const [paymentMethod, setPaymentMethod] = useState<'qr' | 'debit' | 'credit'>('credit');
    const [cardData, setCardData] = useState({
        number: '',
        name: '',
        expiry: '',
        cvv: ''
    });
    const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

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

    const validateDetails = () => {
        const values = Object.values(holders);
        if (values.length < items.length || values.some(v => !v.name || !v.dni)) {
            setError("Por favor completa todos los campos de nombre y DNI.");
            return false;
        }
        const dnis = values.map(v => v.dni);
        if (new Set(dnis).size !== dnis.length) {
            setError("No se permiten DNIs duplicados en la misma compra.");
            return false;
        }
        return true;
    };

    const formatCardNumber = (value: string) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const matches = v.match(/\d{4,16}/g);
        const match = matches && matches[0] || '';
        const parts = [];
        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }
        if (parts.length) return parts.join(' ');
        return v;
    };

    const handleCardChange = (field: string, value: string) => {
        let val = value;
        if (field === 'number') val = formatCardNumber(value);
        if (field === 'expiry') {
            val = value.replace(/\D/g, '').slice(0, 4);
            if (val.length >= 2) val = val.slice(0, 2) + '/' + val.slice(2);
        }
        if (field === 'cvv') val = value.replace(/\D/g, '').slice(0, 4);
        
        setCardData(prev => ({ ...prev, [field]: val }));
    };

    const simulatePayment = async () => {
        setPaymentStatus('processing');
        setError(null);
        
        await new Promise(resolve => setTimeout(resolve, 2000));

        if (paymentMethod === 'qr') {
            return true;
        }

        const cleanNumber = cardData.number.replace(/\s/g, '');
        
        // Expiry validation
        if (cardData.expiry.length !== 5) {
            setError("Fecha de vencimiento inválida.");
            setPaymentStatus('error');
            return false;
        }
        const [month, year] = cardData.expiry.split('/').map(Number);
        const now = new Date();
        const expiryDate = new Date(2000 + year, month - 1);
        if (expiryDate < now) {
            setError("La tarjeta ha vencido.");
            setPaymentStatus('error');
            return false;
        }

        // Whitelist / Blacklist
        const whitelist = ['4512345678901234', '5412751234123456', '5018000000000001'];
        const blacklist: Record<string, string> = {
            '4111111111111111': "Tarjeta Bloqueada / Denegada",
            '5555555555554444': "Fondos Insuficientes",
            '0000000000000000': "Número de Tarjeta Inválido"
        };

        if (whitelist.includes(cleanNumber)) {
            return true;
        } else if (blacklist[cleanNumber]) {
            setError(blacklist[cleanNumber]);
            setPaymentStatus('error');
            return false;
        } else {
            setError("Error de procesamiento. Intente con una tarjeta de prueba válida.");
            setPaymentStatus('error');
            return false;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (step === 'details') {
            if (validateDetails()) {
                setStep('payment');
                window.scrollTo(0, 0);
            }
            return;
        }

        setLoading(true);
        const success = await simulatePayment();
        if (!success) {
            setLoading(false);
            return;
        }

        setPaymentStatus('success');
        await new Promise(resolve => setTimeout(resolve, 1000));

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
                    status: 'COMPLETED',
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

            if (seatId) {
                await supabase
                    .from("seats")
                    .update({ status: 'SOLD' })
                    .eq("id", seatId);
            }

            if (user?.email) {
                fetch("/api/send-ticket", {
                    method: "POST",
                    body: JSON.stringify({ orderId: order.id, email: user.email })
                }).catch(err => console.error("Error triggering email:", err));
            }

            router.push(`/checkout/success?orderId=${order.id}`);
        } catch (err: any) {
            setError(err.message || "Ocurrió un error al procesar tu compra.");
            setPaymentStatus('error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {step === 'details' ? (
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                    <h2 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">Datos de los Asistentes</h2>
                    <div className="space-y-10">
                        {items.map((item, index) => (
                            <div key={item.id} className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <span className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-sm rotate-[-5deg]">
                                        {index + 1}
                                    </span>
                                    <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Asistente - {item.typeName}</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nombre Completo</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Ej: Juan Pérez"
                                            className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-blue-600 transition-all font-bold text-slate-900"
                                            value={holders[item.id]?.name || ''}
                                            onChange={(e) => handleInputChange(item.id, 'name', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">DNI / Pasaporte</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Sin puntos ni espacios"
                                            className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-blue-600 transition-all font-bold text-slate-900"
                                            value={holders[item.id]?.dni || ''}
                                            onChange={(e) => handleInputChange(item.id, 'dni', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="flex items-center gap-4">
                        <button 
                            type="button" 
                            onClick={() => setStep('details')}
                            className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"
                        >
                            <AlertCircle className="w-6 h-6 rotate-180" />
                        </button>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Método de Pago</h2>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { id: 'credit', icon: CreditCard, label: 'Crédito' },
                            { id: 'debit', icon: Wallet, label: 'Débito' },
                            { id: 'qr', icon: QrCode, label: 'QR' },
                        ].map((method) => (
                            <button
                                key={method.id}
                                type="button"
                                onClick={() => setPaymentMethod(method.id as any)}
                                className={`flex flex-col items-center gap-3 p-6 rounded-[32px] border-2 transition-all ${
                                    paymentMethod === method.id 
                                        ? 'border-blue-600 bg-blue-50 text-blue-600' 
                                        : 'border-slate-100 text-slate-400 hover:border-slate-200'
                                }`}
                            >
                                <method.icon className="w-8 h-8" />
                                <span className="text-[10px] font-black uppercase tracking-widest">{method.label}</span>
                            </button>
                        ))}
                    </div>

                    {paymentMethod === 'qr' ? (
                        <div className="flex flex-col items-center py-10 bg-slate-50 rounded-[40px] space-y-6">
                            <div className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50">
                                <QrCode className="w-48 h-48 text-slate-900" />
                            </div>
                            <p className="text-slate-500 font-medium text-center px-10">Escanea el código con tu billetera virtual preferida</p>
                        </div>
                    ) : (
                        <div className="space-y-6 bg-slate-50 p-8 rounded-[40px]">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Número de Tarjeta</label>
                                <div className="relative">
                                    <CreditCard className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="0000 0000 0000 0000"
                                        className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white border-none outline-none focus:ring-2 focus:ring-blue-600 transition-all font-bold text-slate-900 tracking-widest"
                                        value={cardData.number}
                                        onChange={(e) => handleCardChange('number', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nombre en la Tarjeta</label>
                                <input
                                    type="text"
                                    placeholder="NOMBRE TAL CUAL APARECE"
                                    className="w-full px-6 py-4 rounded-2xl bg-white border-none outline-none focus:ring-2 focus:ring-blue-600 transition-all font-bold text-slate-900 uppercase"
                                    value={cardData.name}
                                    onChange={(e) => handleCardChange('name', e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Vencimiento</label>
                                    <input
                                        type="text"
                                        placeholder="MM/AA"
                                        className="w-full px-6 py-4 rounded-2xl bg-white border-none outline-none focus:ring-2 focus:ring-blue-600 transition-all font-bold text-slate-900 text-center"
                                        value={cardData.expiry}
                                        onChange={(e) => handleCardChange('expiry', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">CVV</label>
                                    <input
                                        type="password"
                                        placeholder="***"
                                        className="w-full px-6 py-4 rounded-2xl bg-white border-none outline-none focus:ring-2 focus:ring-blue-600 transition-all font-bold text-slate-900 text-center"
                                        value={cardData.cvv}
                                        onChange={(e) => handleCardChange('cvv', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {error && (
                <div className="bg-red-50 p-6 rounded-[32px] border border-red-100 flex items-center gap-4 text-red-600 animate-in shake duration-500">
                    <XCircle className="w-6 h-6 shrink-0" />
                    <p className="text-sm font-black uppercase tracking-tight">{error}</p>
                </div>
            )}

            {paymentStatus === 'processing' && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white p-10 rounded-[40px] shadow-2xl flex flex-col items-center gap-6 animate-in zoom-in-95 duration-300">
                        <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-[32px] flex items-center justify-center">
                            <Loader2 className="w-10 h-10 animate-spin" />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-xl font-black text-slate-900">Procesando Pago</h3>
                            <p className="text-slate-400 font-medium italic">Esto tomará solo unos segundos...</p>
                        </div>
                    </div>
                </div>
            )}

            {paymentStatus === 'success' && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white p-10 rounded-[40px] shadow-2xl flex flex-col items-center gap-6 animate-in zoom-in-95 duration-300 border-b-8 border-green-500">
                        <div className="w-20 h-20 bg-green-50 text-green-600 rounded-[32px] flex items-center justify-center">
                            <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-xl font-black text-slate-900 uppercase">¡Pago Exitoso!</h3>
                            <p className="text-slate-400 font-medium">Generando tus entradas...</p>
                        </div>
                    </div>
                </div>
            )}

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 text-white py-6 rounded-[32px] font-black text-lg shadow-2xl shadow-blue-200 transition-all flex items-center justify-center gap-4 group active:scale-95"
            >
                {step === 'details' ? (
                    <>
                        <span>Continuar al Pago</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                ) : (
                    <>
                        <span>Pagar {formatCurrency(totalWithCharge)}</span>
                        <CheckCircle2 className="w-5 h-5" />
                    </>
                )}
            </button>
        </form>
    );
}
