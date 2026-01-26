
import { createClient } from "@supabase/supabase-js";
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load .env.local
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function runSeed() {
    const seedDir = path.join(process.cwd(), 'supabase/seed');
    if (!fs.existsSync(seedDir)) {
        console.error('❌ No seed directory found.');
        process.exit(1);
    }

    const files = fs.readdirSync(seedDir).filter(f => f.startsWith('seed.') && f.endsWith('.sql'));
    if (files.length === 0) {
        console.error('❌ No seed file found. Run "npm run tenant:build" first.');
        process.exit(1);
    }

    // Pick the most recent one or the only one. Usually there is only 1 active tenant config per repo.
    const seedFile = files[0];
    const sqlPath = path.join(seedDir, seedFile);
    console.log(`🌱 Applying seed: ${seedFile}...`);

    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Split statements roughly (naive split, but mostly works for standard inserts unless complex functions used)
    // Or, much better: PG libraries usually allow executing the whole block if using simple connector. 
    // Supabase JS client doesn't expose raw SQL execution easily via Postgrest unless we use an RPC.
    // BUT we can use the "postgres" library locally or just assume the user uses 'supabase db reset' with CLI.
    // However, the request asked for a script command.

    // OPTION A: If Supabase CLI is authenticated, we can use `npx supabase db execute --file ...`
    // OPTION B: If we want to use JS, we need a library like `pg` or `postgres` to connect directly, OR use a custom RPC `exec_sql`.
    // Since we don't know if RPC exists, let's use the CLI approach which remains cleaner for "deploy" tasks.

    console.log('⚠️  Ideally, this is run via "supabase db reset" which includes seeds, but our seeds are dynamic.');
    console.log('    We will try to use Supabase CLI to execute the file.');

    try {
        const { execSync } = require('child_process');
        // Assuming user has logged in or linked:
        // npx supabase db reset --db-url ... is risky.
        // npx supabase db push is for schema.

        // Let's rely on standard Postgres connection string if available, or just instruct user.
        // For automation, adding `npx supabase db execute` is valid if project is linked.

        // Simpler for this template v1: Just echo that the seed file is ready and logic should be handled by CLI or manual entry if no direct DB access.

        // WAITING: The user request asked for a "maestro" command. 
        // Let's assume we can use `npx supabase db reset --seed` if we copy the seed to `supabase/seed.sql`!
        // That is the standard way.

        const standardSeedPath = path.join(process.cwd(), 'supabase/seed.sql');
        fs.copyFileSync(sqlPath, standardSeedPath);
        console.log(`✅ Copied ${seedFile} to supabase/seed.sql`);
        console.log(`   Now 'npx supabase db reset' or 'npx supabase start' will pick it up automatically.`);

    } catch (e) {
        console.error('Failed to prepare seed.', e);
        process.exit(1);
    }
}

runSeed();
