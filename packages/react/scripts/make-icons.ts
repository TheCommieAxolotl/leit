import fs from "fs/promises";
import path from "path";

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const iconsFilePath = path.resolve(new URL(import.meta.resolve("leit")).pathname, "../icons.json");
const icons = JSON.parse(await fs.readFile(iconsFilePath, "utf8"));

const makeComponent = (name: string, content: string) => {
    const componentName = name.replace(/(^\w|\.\w)/g, (match) => match.replace(".", "").toUpperCase());

    const replacements = [
        ['="red"', "={props.primary||'currentColor'}"],
        ['="green"', "={props.secondary||'currentColor'}"],
        ['="#00f"', "={props.tertiary||'currentColor'}"],
        ['width="16" height="16"', 'width={props.size ?? "16"} height={props.size ?? "16"}'],
        ['width="14" height="14"', 'width={props.size ?? "16"} height={props.size ?? "16"}'],
        ["<svg ", `<svg {...props} data-icon="${name}" `],
        // reactisms
        ["stroke-linejoin", "strokeLinejoin"],
        ["stroke-linecap", "strokeLinecap"],
    ] as const;

    const replacedContent = replacements.reduce((acc, [oldColor, newColor]) => {
        return acc.replaceAll(oldColor, newColor);
    }, content);

    return `import { JSX } from "react";

export default function ${componentName}(
    props: JSX.IntrinsicElements["svg"] & {
        primary?: string;
        secondary?: string;
        tertiary?: string;
        size?: number | string;
    }
): JSX.Element {
    return (
        ${replacedContent}
    );
}
    `;
};

for (const [name, filePath] of Object.entries(icons) as [string, string][]) {
    const content = await fs.readFile(path.join(iconsFilePath, "..", filePath), "utf8");
    const componentName = name.replace(/(^\w|\.\w)/g, (match) => match.replace(".", "").toUpperCase());

    const componentContent = makeComponent(name, content);

    const componentFilePath = path.join(__dirname, "../components", `${componentName}.tsx`);

    await fs.mkdir(path.dirname(componentFilePath), { recursive: true });
    await fs.writeFile(componentFilePath, componentContent);
}

const indexFile = Object.keys(icons)
    .map((name) => {
        const componentName = name.replace(/(^\w|\.\w)/g, (match) => match.replace(".", "").toUpperCase());
        return `export { default as ${componentName} } from "./components/${componentName}";`;
    })
    .join("\n");

await fs.writeFile(path.join(__dirname, "../index.ts"), indexFile);
