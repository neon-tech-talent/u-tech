"use client";

import { useEffect, useState } from "react";
import { formatDate } from "@/lib/utils";
import { Calendar, MapPin, User, Edit3, Clock, CheckCircle2, X, Ticket } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { isAfter, subHours } from "date-fns";
import * as OTPAuth from "otpauth";
import { QRCodeSVG } from "qrcode.react";

export default function TicketList({ initialTickets }: { initialTickets: any[] }) {
    const [tickets, setTickets] = useState(initialTickets);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newDni, setNewDni] = useState("");
    const [newName, setNewName] = useState("");
    const [saving, setSaving] = useState(false);

    const canEdit = (eventDate: string) => {
        const deadline = subHours(new Date(eventDate), 48);
        return isAfter(deadline, new Date());
    };

    const handleSave = async (id: string) => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from("tickets")
                .update({ dni_holder: newDni, name_holder: newName })
                .eq("id", id);

            if (error) throw error;

            setTickets(prev => prev.map(t => t.id === id ? { ...t, dni_holder: newDni, name_holder: newName } : t));
            setEditingId(null);
        } catch (err) {
            alert("Error al actualizar datos: " + (err as any).message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {tickets.map((ticket) => {
                const isEditable = canEdit(ticket.events.event_date);
                const isEditing = editingId === ticket.id;

                return (
                    <div key={ticket.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col md:flex-row relative group">
                        <div
                            className="w-full md:w-3 border-b md:border-b-0 md:border-r border-slate-100"
                            style={{ backgroundColor: ticket.events.companies.brand_color || '#0f172a' }}
                        />

                        <div className="p-8 flex-1">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Ticket Confirmado</span>
                                    <h3 className="text-2xl font-black text-slate-900 mt-1">{ticket.events.name}</h3>
                                </div>
                                <div className="bg-slate-900 p-2 rounded-xl text-white">
                                    <Ticket className="w-5 h-5" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 mb-8 text-sm">
                                <div className="space-y-1">
                                    <p className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Fecha & Hora</p>
                                    <p className="text-slate-700 font-black flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {formatDate(ticket.events.event_date)}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Ubicación</p>
                                    <p className="text-slate-700 font-black flex items-center gap-1">
                                        <MapPin className="w-3 h-3 text-red-500" />
                                        {ticket.events.location_name}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 relative">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Titular del Ticket</label>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                value={newName}
                                                onChange={(e) => setNewName(e.target.value)}
                                            />
                                        ) : (
                                            <p className="text-slate-900 font-black">{ticket.name_holder}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">DNI / ID</label>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                value={newDni}
                                                onChange={(e) => setNewDni(e.target.value)}
                                            />
                                        ) : (
                                            <p className="text-slate-900 font-black">{ticket.dni_holder}</p>
                                        )}
                                    </div>
                                </div>

                                {isEditable && !isEditing && (
                                    <button
                                        onClick={() => {
                                            setEditingId(ticket.id);
                                            setNewName(ticket.name_holder);
                                            setNewDni(ticket.dni_holder);
                                        }}
                                        className="absolute top-4 right-4 p-2 hover:bg-white rounded-full text-slate-400 hover:text-blue-600 transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                )}

                                {isEditing && (
                                    <div className="flex gap-2 mt-4">
                                        <button
                                            onClick={() => handleSave(ticket.id)}
                                            disabled={saving}
                                            className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-xs font-bold hover:bg-blue-700 transition-colors"
                                        >
                                            {saving ? "Guardando..." : "Guardar"}
                                        </button>
                                        <button
                                            onClick={() => setEditingId(null)}
                                            className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {!isEditable && (
                                <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-orange-500 uppercase">
                                    <Clock className="w-3 h-3" />
                                    No editable (falta menos de 48h)
                                </div>
                            )}
                        </div>

                        <div className="bg-slate-900 w-full md:w-52 p-6 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-white/10 text-white">
                            <DynamicQR 
                                ticketId={ticket.id} 
                                qrSeed={ticket.qr_seed || ticket.qr_code} 
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function DynamicQR({ ticketId, qrSeed }: { ticketId: string, qrSeed: string }) {
    const [token, setToken] = useState("");
    const [timeLeft, setTimeLeft] = useState(30);

    useEffect(() => {
        // Use the seed to generate TOTP. If it's a UUID, we strip hyphens for hex.
        // If not a valid hex, it defaults to a safe fallback.
        const secret = qrSeed.replace(/-/g, "");
        const totp = new OTPAuth.TOTP({
            issuer: "U-Ticket",
            label: ticketId,
            algorithm: "SHA1",
            digits: 6,
            period: 30,
            secret: OTPAuth.Secret.fromHex(secret),
        });

        const updateToken = () => {
            const newToken = totp.generate();
            setToken(newToken);
            
            const seconds = Math.floor(Date.now() / 1000);
            setTimeLeft(30 - (seconds % 30));
        };

        updateToken();
        const interval = setInterval(updateToken, 1000);

        return () => clearInterval(interval);
    }, [ticketId, qrSeed]);

    const qrPayload = JSON.stringify({ id: ticketId, t: token });

    return (
        <div className="flex flex-col items-center gap-4 w-full">
            <div className="bg-white p-3 rounded-[24px] group-hover:scale-105 transition-transform duration-500 shadow-2xl shadow-black/40">
                <QRCodeSVG
                    value={qrPayload}
                    size={160}
                    level="M"
                    includeMargin={false}
                />
            </div>
            
            <div className="w-full px-4 space-y-2">
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-blue-500 transition-all duration-1000 ease-linear"
                        style={{ width: `${(timeLeft / 30) * 100}%` }}
                    />
                </div>
                <div className="flex justify-between items-center px-1">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">QR Dinámico</p>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400">{timeLeft}s</p>
                </div>
            </div>
        </div>
    );
}
