export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig();
  const apiBase = config.public.apiBase;

  let counter = 0;
  const getHealth = async () => {
    try {
      await fetch(`${apiBase}/api/health`);
      counter++;
      if (counter >= 5) {
        clearInterval(interval);
      }
    } catch (error) {
      console.error('Error polling health endpoint: ', error);
    }
  };
  const interval = setInterval(getHealth, 2000);
});
