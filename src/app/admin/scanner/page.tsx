"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { supabase } from "@/lib/supabase";
import { ScanFace, CheckCircle2, XCircle, AlertTriangle, RefreshCcw, Ticket } from "lucide-react";
import * as OTPAuth from "otpauth";

type ScanResult = null | "success" | "used" | "invalid" | "wrong_event";

export default function TicketScanner() {
    const [scanResult, setScanResult] = useState<ScanResult>(null);
    const [ticketData, setTicketData] = useState<any>(null);
    const [scriptLoaded, setScriptLoaded] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [isStarting, setIsStarting] = useState(false);
    const [events, setEvents] = useState<any[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [loadingEvents, setLoadingEvents] = useState(true);

    // Refs that survive renders
    const qrInstanceRef = useRef<any>(null);
    const processingRef = useRef(false);
    const mountedRef = useRef(true);

    // ── helpers ──────────────────────────────────────────────

    const stopCamera = async () => {
        if (qrInstanceRef.current) {
            try {
                const state = qrInstanceRef.current.getState?.();
                // state 2 = SCANNING, state 3 = PAUSED
                if (state === 2 || state === 3) {
                    await qrInstanceRef.current.stop();
                }
            } catch (_) {
                // ignore errors on stop — element may already be unmounted
            }
            qrInstanceRef.current = null;
        }
        // Belt-and-suspenders: kill any lingering camera tracks
        try {
            const tracks = await navigator.mediaDevices
                .getUserMedia({ video: true })
                .then(s => s.getTracks())
                .catch(() => []);
            tracks.forEach(t => t.stop());
        } catch (_) { }
    };

    const startCamera = async () => {
        if (!mountedRef.current) return;
        if (!(window as any).Html5Qrcode) return;
        if (isStarting) return;

        await stopCamera(); // clean up any existing instance first

        setIsStarting(true);
        setCameraError(null);
        processingRef.current = false;

        const Html5Qrcode = (window as any).Html5Qrcode;

        // The element MUST exist in DOM before we start
        const el = document.getElementById("qr-reader");
        if (!el) {
            setIsStarting(false);
            return;
        }

        // Clear stale markup left by a previous instance
        el.innerHTML = "";

        try {
            const scanner = new Html5Qrcode("qr-reader");
            qrInstanceRef.current = scanner;

            await scanner.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 240, height: 240 } },
                handleScanSuccess,
                () => { } // ignore per-frame decode errors
            );
        } catch (err: any) {
            console.error("Camera error:", err);
            if (mountedRef.current) {
                setCameraError("No se pudo acceder a la cámara. Asegurate de permitir el acceso y recargá la página.");
            }
        } finally {
            if (mountedRef.current) setIsStarting(false);
        }
    };

    const handleScanSuccess = async (decodedText: string) => {
        if (processingRef.current || !mountedRef.current) return;
        processingRef.current = true;

        await stopCamera();

        try {
            // 1. Parse JSON payload
            let ticketId: string;
            let scannedToken: string;

            try {
                const payload = JSON.parse(decodedText);
                ticketId = payload.id;
                scannedToken = payload.t;
            } catch (e) {
                // Fallback for legacy QR codes (direct string)
                ticketId = decodedText;
                scannedToken = ""; 
            }

            if (!ticketId) {
                setScanResult("invalid");
                return;
            }

            const { data, error } = await supabase
                .from("tickets")
                .select("*, ticket_types(name)")
                .eq("id", ticketId.length === 36 ? ticketId : "00000000-0000-0000-0000-000000000000") // Basic UUID check
                .or(`id.eq.${ticketId},qr_code.eq.${ticketId}`) // Try both ID and legacy QR code
                .maybeSingle();

            if (!mountedRef.current) return;

            if (error || !data) {
                setScanResult("invalid");
                return;
            }

            // 2. Check if ticket belongs to the selected event
            if (data.event_id !== selectedEventId) {
                setTicketData(data);
                setScanResult("wrong_event");
                return;
            }

            // 3. Validate TOTP if token is present
            if (scannedToken) {
                const secret = (data.qr_seed || data.qr_code).replace(/-/g, "");
                const totp = new OTPAuth.TOTP({
                    issuer: "U-Ticket",
                    label: data.id,
                    algorithm: "SHA1",
                    digits: 6,
                    period: 30,
                    secret: OTPAuth.Secret.fromHex(secret),
                });

                const delta = totp.validate({ token: scannedToken, window: 1 });
                if (delta === null) {
                    setScanResult("invalid");
                    return;
                }
            }

            setTicketData(data);

            if (data.status === "USED") {
                setScanResult("used");
            } else if (data.status === "VALID") {
                const { error: updateError } = await supabase
                    .from("tickets")
                    .update({ status: "USED" })
                    .eq("id", data.id);

                if (!mountedRef.current) return;

                if (updateError) {
                    alert("Error al actualizar la entrada.");
                    processingRef.current = false;
                    startCamera();
                    return;
                }
                setScanResult("success");
            } else {
                setScanResult("invalid");
            }
        } catch (err) {
            console.error(err);
            if (mountedRef.current) setScanResult("invalid");
        }
    };

    const resumeScanning = async () => {
        if (!mountedRef.current) return;
        setScanResult(null);
        setTicketData(null);
        setCameraError(null);
        processingRef.current = false;
        // Wait one frame so React flushes the state (shows the #qr-reader div)
        await new Promise(r => setTimeout(r, 80));
        startCamera();
    };

    // ── lifecycle ─────────────────────────────────────────────

    useEffect(() => {
        mountedRef.current = true;
        
        const fetchEvents = async () => {
            setLoadingEvents(true);
            const { data } = await supabase
                .from("events")
                .select("id, name, event_date")
                .order("event_date", { ascending: true });
            
            if (mountedRef.current && data) {
                setEvents(data);
            }
            setLoadingEvents(false);
        };

        fetchEvents();

        if (scriptLoaded && selectedEventId) startCamera();

        return () => {
            mountedRef.current = false;
            stopCamera();
        };
    }, [scriptLoaded, selectedEventId]);

    // ── render ────────────────────────────────────────────────

    return (
        <div className="max-w-xl mx-auto space-y-6">
            <Script
                src="https://unpkg.com/html5-qrcode"
                strategy="lazyOnload"
                onLoad={() => setScriptLoaded(true)}
            />

            <header className="mb-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl md:text-3xl font-black text-slate-800 flex items-center gap-3">
                        <ScanFace className="w-7 h-7 text-blue-600" />
                        Boletería
                    </h1>
                    {selectedEventId && (
                        <button 
                            onClick={() => {
                                stopCamera();
                                setSelectedEventId(null);
                                setScanResult(null);
                            }}
                            className="text-xs font-bold text-blue-600 hover:underline"
                        >
                            Cambiar Evento
                        </button>
                    )}
                </div>
                <p className="text-slate-500 text-sm mt-1">
                    {selectedEventId 
                        ? `Validando para: ${events.find(e => e.id === selectedEventId)?.name}`
                        : "Selecciona el evento para comenzar a escanear."}
                </p>
            </header>

            {!selectedEventId ? (
                <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-200 space-y-4">
                    <h2 className="text-lg font-bold text-slate-800 px-2">Seleccionar Evento</h2>
                    {loadingEvents ? (
                        <div className="flex justify-center py-10">
                            <RefreshCcw className="w-8 h-8 text-slate-200 animate-spin" />
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {events.map(event => (
                                <button
                                    key={event.id}
                                    onClick={() => setSelectedEventId(event.id)}
                                    className="flex flex-col items-start p-5 rounded-2xl border-2 border-slate-50 hover:border-blue-100 hover:bg-blue-50/30 transition-all text-left group"
                                >
                                    <span className="font-black text-slate-900 group-hover:text-blue-600 transition-colors">{event.name}</span>
                                    <span className="text-xs text-slate-400 font-medium">
                                        {new Date(event.event_date).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}
                                    </span>
                                </button>
                            ))}
                            {events.length === 0 && (
                                <p className="text-center py-10 text-slate-400 font-medium italic">No hay eventos disponibles.</p>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <>
            {/* ── Camera card — ALWAYS in DOM so Html5Qrcode can find #qr-reader ── */}
            <div className={`bg-white p-4 rounded-3xl shadow-sm border border-slate-200 ${scanResult ? "hidden" : ""}`}>
                {cameraError ? (
                    <div className="text-center py-12 space-y-4">
                        <XCircle className="w-12 h-12 text-red-400 mx-auto" />
                        <p className="text-red-600 font-bold text-sm">{cameraError}</p>
                        <button
                            onClick={resumeScanning}
                            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm"
                        >
                            Reintentar
                        </button>
                    </div>
                ) : (
                    <>
                        {/* This div MUST stay mounted — Html5Qrcode injects video inside it */}
                        <div id="qr-reader" className="w-full rounded-2xl overflow-hidden" style={{ minHeight: 300 }} />
                        {(isStarting || !scriptLoaded) && (
                            <p className="text-center text-sm text-slate-400 mt-3 animate-pulse">
                                Iniciando cámara…
                            </p>
                        )}
                    </>
                )}
                <p className="text-center text-xs text-slate-400 mt-3">
                    Apunta la cámara al código QR de la entrada
                </p>
            </div>

            {/* ── Result card ── */}
            {scanResult && (
                <div className={`p-8 rounded-3xl shadow-lg border-2 flex flex-col items-center text-center space-y-5
                    ${scanResult === "success" ? "bg-green-50 border-green-200" : ""}
                    ${scanResult === "used" ? "bg-amber-50 border-amber-200" : ""}
                    ${scanResult === "invalid" || scanResult === "wrong_event" ? "bg-red-50   border-red-200" : ""}
                `}>

                    {scanResult === "success" && (
                        <>
                            <div className="bg-green-500 text-white p-4 rounded-full shadow-lg shadow-green-500/30">
                                <CheckCircle2 className="w-14 h-14" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-green-700">ACCESO PERMITIDO</h2>
                                <p className="text-slate-600 text-sm mt-1">La entrada ha sido validada y marcada como utilizada.</p>
                            </div>
                        </>
                    )}

                    {scanResult === "used" && (
                        <>
                            <div className="bg-amber-500 text-white p-4 rounded-full shadow-lg shadow-amber-500/30">
                                <AlertTriangle className="w-14 h-14" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-amber-700">ENTRADA YA UTILIZADA</h2>
                                <p className="text-slate-600 text-sm mt-1">Esta entrada fue escaneada previamente.</p>
                            </div>
                        </>
                    )}

                    {(scanResult === "invalid" || scanResult === "wrong_event") && (
                        <>
                            <div className="bg-red-500 text-white p-4 rounded-full shadow-lg shadow-red-500/30">
                                <XCircle className="w-14 h-14" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-red-700">
                                    {scanResult === "wrong_event" ? "EVENTO INCORRECTO" : "ENTRADA INVÁLIDA"}
                                </h2>
                                <p className="text-slate-600 text-sm mt-1">
                                    {scanResult === "wrong_event" 
                                        ? "Esta entrada pertenece a otro evento." 
                                        : "El QR no corresponde a ninguna entrada válida."}
                                </p>
                            </div>
                        </>
                    )}

                    {ticketData && (
                        <div className="w-full bg-white p-5 rounded-2xl shadow-sm border border-slate-100 text-left">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                                Detalles del Asistente
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-xs text-slate-500">Titular</p>
                                    <p className="font-bold text-slate-900 text-sm">{ticketData.name_holder}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">DNI</p>
                                    <p className="font-bold text-slate-900 text-sm">{ticketData.dni_holder}</p>
                                </div>
                                <div className="col-span-2 pt-3 border-t border-slate-100">
                                    <p className="text-xs text-slate-500">Tipo de Entrada</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Ticket className="w-4 h-4 text-blue-600" />
                                        <p className="font-bold text-slate-900 text-sm">{ticketData.ticket_types?.name}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={resumeScanning}
                        className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
                    >
                        <RefreshCcw className="w-5 h-5" />
                        Escanear Siguiente
                    </button>
                </div>
            )}
            </>
            )}
        </div>
    );
}
