import express from 'express';
import compression from 'compression';
import serveStatic from 'serve-static';
import path from 'node:path';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

export async function createApp(options = {}) {
  const { withFrontend = true } = options;
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  if (!withFrontend) {
    return { app };
  }

  const isProd = (process.env.NODE_ENV ?? 'production') === 'production';

  if (isProd) {
    const distPath = path.join(projectRoot, 'dist');

    if (!existsSync(path.join(distPath, 'index.html'))) {
      throw new Error('Build não encontrado. Execute "npm run build" antes de iniciar o servidor.');
    }

    app.use(compression());
    app.use(
      '/assets',
      serveStatic(path.join(distPath, 'assets'), {
        immutable: true,
        maxAge: '1y'
      })
    );
    app.use(
      serveStatic(distPath, {
        index: false
      })
    );

    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      root: projectRoot,
      server: {
        middlewareMode: true
      },
      appType: 'custom'
    });

    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      try {
        const url = req.originalUrl;
        const templatePath = path.join(projectRoot, 'index.html');
        let template = await fs.readFile(templatePath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);

        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (error) {
        vite.ssrFixStacktrace?.(error);
        next(error);
      }
    });
  }

  return { app };
}
