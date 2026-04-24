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
    const scannerRef = useRef<any>(null);
    const processingRef = useRef(false);

    // Start the camera directly once script is ready
    const startCamera = () => {
        if (typeof window === "undefined" || !(window as any).Html5Qrcode) return;

        // Clear any previous instance
        if (scannerRef.current) {
            scannerRef.current.stop().catch(() => { }).finally(() => {
                scannerRef.current = null;
                initScanner();
            });
        } else {
            initScanner();
        }
    };

    const initScanner = () => {
        const Html5Qrcode = (window as any).Html5Qrcode;
        const scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;
        processingRef.current = false;

        scanner.start(
            { facingMode: "environment" }, // always use back camera
            { fps: 10, qrbox: { width: 240, height: 240 } },
            handleScanSuccess,
            () => { } // ignore non-fatal scan errors (ongoing frames)
        ).catch((err: any) => {
            console.error("Camera error:", err);
            setCameraError("No se pudo acceder a la cámara. Asegurate de permitir el acceso.");
        });
    };

    const handleScanSuccess = async (decodedText: string) => {
        if (processingRef.current) return;
        processingRef.current = true;

        // Stop scanning while we validate
        if (scannerRef.current) {
            await scannerRef.current.stop().catch(() => { });
        }

        try {
            const { data, error } = await supabase
                .from("tickets")
                .select("*, ticket_types(name)")
                .eq("qr_code", decodedText)
                .single();

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

                if (updateError) {
                    alert("Error al actualizar la entrada en la base de datos.");
                    processingRef.current = false;
                    return;
                }
                setScanResult("success");
            } else {
                setScanResult("invalid");
            }
        } catch (err) {
            console.error(err);
            setScanResult("invalid");
        }
    };

    const resumeScanning = () => {
        setScanResult(null);
        setTicketData(null);
        setCameraError(null);
        processingRef.current = false;
        // Small delay to allow the DOM element to reappear
        setTimeout(() => startCamera(), 100);
    };

    // Start camera as soon as the library script is loaded
    useEffect(() => {
        if (scriptLoaded) {
            startCamera();
        }
        return () => {
            if (scannerRef.current) {
                scannerRef.current.stop().catch(() => { });
            }
        };
    }, [scriptLoaded]);

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
                <p className="text-slate-500 text-sm mt-1">Escanea los códigos QR de los usuarios para validar el acceso.</p>
            </header>

            {!scanResult ? (
                <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200">
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
                            <div
                                id="qr-reader"
                                className="w-full rounded-2xl overflow-hidden"
                                style={{ minHeight: 300 }}
                            />
                            {!scriptLoaded && (
                                <p className="text-center text-sm text-slate-400 mt-4 animate-pulse">
                                    Iniciando cámara...
                                </p>
                            )}
                        </>
                    )}
                    <p className="text-center text-xs text-slate-400 mt-3">
                        Apunta la cámara al código QR de la entrada
                    </p>
                </div>
            ) : (
                <div className={`p-8 rounded-3xl shadow-lg border-2 flex flex-col items-center text-center space-y-5
                    ${scanResult === 'success' ? 'bg-green-50 border-green-200' : ''}
                    ${scanResult === 'used' ? 'bg-amber-50 border-amber-200' : ''}
                    ${scanResult === 'invalid' ? 'bg-red-50 border-red-200' : ''}
                `}>

                    {scanResult === 'success' && (
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

                    {scanResult === 'used' && (
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

                    {scanResult === 'invalid' && (
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
