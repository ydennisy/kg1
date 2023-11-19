import { app } from './app';

const start = async () => {
  try {
    await app.listen({ port: Number(process.env.PORT) || 8000 });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
