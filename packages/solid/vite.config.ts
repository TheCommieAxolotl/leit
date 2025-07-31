import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import dts from "vite-plugin-dts";

export default defineConfig({
    plugins: [
        solidPlugin(),
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
            external: ["solid-js", "solid-js/web"],
        },
    },
    esbuild: {
        jsx: "preserve",
        jsxImportSource: "solid-js",
    },
});
