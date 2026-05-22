import './styles/theme-bridge.css';
import './styles/markdown-body.css';
import './styles/animations.css';
import './styles/extensions.css';
import './styles/layouts.css';
import App from './App.svelte';
import { mount } from 'svelte';

const app = mount(App, {
  target: document.getElementById('app')!,
});

export default app;
