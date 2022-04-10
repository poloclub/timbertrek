import App from './App.svelte';

const app = new App({
  target: document.body,
  props: { mode: 'article' }
});

export default app;
