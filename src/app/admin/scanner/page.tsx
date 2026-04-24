"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { supabase } from "@/lib/supabase";
import { ScanFace, CheckCircle2, XCircle, AlertTriangle, RefreshCcw } from "lucide-react";

type ScanResult = null | "success" | "used" | "invalid";

export default function TicketScanner() {
    const [scanResult, setScanResult] = useState<ScanResult>(null);
    const [ticketData, setTicketData] = useState<any>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [scannerInstance, setScannerInstance] = useState<any>(null);

    // Function called by the Html5QrcodeScanner when a QR is read
    const handleScanSuccess = async (decodedText: string) => {
        if (!isScanning) return; // Prevent multiple reads
        setIsScanning(false);

        // Pause scanner if possible
        if (scannerInstance) {
            scannerInstance.pause(true);
        }

        try {
            // Verify token in DB
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
                // Update to used
                const { error: updateError } = await supabase
                    .from("tickets")
                    .update({ status: "USED" })
                    .eq("id", data.id);

                if (updateError) {
                    console.error("Error updating ticket", updateError);
                    alert("Error al actualizar la entrada en la base de datos.");
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

    const initializeScanner = () => {
        if (typeof window !== "undefined" && (window as any).Html5QrcodeScanner) {
            // Cleanup previous if exists
            if (scannerInstance) {
                scannerInstance.clear().catch(console.error);
            }

            const html5QrcodeScanner = new (window as any).Html5QrcodeScanner(
                "reader",
                { fps: 10, qrbox: { width: 250, height: 250 } },
                false
            );

            setScannerInstance(html5QrcodeScanner);
            setIsScanning(true);

            html5QrcodeScanner.render(
                (text: string) => handleScanSuccess(text),
                (errorMessage: any) => { /* Ignore background scan errors */ }
            );
        }
    };

    const resumeScanning = () => {
        setScanResult(null);
        setTicketData(null);
        setIsScanning(true);
        if (scannerInstance) {
            scannerInstance.resume();
        } else {
            initializeScanner();
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <Script
                src="https://unpkg.com/html5-qrcode"
                strategy="lazyOnload"
                onLoad={initializeScanner}
            />

            <header className="mb-8">
                <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                    <ScanFace className="w-8 h-8 text-blue-600" />
                    Boletería
                </h1>
                <p className="text-slate-500">Escanea los códigos QR de los usuarios para validar el acceso.</p>
            </header>

            {!scanResult ? (
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                    <div id="reader" className="w-full rounded-2xl overflow-hidden [&>*]:border-none [&>div>button]:bg-blue-600 [&>div>button]:text-white [&>div>button]:px-4 [&>div>button]:py-2 [&>div>button]:rounded-lg [&>div>button]:font-bold mt-4" />
                    <p className="text-center text-sm text-slate-400 mt-4">Apunta la cámara al código QR de la entrada</p>
                </div>
            ) : (
                <div className={`p-8 rounded-3xl shadow-lg border-2 flex flex-col items-center justify-center text-center space-y-6 animate-in zoom-in-95 duration-300
                    ${scanResult === 'success' ? 'bg-green-50 border-green-200' : ''}
                    ${scanResult === 'used' ? 'bg-amber-50 border-amber-200' : ''}
                    ${scanResult === 'invalid' ? 'bg-red-50 border-red-200' : ''}
                `}>

                    {scanResult === 'success' && (
                        <>
                            <div className="bg-green-500 text-white p-4 rounded-full shadow-lg shadow-green-500/30">
                                <CheckCircle2 className="w-16 h-16" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-3xl font-black text-green-700">ACCESO PERMITIDO</h2>
                                <p className="text-slate-600 font-medium">La entrada ha sido validada y marcada como utilizada.</p>
                            </div>
                        </>
                    )}

                    {scanResult === 'used' && (
                        <>
                            <div className="bg-amber-500 text-white p-4 rounded-full shadow-lg shadow-amber-500/30">
                                <AlertTriangle className="w-16 h-16" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-3xl font-black text-amber-700">ENTRADA YA UTILIZADA</h2>
                                <p className="text-slate-600 font-medium tracking-tight">Cuidado, esta entrada fue escaneada previamente.</p>
                            </div>
                        </>
                    )}

                    {scanResult === 'invalid' && (
                        <>
                            <div className="bg-red-500 text-white p-4 rounded-full shadow-lg shadow-red-500/30">
                                <XCircle className="w-16 h-16" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-3xl font-black text-red-700">ENTRADA INVÁLIDA</h2>
                                <p className="text-slate-600 font-medium">El código QR no pertenece a ningún evento válido en el sistema.</p>
                            </div>
                        </>
                    )}

                    {/* Ticket Details Box */}
                    {ticketData && (
                        <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-left mt-4">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Detalles del Asistente</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-slate-500">Titular</p>
                                    <p className="font-bold text-slate-900">{ticketData.name_holder}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">DNI</p>
                                    <p className="font-bold text-slate-900">{ticketData.dni_holder}</p>
                                </div>
                                <div className="col-span-2 pt-3 border-t border-slate-100">
                                    <p className="text-xs text-slate-500">Tipo de Entrada</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Ticket className="w-4 h-4 text-blue-600" />
                                        <p className="font-bold text-slate-900">{ticketData.ticket_types?.name}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={resumeScanning}
                        className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold flex flex-col items-center justify-center gap-1 hover:bg-slate-800 transition-colors mt-8"
                    >
                        <RefreshCcw className="w-5 h-5 mb-1" />
                        <span className="uppercase tracking-widest text-[10px]">Escanear Siguiente</span>
                    </button>
                </div>
            )}
        </div>
    );
}
