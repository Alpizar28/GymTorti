"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { AlertCircle, DollarSign, Lock, LogOut, Moon, Search, Sun, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { createClient } from "@/lib/supabase";
import { type Session } from "@supabase/supabase-js";
import type {
  ClientResponse,
  ClientStatus,
  PaymentMethod,
  PaymentType,
  PaymentResponse,
} from "@/lib/types";
import { appConfig, getPrimaryGradient } from "@/config/app.config";
import { ClientesTab } from "./components/ClientesTab";
import { MedicionesTab } from "./components/MedicionesTab";
import { PagosTab } from "./components/PagosTab";
import "./tabs-theme.css";
import "@/styles/dark-mode.css";
import gymLogo from "../../../recursos/logo.jpg";
import type { Cliente, ClienteFormData, Medicion, Pago } from "./types";

import { sendPaymentReceipt } from "@/app/actions";
type ClienteExtras = Pick<Cliente, "contactoEmergencia">;

const LS_CLIENT_EXTRAS = "mastergym-client-extras";

// Currency formatter based on app config
const currencyFormatter = new Intl.NumberFormat(
  appConfig.product.currency.code === "USD" ? "en-US" : "es-CR",
  {
    style: "currency",
    currency: appConfig.product.currency.code,
    minimumFractionDigits: appConfig.product.currency.decimals,
    maximumFractionDigits: appConfig.product.currency.decimals
  }
);

const HEADER_IMAGE = gymLogo;

function friendlyError(err: unknown) {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string") return err;
  return "Error inesperado";
}

function safeReadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWriteJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function ymd(date: Date) {
  return date.toISOString().split("T")[0];
}

