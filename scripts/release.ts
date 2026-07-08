import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const __dirname = path.join(new URL(".", import.meta.url).pathname, "..");

execSync("pnpm make-icons", { stdio: "inherit", cwd: __dirname });
execSync("pnpm build", { stdio: "inherit", cwd: __dirname });

const packagesDir = path.join(__dirname, "packages");
const packageDirs = fs.readdirSync(packagesDir).filter((dir) => {
    const fullPath = path.join(packagesDir, dir);
    return fs.statSync(fullPath).isDirectory();
});

for (const dir of packageDirs) {
    const packagePath = path.join(packagesDir, dir);
    execSync("pnpm version patch --no-git-tag-version", {
        stdio: "inherit",
        cwd: packagePath,
    });
}

execSync("git add .", { stdio: "inherit", cwd: __dirname });
execSync('git commit -am "chore: rerelease packages"', {
    stdio: "inherit",
    cwd: __dirname,
});
execSync("git push", { stdio: "inherit", cwd: __dirname });

for (const dir of packageDirs) {
    const packagePath = path.join(packagesDir, dir);
    execSync("pnpm publish --access public", {
        stdio: "inherit",
        cwd: packagePath,
    });
}
