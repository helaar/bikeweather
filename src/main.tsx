import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Extend Window interface to include our custom property
declare global {
  interface Window {
    noReload?: boolean;
  }
}

// Track if the app has been initialized
let appInitialized = false;

// Create a function to initialize the app only once
const initializeApp = () => {
  if (!appInitialized) {
    appInitialized = true;
    const rootElement = document.getElementById("root");
    if (rootElement) {
      createRoot(rootElement).render(<App />);
    }
  }
};

// Prevent page reload when returning to the tab
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    console.log('Tab is now visible - preventing automatic reload');
    
    // Add a flag to the window object to indicate the app should not reload
    // This can be checked by any code that might trigger reloads
    window.noReload = true;
  }
});

// Disable the beforeunload event which might trigger when returning to the tab
window.addEventListener('beforeunload', (event) => {
  if (window.noReload) {
    // Prevent the beforeunload event from triggering a reload
    event.preventDefault();
    // Chrome requires returnValue to be set
    event.returnValue = '';
    return '';
  }
});

// Initialize the app
initializeApp();