function parseLocalDate(value: string): Date | null {
  if (!value) return null;
  const dateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) {
    const year = Number(dateOnly[1]);
    const month = Number(dateOnly[2]) - 1;
    const day = Number(dateOnly[3]);
    return new Date(year, month, day);
  }
  const dateTime = value.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (dateTime) {
    const year = Number(dateTime[1]);
    const month = Number(dateTime[2]) - 1;
    const day = Number(dateTime[3]);
    const hour = Number(dateTime[4]);
    const minute = Number(dateTime[5]);
    const second = Number(dateTime[6] ?? "0");
    return new Date(year, month, day, hour, minute, second);
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function buildPhone(codigo: string, numero: string) {
  const digitsCode = codigo.replace(/\D/g, "");
  const digitsNumber = numero.replace(/\D/g, "");
  if (!digitsCode && !digitsNumber) return "";
  if (!digitsCode) return digitsNumber;
  if (!digitsNumber) return `+${digitsCode}`;
  return `+${digitsCode}${digitsNumber}`;
}

function computeEstado(backendStatus: ClientStatus, fechaVencimiento?: string | null): Cliente["estado"] {
  // Mapear status de DB a estado de UI
  // DB usa: 'active' | 'inactive' 
  // UI usa: 'activo' | 'inactivo' | 'vencido' | 'por-vencer'

  // Si es inactive, es inactivo
  if (backendStatus === "inactive" || backendStatus === "INACTIVO") return "inactivo";

  // Si es active, verificar fecha de vencimiento para subcategorizarnos
  if (backendStatus === "active") {
    if (!fechaVencimiento) return "activo"; // Activo sin fecha = activo

    const vencimiento = new Date(fechaVencimiento);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    vencimiento.setHours(0, 0, 0, 0);

    const diasParaVencer = Math.ceil((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

    if (diasParaVencer < 0) return "vencido"; // Ya venció
    if (diasParaVencer <= 7) return "por-vencer"; // Vence pronto
    return "activo"; // Activo normal
  }

  // Legacy: MOROSO
  if (backendStatus === "MOROSO") return "vencido";

  // Default
  return "inactivo";
}

function paymentMethodFromUi(metodoPago: Pago["metodoPago"]): PaymentMethod {
  if (metodoPago === "efectivo") return "CASH";
  if (metodoPago === "tarjeta") return "CARD";
  return "SINPE";
}

function uiMetodoFromBackend(method?: PaymentMethod): Pago["metodoPago"] {
  switch (method) {
    case "CARD":
      return "tarjeta";
    case "SINPE":
      return "sinpe";
    default:
      return "efectivo";
  }
}



function tipoPagoFromPayment(paymentType?: PaymentType, notes?: string | null): Pago["tipoPago"] {
  switch (paymentType) {
    case "DAILY_MEMBERSHIP":
      return "diario";
    case "QUARTERLY_MEMBERSHIP":
    case "SEMESTER_MEMBERSHIP":
    case "ANNUAL_MEMBERSHIP":
      return "mensual";
    case "MONTHLY_MEMBERSHIP":
    default:
      break;
  }

  const match = notes?.match(/tipoPago:\\s*(diario|mensual|pareja|universidad|colegio)/i);
  const fromNotes = match?.[1]?.toLowerCase();
  if (
    fromNotes === "diario" ||
    fromNotes === "mensual" ||
    fromNotes === "pareja" ||
    fromNotes === "universidad" ||
    fromNotes === "colegio"
  ) {
    return fromNotes as Pago["tipoPago"];
  }
  return "mensual";
}

export function FigmaApp({ defaultTab }: { defaultTab?: "clientes" | "pagos" | "mediciones" }) {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginLoading, setLoginLoading] = useState(false);
  const [backendClients, setBackendClients] = useState<ClientResponse[]>([]);
  const [backendPayments, setBackendPayments] = useState<PaymentResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uiError, setUiError] = useState<string | null>(null);


  const [clientExtras, setClientExtras] = useState<Record<string, ClienteExtras>>({});
  const [mediciones, setMediciones] = useState<Medicion[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [uiMode, setUiMode] = useState<"light" | "dark">(appConfig.uiMode);
  const [isRegistering, setIsRegistering] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    setClientExtras(safeReadJson<Record<string, ClienteExtras>>(LS_CLIENT_EXTRAS, {}));

  }, []);

  useEffect(() => {
    safeWriteJson(LS_CLIENT_EXTRAS, clientExtras);
  }, [clientExtras]);

  // Aplicar tema global (dark/light) a nivel de HTML/Body
  useEffect(() => {
    const root = document.documentElement;
    const mode = uiMode;
    const surfaces = appConfig.surfaces[mode];

    // 1. Clase dark
    if (mode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // 2. Variables de colores neutros (Surfaces)
    root.style.setProperty("--background", surfaces.background);
    root.style.setProperty("--surface", surfaces.surface);
    root.style.setProperty("--surface-hover", surfaces.surfaceHover);
    root.style.setProperty("--border", surfaces.border);

    // Mapeos para consistencia con shadcn y nuestro sistema
    root.style.setProperty("--foreground", surfaces.text);         // shadcn standard
    root.style.setProperty("--text", surfaces.text);               // nuestro standard legacy
    root.style.setProperty("--muted-foreground", surfaces.textMuted); // shadcn standard
    root.style.setProperty("--text-muted", surfaces.textMuted);    // nuestro standard legacy
    root.style.setProperty("--border", surfaces.border);           // shadcn borders
    root.style.setProperty("--input", surfaces.border);            // shadcn inputs border
    root.style.setProperty("--input-background", surfaces.surface);// shadcn inputs bg
    root.style.setProperty("--card", surfaces.surface);            // shadcn cards
    root.style.setProperty("--card-foreground", surfaces.text);    // shadcn cards text
    root.style.setProperty("--popover", surfaces.surface);         // shadcn popovers
    root.style.setProperty("--popover-foreground", surfaces.text); // shadcn popovers text


    // 3. Variables de colores primarios
    root.style.setProperty("--theme-primary-from", appConfig.theme.primary.from);
    root.style.setProperty("--theme-primary-to", appConfig.theme.primary.to);
    root.style.setProperty("--theme-primary-solid", appConfig.theme.primary.solid);
    root.style.setProperty("--theme-primary-hover", appConfig.theme.primary.hover);
    root.style.setProperty("--theme-primary-active", appConfig.theme.primary.active);
  }, [uiMode]);


  /* 
   * REFACTOR NOTE: Local API calls have been replaced by Supabase Client calls.
   * This ensures the template works 100% cloud-native.
   */


  async function loadAll() {
    setError(null);
    try {
      const supabase = createClient();

      // 1. Load Clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (clientsError) throw clientsError;

      // 2. Load Payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .order('date', { ascending: false });

      if (paymentsError) throw paymentsError;

      // 3. Load Measurements
      const { data: measurementsData, error: measurementsError } = await supabase
        .from('measurements')
        .select('*')
        .order('fecha', { ascending: false });

      if (measurementsError) throw measurementsError;

      // Map Supabase Data -> UI State
      // Note: We need to adapt the DB column names to what the UI expects (legacy)
      // or update the UI. For this refactor, we map to preserve UI.

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mappedClients = (clientsData || []).map((c: any) => ({
        id: c.id,
        gymId: 0, // Legacy
        nombre: c.first_name,
        apellido: c.last_name,
        cedula: c.cedula || '', // Now mapped from DB
        telefono: c.phone,
        email: c.email,
        estado: c.status?.toUpperCase() || 'INACTIVO',
        fechaRegistro: c.created_at,
        notas: c.notes
      } as ClientResponse));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mappedPayments = (paymentsData || []).map((p: any) => ({
        id: p.id, // UUID in DB, but UI might expect number? Check usage. 
        // types.ts defined id as number in ClientResponse/PaymentResponse. 
        // We might need to cast or update types. Let's cast to any for now to avoid break.
        clientId: p.client_id,
        amount: String(p.amount),
        paymentDate: p.date,
        paymentMethod: p.method?.toUpperCase(),
        notes: p.notes,
        paymentType: 'MONTHLY_MEMBERSHIP' // Default or derive
      } as unknown as PaymentResponse));

      setBackendClients(mappedClients);
      setBackendPayments(mappedPayments);

      setMediciones(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (measurementsData || []).map((m: any) => ({
          id: String(m.id),
          clienteId: String(m.client_id),
          fecha: m.fecha,
          peso: Number(m.peso),
          altura: Number(m.altura),
          pechoCm: Number(m.pecho_cm),
          cinturaCm: Number(m.cintura_cm),
          caderaCm: Number(m.cadera_cm),
          brazoIzqCm: Number(m.brazo_izq_cm),
          brazoDerCm: Number(m.brazo_der_cm),
          piernaIzqCm: Number(m.pierna_izq_cm),
          piernaDerCm: Number(m.pierna_der_cm),
          grasaCorporal: Number(m.grasa_corporal),
          notas: m.notas,
        }))
      );

    } catch (err) {
      const msg = friendlyError(err) || "Error cargando datos";
      // Handle Supabase Auth errors if needed
      if (msg.includes('JWT') || msg.includes('401')) {
        // Session handled by onAuthStateChange
      }
      setError(msg);
    }
  }


  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const username = loginForm.username.trim();
    const password = loginForm.password;
    if (!username || !password) {
      setAuthError("Usuario y contraseña son obligatorios.");
      return;
    }
    setLoginLoading(true);
    setAuthError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: username,
        password: password,
      });

      if (error) {
        setAuthError(error.message);
      } else {
        setLoginForm({ username: "", password: "" });
      }
    } catch {
      setAuthError("Error inesperado al iniciar sesión.");
    } finally {
      setLoginLoading(false);
    }
  }

  function handleLogout() {
    supabase.auth.signOut();
    setError(null);
    setUiError(null);
  }

  useEffect(() => {
    if (!session) return;
    loadAll();
  }, [session]);

  const latestPaymentByClient = useMemo(() => {
    const map = new Map<string, PaymentResponse>();
    backendPayments.forEach((payment) => {
      const key = String(payment.clientId);
      const current = map.get(key);
      if (!current || new Date(payment.paymentDate) > new Date(current.paymentDate)) {
        map.set(key, payment);
      }
    });
    return map;
  }, [backendPayments]);

  const clientesAll: Cliente[] = useMemo(() => {
    return backendClients.map((c) => {
      const id = String(c.id);
      const extras = clientExtras[id];
      const fechaInicio = c.fechaInicioMembresia ?? c.fechaRegistro?.slice(0, 10) ?? ymd(new Date());
      const fechaVencimiento = c.fechaVencimiento ?? "";
      const lastPayment = latestPaymentByClient.get(id);
      const tipoMembresia = tipoPagoFromPayment(lastPayment?.paymentType, lastPayment?.notes);

      return {
        id,
        nombre: c.nombre,
        apellido: c.apellido ?? "",
        cedula: c.cedula ?? "",
        email: c.email ?? "",
        telefono: c.telefono ?? "",
        fechaInicio,
        fechaVencimiento,
        estado: computeEstado(c.estado, c.fechaVencimiento),
        tipoMembresia,
        contactoEmergencia: extras?.contactoEmergencia || undefined,
        observaciones: c.notas ?? undefined,
      };
    });
  }, [backendClients, clientExtras, latestPaymentByClient]);

  const pagosAll: Pago[] = useMemo(() => {
    return backendPayments.map((p) => {
      return {
        id: String(p.id),
        clienteId: String(p.clientId),
        monto: Number.parseFloat(p.amount),
        fecha: p.paymentDate,
        tipoPago: tipoPagoFromPayment(p.paymentType, p.notes),
        metodoPago: uiMetodoFromBackend(p.paymentMethod),
        referencia: p.reference ?? undefined,
      };
    });
  }, [backendPayments]);

  const clientesFiltrados = useMemo(() => {
    if (!searchQuery.trim()) return clientesAll;
    const query = searchQuery.toLowerCase();
    return clientesAll.filter(
      (cliente) =>
        cliente.nombre.toLowerCase().includes(query) ||
        cliente.apellido.toLowerCase().includes(query) ||
        (cliente.cedula ? cliente.cedula.includes(query) : false) ||
        cliente.email.toLowerCase().includes(query) ||
        cliente.telefono.includes(query) ||
        cliente.estado.toLowerCase().includes(query)
    );
  }, [clientesAll, searchQuery]);

  const clientesActivos = clientesAll.filter((c) => c.estado === "activo" || c.estado === "por-vencer").length;
  const clientesVencidos = clientesAll.filter((c) => c.estado === "vencido").length;
  const clientesPorVencer = clientesAll.filter((c) => c.estado === "por-vencer").length;
  const clientesInactivos = clientesAll.filter((c) => c.estado === "inactivo").length;

  const now = new Date();
  const currentMonthKey = monthKey(now);
  const pagosConFecha = pagosAll
    .map((p) => ({ ...p, parsedFecha: parseLocalDate(p.fecha) }))
    .filter((p) => p.parsedFecha !== null) as (Pago & { parsedFecha: Date })[];
  const pagosMesActual = pagosConFecha.filter((p) => monthKey(p.parsedFecha) === currentMonthKey);
  const pagosFallback = pagosMesActual.length > 0 ? pagosMesActual : pagosConFecha;
  const ingresosMes = pagosFallback.reduce((sum, p) => sum + p.monto, 0);

  async function handleCreateCliente(cliente: ClienteFormData) {
    setError(null);
    try {
      const { data, error } = await supabase
        .from("clients")
        .insert({
          first_name: cliente.nombre,
          last_name: cliente.apellido,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          cedula: cliente.cedula || null, // Assuming column name is 'cedula' based on types
          email: cliente.email || null,
          phone: buildPhone(cliente.telefonoCodigo, cliente.telefonoNumero),
          notes: cliente.observaciones,
          status: "inactive" // Will become 'active' automatically when subscription is added
        })
        .select()
        .single();

      if (error) throw error;

      setClientExtras((prev) => ({
        ...prev,
        [String(data.id)]: {
          contactoEmergencia: cliente.contactoEmergencia,
        },
      }));

      await loadAll();
    } catch (err) {
      console.error("Error creating client:", err);
      setError(friendlyError(err));
    }
  }

  async function handleUpdateCliente(clienteId: string, cliente: ClienteFormData) {
    setError(null);
    try {
      const { error } = await supabase
        .from("clients")
        .update({
          first_name: cliente.nombre,
          last_name: cliente.apellido,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          cedula: cliente.cedula || null,
          email: cliente.email || null,
          phone: buildPhone(cliente.telefonoCodigo, cliente.telefonoNumero),
          notes: cliente.observaciones,
        })
        .eq("id", clienteId);

      if (error) throw error;

      setClientExtras((prev) => ({
        ...prev,
        [clienteId]: {
          contactoEmergencia: cliente.contactoEmergencia,
        },
      }));

      await loadAll();
    } catch (err) {
      console.error("Error updating client:", err);
      setError(friendlyError(err));
    }
  }

  async function handleDeleteCliente(clienteId: string) {
    setError(null);
    try {
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", clienteId);

      if (error) throw error;

      setClientExtras((prev) => {
        const next = { ...prev };
        delete next[clienteId];
        return next;
      });

      await loadAll();
    } catch (err) {
      console.error("Error deleting client:", err);
      setError(friendlyError(err));
    }
  }

  async function handleCreatePago(pago: Omit<Pago, "id">) {
    setError(null);
    try {

      // 1. Create Subscription First to trigger 'active' status
      const durationDays = pago.tipoPago === "diario" ? 1 : 30;
      const startDate = new Date(pago.fecha);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + durationDays);

      const { data: subData, error: subError } = await supabase
        .from("subscriptions")
        .insert({
          client_id: pago.clienteId,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          active: true,
          payment_status: 'paid'
        })
        .select()
        .single();

      if (subError) throw subError;

      // 2. Create Payment linked to Subscription
      // Encode paymentType in notes as legacy logic expects
      const notesWithPaymentType = `tipoPago: ${pago.tipoPago} ${pago.referencia || ""}`.trim();

      const { error } = await supabase
        .from("payments")
        .insert({
          client_id: pago.clienteId,
          subscription_id: subData.id, // Linked!
          amount: pago.monto,
          currency: appConfig.product.currency.code,
          method: paymentMethodFromUi(pago.metodoPago),
          date: pago.fecha,
          reference: pago.referencia || null,
          notes: notesWithPaymentType,
        });

      if (error) {
        // Rollback subscription if payment fails (best effort)
        await supabase.from("subscriptions").delete().eq("id", subData.id);
        throw error;
      }

      // Email Notification Integration
      const cliente = clientesAll.find(c => c.id === pago.clienteId);
      if (cliente && cliente.email) {
        console.log("📧 Sending receipt to:", cliente.email);
        try {
          const emailResult = await sendPaymentReceipt({
            toEmail: cliente.email,
            clientName: `${cliente.nombre} ${cliente.apellido}`,
            amount: pago.monto,
            date: new Date(pago.fecha).toLocaleDateString("es-CR"),
            concept: `Membresía ${pago.tipoPago}`,
            reference: pago.referencia,
            currencySymbol: appConfig.product.currency.symbol
          });
          if (!emailResult.success) {
            console.warn("⚠️ Email receipt failed:", emailResult.message || emailResult.error);
          }
        } catch (emailErr) {
          console.error("⚠️ Email receipt error:", emailErr);
        }
      }

      await loadAll();
    } catch (err) {
      console.error("Error creating payment:", err);
      const msg = (err instanceof Error ? err.message : null) || "Error registrando pago";
      const friendly =
        msg.toLowerCase().includes("date") || msg.toLowerCase().includes("futura")
          ? "La fecha de pago no puede ser futura."
          : msg;
      setUiError(friendly);
    }
  }

  async function handleDeletePago(pagoId: string) {
    setError(null);
    try {
      // 1. Fetch payment to find linked subscription
      const { data: paymentData, error: fetchError } = await supabase
        .from("payments")
        .select("subscription_id")
        .eq("id", pagoId)
        .single();

      if (fetchError) throw fetchError;

      // 2. Delete payment
      const { error } = await supabase
        .from("payments")
        .delete()
        .eq("id", pagoId);

      if (error) throw error;

      // 3. Delete linked subscription if exists (This triggers client status update to inactive!)
      if (paymentData?.subscription_id) {
        const { error: subError } = await supabase
          .from("subscriptions")
          .delete()
          .eq("id", paymentData.subscription_id);

        if (subError) console.warn("Could not delete linked subscription:", subError);
      }

      await loadAll();
    } catch (err) {
      console.error("Error deleting payment:", err);
      setError(friendlyError(err));
    }
  }

  async function handleCreateMedicion(medicion: Omit<Medicion, "id">) {
    setError(null);
    try {
      const { error } = await supabase.from("measurements").insert({
        client_id: medicion.clienteId,
        fecha: medicion.fecha, // Column is 'fecha' (DATE)
        peso: Number(medicion.peso),
        altura: Number(medicion.altura),
        pecho_cm: Number(medicion.pechoCm),
        cintura_cm: Number(medicion.cinturaCm),
        cadera_cm: Number(medicion.caderaCm),
        brazo_izq_cm: Number(medicion.brazoIzqCm),
        brazo_der_cm: Number(medicion.brazoDerCm),
        pierna_izq_cm: Number(medicion.piernaIzqCm),
        pierna_der_cm: Number(medicion.piernaDerCm),
        grasa_corporal: medicion.grasaCorporal ? Number(medicion.grasaCorporal) : null,
        notas: medicion.notas,
      });

      if (error) throw error;
      await loadAll();
    } catch (err) {
      console.error("Error creating measurement:", err);
      setError(friendlyError(err));
    }
  }

  async function handleDeleteMedicion(id: string) {
    setError(null);
    try {
      const { error } = await supabase
        .from("measurements")
        .delete()
        .eq("id", id);

      if (error) throw error;
      await loadAll();
    } catch (err) {
      console.error("Error deleting measurement:", err);
      setError(friendlyError(err));
    }
  }



  if (!authReady) {
    return (
      <div className="min-h-screen bg-background p-6 text-muted">
        Cargando...
      </div>
    );
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = loginForm.username.trim();
    const password = loginForm.password;

    if (!email || !password) {
      setAuthError("Completa todos los campos.");
      return;
    }

    // WHITELIST CHECK
    const whitelist = appConfig.auth.whitelist || [];
    // If whitelist has entries, we strictly enforce it
    if (whitelist.length > 0 && !whitelist.includes(email)) {
      setAuthError("⛔ Correo no autorizado para este gimnasio.");
      return;
    }

    setLoginLoading(true);
    setAuthError(null);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setAuthError(error.message);
      } else {
        setAuthError(null);
        alert("✅ Registro exitoso. ¡Bienvenido!");
        // Auto login logic usually handled by Supabase if autoConfirm is on, 
        // otherwise user needs to check email. Assuming auto-login or session update.
      }
    } catch {
      setAuthError("Error al registrarse.");
    } finally {
      setLoginLoading(false);
    }
  }
  if (!session) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto flex min-h-[70vh] max-w-md items-center">
          <Card className="w-full overflow-hidden rounded-3xl border-border bg-surface shadow-xl">
            <CardHeader className="border-b border-border bg-surface-hover">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl p-3" style={{ background: getPrimaryGradient() }}>
                  <Lock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-black text-foreground">
                    {isRegistering ? "Registro de Staff" : "Acceso al gimnasio"}
                  </CardTitle>
                  <p className="text-sm text-muted">
                    {isRegistering ? "Crea tu cuenta autorizada" : "Ingresa tus credenciales"}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <form className="space-y-4" onSubmit={isRegistering ? handleRegister : handleLogin}>
                <Input
                  placeholder="Correo Electrónico"
                  type="email"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm((prev) => ({ ...prev, username: e.target.value }))}
                  className="rounded-xl"
                  required
                />
                <Input
                  type="password"
                  placeholder="Contraseña"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
                  className="rounded-xl"
                  required
                  minLength={6}
                />
                {authError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 font-medium flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {authError}
                  </div>
                )}

                <div className="pt-2">
                  <Button
                    type="submit"
                    className="w-full rounded-xl text-white shadow-lg font-bold"
                    style={{ background: getPrimaryGradient() }}
                    disabled={loginLoading}
                  >
                    {loginLoading ? "Procesando..." : (isRegistering ? "Crear Cuenta" : "Ingresar")}
                  </Button>
                </div>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    className="text-sm text-muted-foreground hover:text-foreground underline transition-colors"
                    onClick={() => {
                      setIsRegistering(!isRegistering);
                      setAuthError(null);
                    }}
                  >
                    {isRegistering ? "¿Ya tienes cuenta? Inicia Sesión" : "¿No tienes cuenta? Solicita acceso"}
                  </button>
                </div>

              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Dialog open={uiError !== null} onOpenChange={(open) => (!open ? setUiError(null) : null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
            <DialogDescription>{uiError}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button
              onClick={() => setUiError(null)}
              className="rounded-xl text-white"
              style={{ background: getPrimaryGradient() }}
            >
              Entendido
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div
        className="shadow-xl"
        style={{
          background: `linear-gradient(to right, ${appConfig.theme.primary.from}, ${appConfig.theme.primary.to})`
        }}
      >
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-white p-3 shadow-lg">
                <Image src={HEADER_IMAGE} alt={`${appConfig.gymName} Logo`} width={48} height={48} className="h-12 w-12 rounded-xl object-cover" />
              </div>
              <div>
                <h1 className="font-black tracking-tight text-white" style={{ fontSize: "2rem" }}>
                  {appConfig.gymName}
                </h1>
                <p className="text-white/90">{appConfig.gymTagline}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {clientesPorVencer > 0 && (
                <Badge variant="secondary" className="flex items-center gap-2 bg-yellow-500 px-4 py-2 text-white hover:bg-yellow-600">
                  <AlertCircle className="h-4 w-4" />
                  {clientesPorVencer} por vencer
                </Badge>
              )}
              {clientesVencidos > 0 && (
                <Badge
                  variant="destructive"
                  className="flex items-center gap-2 bg-white px-4 py-2 text-gray-900 hover:bg-white/90"
                >
                  <AlertCircle className="h-4 w-4" />
                  {clientesVencidos} vencida{clientesVencidos !== 1 ? "s" : ""}
                </Badge>
              )}
              <Button
                size="icon"
                onClick={() => setUiMode(uiMode === "dark" ? "light" : "dark")}
                className="h-10 w-10 rounded-xl bg-white text-gray-900 shadow-md transition hover:bg-white/90"
                aria-label="Cambiar tema"
              >
                {uiMode === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>

              <Button
                onClick={handleLogout}
                className="rounded-xl bg-white px-4 py-2 text-gray-900 shadow-md transition hover:bg-white/90"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Salir
              </Button>

            </div>
          </div>
        </div>
      </div>

      <div
        className="container mx-auto max-w-7xl p-6"
      >
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <p className="font-semibold">Error</p>
            <p className="mt-1">{error}</p>
          </div>
        )}

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
            <Input
              type="text"
              placeholder="Buscar clientes por nombre, teléfono, correo o estado..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-14 rounded-2xl border-none bg-surface pl-12 text-lg text-foreground shadow-lg placeholder:text-gray-500"
            />
          </div>
          {searchQuery && (
            <p className="ml-1 mt-2 text-sm text-muted">
              {clientesFiltrados.length} cliente{clientesFiltrados.length !== 1 ? "s" : ""} encontrado{clientesFiltrados.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <Card className="border-border bg-surface shadow-lg transition-all duration-300 hover:shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm text-muted">Clientes Activos</CardTitle>
              <div className="rounded-xl p-2" style={{ background: getPrimaryGradient() }}>
                <Users className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="font-black text-foreground" style={{ fontSize: "2rem" }}>
                {clientesActivos}
              </div>
              <p className="mt-2 text-sm text-muted">Activos + por vencer</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-surface shadow-lg transition-all duration-300 hover:shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm text-muted">Ingresos del Mes</CardTitle>
              <div className="rounded-xl p-2" style={{ background: getPrimaryGradient() }}>
                <DollarSign className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="font-black text-foreground" style={{ fontSize: "2rem" }}>
                {currencyFormatter.format(ingresosMes)}
              </div>
              <p className="mt-2 text-sm text-muted">Pagos registrados</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-surface shadow-lg transition-all duration-300 hover:shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm text-muted">Clientes Inactivos</CardTitle>
              <div className="rounded-xl p-2" style={{ background: getPrimaryGradient() }}>
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="font-black text-foreground" style={{ fontSize: "2rem" }}>
                {clientesInactivos}
              </div>
              <p className="mt-2 text-sm text-muted">Sin membresia activa</p>
            </CardContent>
          </Card>

        </div>

        <Tabs defaultValue={defaultTab ?? "clientes"} className="space-y-6">
          <TabsList className="h-auto overflow-visible rounded-2xl border-none bg-surface p-1.5 shadow-md">
            <TabsTrigger
              value="clientes"
              className="group relative rounded-xl px-6 py-3 transition-all data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              Clientes
              <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-max -translate-x-1/2 rounded-xl px-3 py-2 text-xs font-semibold text-white shadow-lg opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-1" style={{ background: getPrimaryGradient() }}>
                Gestiona perfiles, estado y contacto de clientes.
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="pagos"
              className="group relative rounded-xl px-6 py-3 transition-all data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              Pagos
              <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-max -translate-x-1/2 rounded-xl px-3 py-2 text-xs font-semibold text-white shadow-lg opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-1" style={{ background: getPrimaryGradient() }}>
                Registra pagos y revisa el historial de transacciones.
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="mediciones"
              className="group relative rounded-xl px-6 py-3 transition-all data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              Mediciones
              <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-max -translate-x-1/2 rounded-xl px-3 py-2 text-xs font-semibold text-white shadow-lg opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-1" style={{ background: getPrimaryGradient() }}>
                Guarda y consulta mediciones fisicas de los clientes.
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="clientes">
            <ClientesTab
              clientes={clientesFiltrados}
              allClientes={clientesAll}
              onCreateCliente={handleCreateCliente}
              onUpdateCliente={handleUpdateCliente}
              onDeleteCliente={handleDeleteCliente}
              onRefresh={loadAll}
            />
          </TabsContent>
          <TabsContent value="pagos">
            <PagosTab
              pagos={pagosAll}
              onCreatePago={handleCreatePago}
              onDeletePago={handleDeletePago}
              clientes={clientesAll}
            />
          </TabsContent>
          <TabsContent value="mediciones">
            <MedicionesTab
              mediciones={mediciones}
              clientes={clientesAll}
              onCreateMedicion={handleCreateMedicion}
              onDeleteMedicion={handleDeleteMedicion}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer - Powered by Jokem */}
      {appConfig.poweredByJokem.enabled && (
        <footer className="mt-8 pb-6 text-center">
          <a
            href={appConfig.poweredByJokem.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-500 transition-colors hover:text-gray-700"
          >
            {appConfig.poweredByJokem.text}
          </a>
        </footer>
      )}
    </div>
  );
}
