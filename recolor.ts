import path from "path";
import fs from "fs";

import { optimize } from "svgo";

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const recolorIcons = async () => {
    const iconsDir = path.join(__dirname, "icons");
    const files = await fs.promises.readdir(iconsDir, {
        recursive: true,
    });

    const replacements = [
        ['="black"', '="red"'],
        ['="#007EFF"', '="green"'],
        ['="#FF0000"', '="blue"'],
        [/(?<!stop-color="red" )stop-opacity=/g, 'stop-color="red" stop-opacity='],
    ] as const;

    for (const file of files) {
        const filePath = path.join(iconsDir, file);

        if (!filePath.endsWith(".svg")) {
            continue; // Skip non-SVG files
        }

        const content = await fs.promises.readFile(filePath, "utf8");

        let newContent = content;
        for (const [oldColor, newColor] of replacements) {
            newContent = newContent.replaceAll(oldColor, newColor);
        }

        // Optimize the SVG content
        const optimized = optimize(newContent, {
            path: filePath,
            multipass: true,
        });

        await fs.promises.writeFile(filePath, optimized.data);
    }
};

recolorIcons();
