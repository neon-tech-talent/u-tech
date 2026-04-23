"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, Mail, Lock, ArrowRight, Ticket, Loader2 } from "lucide-react";

export default function RegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    }
                }
            });

            if (signUpError) throw signUpError;

            // If Supabase is configured with "Confirm Email", the user session won't be created immediately
            setSuccess(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white p-10 rounded-[40px] shadow-xl shadow-slate-200/50 max-w-md w-full text-center space-y-6">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Mail className="w-10 h-10" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Revisa tu correo</h2>
                    <p className="text-slate-500 font-medium">
                        Hemos enviado un enlace de confirmación a <span className="font-bold text-slate-900">{email}</span>. Por favor revisa tu bandeja de entrada o spam para activar tu cuenta.
                    </p>
                    <Link
                        href="/login"
                        className="inline-block mt-4 text-blue-600 font-bold hover:underline"
                    >
                        Volver a iniciar sesión
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center space-y-6">
                    <Link href="/" className="inline-flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-sm hover:shadow-md transition-all">
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center rotate-[-10deg]">
                            <Ticket className="w-5 h-5" />
                        </div>
                        <span className="text-2xl font-black tracking-tight text-slate-900">U-Ticket</span>
                    </Link>
                    <div className="space-y-2">
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Crea tu cuenta</h1>
                        <p className="text-slate-500 text-lg">Para comprar y gestionar tus entradas</p>
                    </div>
                </div>

                <div className="bg-white p-8 md:p-10 rounded-[40px] shadow-2xl shadow-slate-200/50">
                    <form onSubmit={handleRegister} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold text-center">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Nombre Completo</label>
                            <div className="relative">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400">
                                    <Shield className="w-5 h-5" />
                                </span>
                                <input
                                    type="text"
                                    required
                                    className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-50 border-none outline-none ring-2 ring-transparent focus:ring-blue-600 transition-all font-bold text-slate-900 placeholder:text-slate-400"
                                    placeholder="Juan Pérez"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Correo Electrónico</label>
                            <div className="relative">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400">
                                    <Mail className="w-5 h-5" />
                                </span>
                                <input
                                    type="email"
                                    required
                                    className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-50 border-none outline-none ring-2 ring-transparent focus:ring-blue-600 transition-all font-bold text-slate-900 placeholder:text-slate-400"
                                    placeholder="tu@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Contraseña</label>
                            <div className="relative">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400">
                                    <Lock className="w-5 h-5" />
                                </span>
                                <input
                                    type="password"
                                    required
                                    className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-50 border-none outline-none ring-2 ring-transparent focus:ring-blue-600 transition-all font-bold text-slate-900 placeholder:text-slate-400"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-slate-900/20 hover:bg-slate-800 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                        >
                            {loading ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <>
                                    <span>Registrarse</span>
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>

                        <div className="text-center pt-2">
                            <p className="text-slate-500 font-medium">
                                ¿Ya tienes una cuenta?{" "}
                                <Link href="/login" className="text-blue-600 font-black hover:underline">
                                    Iniciar sesión
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
