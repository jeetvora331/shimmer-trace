import { defineConfig } from 'tsup';
import { promises as fs } from 'fs';
import path from 'path';

const USE_CLIENT_DIRECTIVE = `'use client';\n`;

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom'],
  treeshake: true,
  minify: false,
  splitting: false,
  // Prepend 'use client' to bundled JS outputs so RSC/Next.js App Router
  // treats this package as a client component. Bundlers strip per-file
  // directives during bundling, so we re-add at the bundle level.
  async onSuccess() {
    const files = ['dist/index.mjs', 'dist/index.js'];
    await Promise.all(
      files.map(async (rel) => {
        const file = path.resolve(rel);
        try {
          const content = await fs.readFile(file, 'utf8');
          if (content.startsWith("'use client'")) return;
          await fs.writeFile(file, USE_CLIENT_DIRECTIVE + content);
        } catch (err) {
          // File may not exist yet on first run; ignore.
          if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
        }
      }),
    );
  },
});
