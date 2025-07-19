import path from "path";
import fs from "fs";

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const organiseIcons = async () => {
    const iconsDir = path.join(__dirname, "icons");
    const files = await fs.promises.readdir(iconsDir);

    const iconList: Record<string, string> = {};

    for (const file of files) {
        const match = file.match(/^(\w+)\.?((?:\w+\.?)*)\.svg$/);

        if (match) {
            const [_, category, names] = match;
            const subtypes = names.split(".").filter(Boolean);

            const isSingleCategory = subtypes.length === 0 || (subtypes.length === 1 && subtypes[0] === category);

            if (isSingleCategory) {
                continue;
            }

            const newDir = path.join(iconsDir, category);
            const newFileName = `${category}-${subtypes.join("-")}.svg`;

            if (!fs.existsSync(newDir)) {
                await fs.promises.mkdir(newDir, { recursive: true });
            }

            const oldFilePath = path.join(iconsDir, file);
            const newFilePath = path.join(newDir, newFileName);
            await fs.promises.rename(oldFilePath, newFilePath);
        }
    }

    const remainingFiles = await fs.promises.readdir(iconsDir);

    for (const file of remainingFiles) {
        const match = file.match(/^(\w+)\.svg$/);

        if (match) {
            const [_, category] = match;
            const subtypes = remainingFiles.filter((f) => f.startsWith(`${category}.`));

            if (subtypes.length > 0) {
                if (remainingFiles.includes(category) && (await fs.promises.stat(path.join(iconsDir, category))).isDirectory()) {
                    const oldFilePath = path.join(iconsDir, file);
                    const newFilePath = path.join(iconsDir, category, file);
                    await fs.promises.rename(oldFilePath, newFilePath);
                }
            }
        }
    }

    const finalFiles = await fs.promises.readdir(iconsDir, { recursive: true });

    finalFiles.sort();

    for (const file of finalFiles) {
        const filePath = path.join(iconsDir, file);

        if (filePath.endsWith(".svg")) {
            const iconName = path.basename(filePath, ".svg");
            iconList[iconName.replaceAll("-", ".")] = filePath.replace(__dirname, "").replace(/\\/g, "/");
        }
    }

    const outputFilePath = path.join(__dirname, "icons.json");
    await fs.promises.writeFile(outputFilePath, JSON.stringify(iconList, null, 2));

    makePages(iconList);
};

organiseIcons();

const makePages = async (iconList: Record<string, string>) => {
    const time = new Date().toISOString();

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Leit</title>
        <style>
            @property --primary { 
                syntax: '<color>'; 
                inherits: true;
                initial-value: #000000; 
            }
            @property --secondary { 
                syntax: '<color>'; 
                inherits: true;
                initial-value: #007EFF; 
            }
            @property --tertiary { 
                syntax: '<color>'; 
                inherits: true; 
                initial-value: #F00; 
            }
            @property --icon-size { 
                syntax: '<length>'; 
                inherits: true;
                initial-value: 50px; 
            }

            main {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                padding: 20px;

                svg {
                    width: var(--icon-size, 50px);
                    height: var(--icon-size, 50px);
                    border: 1px solid #ccc;
                }
            }

            #icon-size-value::after {
                content: attr(aria-valuenow);
            }
        </style>
    </head>
    <body>
        <h1>Leit Icons</h1>
        <p>Generated on ${time}</p>
        <input type="range" min="10" max="100" value="50" id="size" />
        <label for="icon-size">Icon Size: <span aria-valuenow="50" id="icon-size-value"></span>px</label>
        <input type="color" id="primary-color" value="#000000" />
        <label for="primary-color">Primary Color</label>
        <input type="color" id="secondary-color" value="#007EFF" />
        <label for="secondary-color">Secondary Color</label>
        <input type="color" id="tertiary-color" value="#FF0000" />
        <label for="tertiary-color">Tertiary Color</label>
        <main>${Object.values(iconList)
            .map((iconpath) => {
                return fs.readFileSync(path.join(__dirname, iconpath), "utf8").replaceAll("red", "var(--primary)").replaceAll("green", "var(--secondary)").replaceAll("blue", "var(--tertiary)");
            })
            .join("")}</main>
        <script>
            const sizeInput = document.getElementById("size");
            const iconSizeValue = document.getElementById("icon-size-value");
            const primaryColorInput = document.getElementById("primary-color");
            const secondaryColorInput = document.getElementById("secondary-color");
            const tertiaryColorInput = document.getElementById("tertiary-color");
            const main = document.querySelector("main");

            sizeInput.addEventListener("input", (e) => {
                const size = e.target.value;
                iconSizeValue.setAttribute("aria-valuenow", size);
                main.style.setProperty("--icon-size", size + "px");
            });

            primaryColorInput.addEventListener("input", (e) => {
                const color = e.target.value;
                main.style.setProperty("--primary", color);
            });
            secondaryColorInput.addEventListener("input", (e) => {
                const color = e.target.value;
                main.style.setProperty("--secondary", color);
            });
            tertiaryColorInput.addEventListener("input", (e) => {
                const color = e.target.value;
                main.style.setProperty("--tertiary", color);
            });
        </script>
    </body>
</html>`;

    const htmlFilePath = path.join(__dirname, "icons.html");
    await fs.promises.writeFile(htmlFilePath, htmlContent);
    console.log(`HTML file created at: ${htmlFilePath}`);

    const markdownContent = `# Leit Icons

Generated on ${time}

---

| Icon Name | SVG Path | Preview |
|-----------|----------|---------|
${Object.entries(iconList)
    .map(([name, path]) => `| ${name} | [${path}](.${path}) | ![${name}](.${path}) |`)
    .join("\n")}
`;

    const markdownFilePath = path.join(__dirname, "icons.md");
    await fs.promises.writeFile(markdownFilePath, markdownContent);
    console.log(`Markdown file created at: ${markdownFilePath}`);
};
