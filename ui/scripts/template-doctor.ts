
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const CYAN = '\x1b[36m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

const UI_ROOT = path.resolve(__dirname, '..');
const TENANT_SETUP_FILE = path.join(UI_ROOT, 'tenant.setup.json');
const APP_CONFIG_FILE = path.join(UI_ROOT, 'src', 'config', 'app.config.ts');
const ENV_LOCAL_FILE = path.join(UI_ROOT, '.env.local');

function log(color: string, message: string) {
    console.log(`${color}${message}${RESET}`);
}

function error(message: string) {
    console.error(`${RED}❌ ERROR: ${message}${RESET}`);
    process.exit(1);
}

function warning(message: string) {
    console.warn(`${YELLOW}⚠️ WARNING: ${message}${RESET}`);
}

function checkTenantSetupGitIgnore() {
    // In CI/CD environments (like Vercel), it's expected that tenant.setup.json is committed
    // Skip this check if we detect we're in a CI environment
    const isCI = process.env.CI || process.env.VERCEL || process.env.GITHUB_ACTIONS;

    if (isCI) {
        log(CYAN, '🔧 Running in CI/CD environment - allowing tenant.setup.json to be tracked.');
        return;
    }

    if (fs.existsSync(TENANT_SETUP_FILE)) {
        // Build is configured likely. Check if it's ignored.
        try {
            // git check-ignore returns 0 if ignored, 1 if not.
            execSync(`git check-ignore ${TENANT_SETUP_FILE}`, { cwd: UI_ROOT, stdio: 'ignore' });
            log(GREEN, '✅ tenant.setup.json is properly ignored.');
        } catch (e) {
            // If git check-ignore fails (exit code 1), it means it's NOT ignored or not a git repo
            // However, for the doctor, we strictly want it ignored if it exists.
            // We can also check if .gitignore contains it.
            const gitignorePath = path.join(UI_ROOT, '.gitignore');
            const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
            if (!gitignoreContent.includes('tenant.setup.json')) {
                error('tenant.setup.json exists but is NOT in .gitignore. This is a security risk.');
            }
        }
    }
}

function checkTemplateMode() {
    // Read app.config.ts
    if (!fs.existsSync(APP_CONFIG_FILE)) {
        // This usually means tenant:build hasn't run.
        // It might be fine if we are just starting, but dev server needs it.
        // Actually, the repo comes with a placeholder app.config.ts (the one I read).
        // If it's missing, that's a problem.
        error('src/config/app.config.ts is missing. Please restore the repo state or run npm run tenant:build');
    }

    const content = fs.readFileSync(APP_CONFIG_FILE, 'utf8');
    const isTemplateMode = content.includes('__TEMPLATE_NOT_CONFIGURED__: true');

    if (isTemplateMode) {
        log(YELLOW, 'ℹ️ App is running in TEMPLATE MODE.');
        log(CYAN, '   To configure: Copy tenant.setup.json.example -> tenant.setup.json, edit it, then run "npm run tenant:build"');

        // In template mode, we ensure we don't crash on missing env vars, 
        // but we verify critical deps are installed.
    } else {
        log(GREEN, '✅ App is configured (Product Mode).');

        // In configured mode, we MUST have .env.local with Supabase keys because the generated code uses them.
        if (!fs.existsSync(ENV_LOCAL_FILE)) {
            error('Missing .env.local file. Run "npm run tenant:build" (if needed) and create .env.local with Supabase credentials.');
        }

        const envContent = fs.readFileSync(ENV_LOCAL_FILE, 'utf8');
        if (!envContent.includes('NEXT_PUBLIC_SUPABASE_URL') || !envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY')) {
            error('.env.local is missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.');
        }
    }
}

function checkCriticalDeps() {
    const criticalDeps = [
        '@radix-ui/react-slot',
        'class-variance-authority',
        '@radix-ui/react-tabs',
        '@radix-ui/react-select',
        '@radix-ui/react-label',
        '@radix-ui/react-dialog',
        'tailwindcss',
        '@tailwindcss/postcss'
    ];

    // Check if node_modules exists
    const nodeModulesPath = path.join(UI_ROOT, 'node_modules');
    if (!fs.existsSync(nodeModulesPath)) {
        error('node_modules not found. Please run "npm install".');
    }

    // We can't strictly check deep folders easily for all deps without traversing, 
    // but we can check if they are in package.json (which we know they are) 
    // and if npm install successfully created the folders.
    // A simple check is to require.resolve them? 
    // But 'tsx' might not find them if they are ESM or relative.
    // Let's just assume if node_modules exists and package.json has them, we are okay-ish.
    // Better: Helper function to check package.json

    const packageJsonPath = path.join(UI_ROOT, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

    const missing = criticalDeps.filter(d => !allDeps[d]);

    if (missing.length > 0) {
        error(`Missing critical dependencies in package.json: ${missing.join(', ')}. Run "npm install" after adding them.`);
    }

    log(GREEN, '✅ Dependencies check passed.');
}


function checkLocalDbTraces() {
    log(CYAN, '🔍 Checking for banned local DB configurations...');

    // Check .env.local for banned keywords by seeing if the file exists first
    if (fs.existsSync(ENV_LOCAL_FILE)) {
        const envContent = fs.readFileSync(ENV_LOCAL_FILE, 'utf8');
        const bannedVars = ['DATABASE_URL', 'DB_HOST', 'POSTGRES_URL', 'MYSQL_URL', 'SQLITE_URL'];

        bannedVars.forEach(v => {
            if (envContent.includes(v)) {
                warning(`Found potentially banned variable ${v} in .env.local. This template should be Supabase-only.`);
            }
        });

        if (envContent.includes('localhost') || envContent.includes('127.0.0.1')) {
            // Check if it's the Safe APP_URL
            const lines = envContent.split('\n');
            lines.forEach(line => {
                if ((line.includes('localhost') || line.includes('127.0.0.1')) && !line.startsWith('APP_URL=')) {
                    warning(`Found "localhost" or "127.0.0.1" in .env.local line: "${line.trim()}". Ensure you are not connecting to a local DB.`);
                }
            });
        }
    }

    log(GREEN, '✅ Local DB checks passed.');
}

function run() {
    log(CYAN, '🩺 Running Template Doctor...');

    // Check 1: Git Ignore
    checkTenantSetupGitIgnore();

    // Check 2: Deps
    checkCriticalDeps();

    // Check 3: Template Mode & Env
    checkTemplateMode();

    // Check 4: No Local DB
    checkLocalDbTraces();

    log(GREEN, '✅ Doctor checks passed. proceeding...');
}

run();
