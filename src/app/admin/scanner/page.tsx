"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { supabase } from "@/lib/supabase";
import { ScanFace, CheckCircle2, XCircle, AlertTriangle, RefreshCcw, Ticket } from "lucide-react";

type ScanResult = null | "success" | "used" | "invalid";

export default function TicketScanner() {
    const [scanResult, setScanResult] = useState<ScanResult>(null);
    const [ticketData, setTicketData] = useState<any>(null);
    const [scriptLoaded, setScriptLoaded] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [isStarting, setIsStarting] = useState(false);

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
            const { data, error } = await supabase
                .from("tickets")
                .select("*, ticket_types(name)")
                .eq("qr_code", decodedText)
                .single();

            if (!mountedRef.current) return;

            if (error || !data) {
                setScanResult("invalid");
                return;
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
        if (scriptLoaded) startCamera();

        return () => {
            // This runs when user navigates away
            mountedRef.current = false;
            stopCamera();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scriptLoaded]);

    // ── render ────────────────────────────────────────────────

    return (
        <div className="max-w-xl mx-auto space-y-6">
            <Script
                src="https://unpkg.com/html5-qrcode"
                strategy="lazyOnload"
                onLoad={() => setScriptLoaded(true)}
            />

            <header className="mb-6">
                <h1 className="text-2xl md:text-3xl font-black text-slate-800 flex items-center gap-3">
                    <ScanFace className="w-7 h-7 text-blue-600" />
                    Boletería
                </h1>
                <p className="text-slate-500 text-sm mt-1">
                    Escanea los códigos QR de los usuarios para validar el acceso.
                </p>
            </header>

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
                    ${scanResult === "invalid" ? "bg-red-50   border-red-200" : ""}
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

                    {scanResult === "invalid" && (
                        <>
                            <div className="bg-red-500 text-white p-4 rounded-full shadow-lg shadow-red-500/30">
                                <XCircle className="w-14 h-14" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-red-700">ENTRADA INVÁLIDA</h2>
                                <p className="text-slate-600 text-sm mt-1">El QR no corresponde a ninguna entrada válida.</p>
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
        </div>
    );
}
