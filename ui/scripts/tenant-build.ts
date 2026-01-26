// FILE: scripts/tenant-build.ts
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

console.log("🚀 STARTING TENANT BUILD...");

let configFile = 'tenant.setup.json';
const fileArgIndex = process.argv.indexOf('--file');
if (fileArgIndex !== -1 && process.argv[fileArgIndex + 1]) {
    configFile = process.argv[fileArgIndex + 1];
} else {
    const fileArg = process.argv.find(arg => arg.startsWith('--file='));
    if (fileArg) {
        configFile = fileArg.split('=')[1];
    }
}
const configPath = path.join(process.cwd(), configFile);

// 1. Validate config presence
if (!fs.existsSync(configPath)) {
    console.error(`❌ Config file not found: ${configPath}`);
    process.exit(1);
}

// 2. Load config to display info
const setup = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
console.log(`📌 Tenant: ${setup.tenant.displayName} (${setup.tenant.id})`);

// 3. Execute Generators
try {
    // Determine runner: use tsx if available or require ts-node, or node if compiled.
    // Assuming development env with these capabilities.
    // We will attempt to run them using 'npx tsx'.
    const runner = 'npx tsx';

    console.log("👉 Generating App Config...");
    execSync(`${runner} scripts/generate-app-config.ts`, { stdio: 'inherit' });

    console.log("👉 Generating Database Seed...");
    execSync(`${runner} scripts/generate-seed-sql.ts`, { stdio: 'inherit' });

    console.log("✅ TENANT BUILD COMPLETE.");

    // 4. Generate .env.example suggestion
    const envExample = `
# Generated for project: ${setup.tenant.supabaseProjectRef || 'unknown'}
NEXT_PUBLIC_SUPABASE_URL=https://${setup.tenant.supabaseProjectRef || 'PROJECT_REF'}.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-for-admin-scripts
`;
    console.log("\n⚠️  REMEMBER: Check your .env setup!");
    console.log(envExample);

} catch (error) {
    console.error("❌ BUILD FAILED", error);
    process.exit(1);
}
