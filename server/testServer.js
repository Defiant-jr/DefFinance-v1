import { createApp } from './app.js';

const PORT = Number.parseInt(process.env.TEST_SERVER_PORT ?? '3100', 10);
const HOST = process.env.TEST_SERVER_HOST ?? '127.0.0.1';

async function startTestServer() {
  try {
    const { app } = await createApp({ withFrontend: false });

    const server = app.listen(PORT, HOST, () => {
      console.log(`[test-server] disponível em http://${HOST}:${PORT}`);
    });

    const shutdown = () => {
      console.log('\n[test-server] finalizando...');
      server.close(() => {
        console.log('[test-server] encerrado com sucesso');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('[test-server] falha ao iniciar', error);
    process.exit(1);
  }
}

startTestServer();
