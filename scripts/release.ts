import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const COLORS = ["\x1b[36m", "\x1b[33m", "\x1b[35m"];
const RESET = "\x1b[0m";
const PAD = 8;

function prefixed(dir: string, colorIdx: number) {
    const prefix = `[${dir}]`.padEnd(PAD);
    const color = COLORS[colorIdx % COLORS.length];
    return (msg: string) => process.stdout.write(`${color}${prefix}${RESET} ${msg}\n`);
}

const __dirname = path.join(new URL(".", import.meta.url).pathname, "..");
const dryRun = process.argv.includes("--dry-run");

if (!dryRun) {
    execSync("pnpm login", { stdio: "inherit", cwd: __dirname });
}

execSync("pnpm make-icons", { stdio: "inherit", cwd: __dirname });
execSync("pnpm build", { stdio: "inherit", cwd: __dirname });

const packagesDir = path.join(__dirname, "packages");
const dirs = fs.readdirSync(packagesDir).filter((dir) => {
    const fullPath = path.join(packagesDir, dir);
    return fs.statSync(fullPath).isDirectory();
});

const origVersions = new Map(
    dirs.map((dir) => {
        const pkg = JSON.parse(
            fs.readFileSync(path.join(packagesDir, dir, "package.json"), "utf-8"),
        );
        return [dir, pkg.version] as const;
    }),
);

if (!dryRun) {
    for (const dir of dirs) {
        const out = prefixed(dir, dirs.indexOf(dir));
        out(`version patch`);
        execSync("pnpm version patch --no-git-tag-version", {
            stdio: "inherit",
            cwd: path.join(packagesDir, dir),
        });
    }
}

if (!dryRun) {
    execSync("git add .", { stdio: "inherit", cwd: __dirname });
    execSync('git commit -am "chore: rerelease packages"', { stdio: "inherit", cwd: __dirname });
    execSync("git push", { stdio: "inherit", cwd: __dirname });
}

for (const [i, dir] of dirs.entries()) {
    const out = prefixed(dir, i);

    if (!dryRun) {
        out(`publish`);
        try {
            execSync("pnpm publish --access public", {
                stdio: "inherit",
                cwd: path.join(packagesDir, dir),
            });
            out(`\x1b[32m✓ published\x1b[0m`);
        } catch {
            out(`\x1b[31m✗ publish failed — rolling back\x1b[0m`);
            execSync("git reset --hard HEAD~1", { stdio: "inherit", cwd: __dirname });
            for (const d of dirs) {
                const pkg = path.join(packagesDir, d, "package.json");
                const content = JSON.parse(fs.readFileSync(pkg, "utf-8"));
                content.version = origVersions.get(d);
                fs.writeFileSync(pkg, JSON.stringify(content, null, 4) + "\n");
            }
            execSync("git push --force-with-lease", { stdio: "inherit", cwd: __dirname });
            process.exit(1);
        }
    } else {
        out(`\x1b[33m◷ publish (dry-run)\x1b[0m`);
    }
}