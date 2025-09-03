import { defineConfig } from "vite";
import reactPlugin from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";

export default defineConfig({
    plugins: [
        reactPlugin(),
        dts({
            rollupTypes: true,
        }),
    ],
    build: {
        lib: {
            entry: "index.ts",
            name: "index",
            formats: ["es", "cjs"],
            fileName: (format) => `index.${format}.js`,
        },
        rollupOptions: {
            external: ["react"],
        },
    },
    esbuild: {
        jsx: "preserve",
        jsxImportSource: "react",
    },
});
