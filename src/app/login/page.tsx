"use client";

import { useState, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, ArrowRight, Ticket, Loader2 } from "lucide-react";

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get('redirect') || '/my-tickets';

    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) throw signInError;

            router.push(redirectTo);
        } catch (err: any) {
            setError(err.message === "Invalid login credentials"
                ? "Credenciales incorrectas o correo sin verificar."
                : err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-8 md:p-10 rounded-[40px] shadow-2xl shadow-slate-200/50">
            <form onSubmit={handleLogin} className="space-y-6">
                {error && (
                    <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold text-center">
                        {error}
                    </div>
                )}

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
                    className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-blue-600/20 hover:bg-blue-500 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                >
                    {loading ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                        <>
                            <span>Ingresar</span>
                            <ArrowRight className="w-5 h-5" />
                        </>
                    )}
                </button>

                <div className="text-center pt-4 border-t border-slate-100">
                    <p className="text-slate-500 font-medium pb-2">¿No tienes cuenta?</p>
                    <Link href="/register" className="inline-block w-full bg-slate-50 text-slate-900 py-4 rounded-2xl font-black text-base hover:bg-slate-100 transition-all">
                        Crear nueva cuenta
                    </Link>
                </div>
            </form>
        </div>
    );
}

export default function LoginPage() {
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
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Iniciar Sesión</h1>
                        <p className="text-slate-500 text-lg">Accede a tus entradas y configuraciones</p>
                    </div>
                </div>

                <Suspense fallback={
                    <div className="bg-white p-10 rounded-[40px] shadow-2xl shadow-slate-200/50 flex justify-center py-20">
                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                    </div>
                }>
                    <LoginForm />
                </Suspense>
            </div>
        </div>
    );
}
