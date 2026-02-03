
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
    console.error("❌ Faltan credenciales en .env.local (URL o SERVICE_KEY)");
    process.exit(1);
}

const supabase = createClient(url, serviceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function createAdmin() {
    const email = "admin@jokem.tech";
    const password = "admin"; // Simple password for dev

    console.log(`👤 Creando usuario administrador: ${email}...`);

    // 1. Check if user exists (by trying to signUp, cleaner than listUsers for simple scripts)
    // Actually, standard admin.createUser is better
    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto confirm
        user_metadata: { role: 'admin' }
    });

    if (error) {
        if (error.message.includes("already registered")) {
            console.log("✅ El usuario ya existe. Intentando resetear contraseña...");
            // Get user ID to update password
            const { data: listData } = await supabase.auth.admin.listUsers();
            const user = listData.users.find(u => u.email === email);
            if (user) {
                const { error: updateError } = await supabase.auth.admin.updateUserById(
                    user.id,
                    { password: password }
                )
                if (updateError) console.error("❌ Error al actualizar password:", updateError.message);
                else console.log("✅ Contraseña actualizada a: 'admin'");
            }
        } else {
            console.error("❌ Error creando usuario:", error.message);
        }
    } else {
        console.log("✅ Usuario creado exitosamente!");
        console.log("📧 Email: " + email);
        console.log("🔑 Pass:  " + password);
    }
}

createAdmin();
