// FILE: scripts/tenant-build.ts
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

console.log("🚀 STARTING TENANT BUILD...");

let configFile = 'tenant.setup.json';

// Collect all --file arguments and use the LAST one (to allow overriding via npm run tenant:build -- --file xyz)
const fileArgs: string[] = [];
for (let i = 0; i < process.argv.length; i++) {
    if (process.argv[i] === '--file' && process.argv[i + 1]) {
        fileArgs.push(process.argv[i + 1]);
    } else if (process.argv[i].startsWith('--file=')) {
        fileArgs.push(process.argv[i].split('=')[1]);
    }
}

if (fileArgs.length > 0) {
    configFile = fileArgs[fileArgs.length - 1]; // Take the LAST one
}
// 1. Validate config presence
const configPath = path.isAbsolute(configFile) ? configFile : path.join(process.cwd(), configFile);
const targetPath = path.join(process.cwd(), 'tenant.setup.json');

if (!fs.existsSync(configPath)) {
    console.error(`❌ Config file not found: ${configPath}`);
    process.exit(1);
}

// 2. SWAP: If using a specific tenant file, copy it to the main tenant.setup.json
// This ensures that all sub-scripts (which read tenant.setup.json) work correctly
if (path.resolve(configPath) !== path.resolve(targetPath)) {
    console.log(`🔄 Swapping configuration: ${configFile} -> tenant.setup.json`);
    fs.copyFileSync(configPath, targetPath);
}

// 3. Load config to display info
const setup = JSON.parse(fs.readFileSync(targetPath, 'utf-8'));
console.log(`📌 Tenant: ${setup.tenant.displayName} (${setup.tenant.id})`);

// 4. Execute Generators
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

    // 5. Generate .env.example suggestion
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
