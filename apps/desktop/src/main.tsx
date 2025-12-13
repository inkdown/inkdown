// Register native platform adapters BEFORE anything else
import { registerTauriAdapters } from '@inkdown/native-tauri';
import ReactDOM from 'react-dom/client';
import App from './App';

registerTauriAdapters();

// Core styles (variables, base, icons, plugin-api, popover-suggest)
import '@inkdown/core/styles';

// Themes from core
import '@inkdown/core/styles/themes/dark';
import '@inkdown/core/styles/themes/light';

// Desktop-specific styles
import './styles/app.css';

// Package styles
import '@inkdown/ui/styles';

// Core extensions (DOM helpers)
import '@inkdown/core';

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
