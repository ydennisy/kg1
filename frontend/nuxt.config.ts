export default defineNuxtConfig({
  ssr: false,
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@nuxtjs/color-mode'],
  css: ['~/assets/css/tailwind.css'],
  colorMode: {
    classSuffix: '',
  },
  /*   ui: {
    global: true,
    icons: ['mdi', 'simple-icons'],
  }, */
  /*   components: [
    {
      path: '~/components/ui',
      extensions: ['.vue'],
      prefix: 'ui',
    },
  ], */
});
