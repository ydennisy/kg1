export default defineNuxtConfig({
  devtools: { enabled: true },
  // NOTE: this would allow moving everything into src!
  // srcDir: "src/",
  modules: ['@nuxtjs/tailwindcss'], // '@nuxtjs/supabase'
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      apiBase: '',
    },
  },
  routeRules: {
    '/*': { ssr: false },
    '/home': { static: true },
    '/api/**': {
      proxy:
        process.env.NODE_ENV === 'development'
          ? 'http://127.0.0.1:8000/api/**'
          : 'https://kg1-backend-j5dxapaafq-ew.a.run.app/api/**',
    },
    '/docs': {
      proxy: 'http://127.0.0.1:8000/docs',
    },
    '/openapi.json': {
      proxy: 'http://127.0.0.1:8000/openapi.json',
    },
  },
  //supabase: {
  //  redirectOptions: {
  //    login: '/login',
  //    callback: '/',
  //    exclude: [],
  //    cookieRedirect: false,
  //  },
  //},
});
