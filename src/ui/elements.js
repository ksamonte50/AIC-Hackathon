import '@spectrum-web-components/styles/typography.css';
import '@spectrum-web-components/theme/express/theme-light.js';
import '@spectrum-web-components/theme/express/theme-dark.js';
import '@spectrum-web-components/theme/express/scale-medium.js'; 
import '@spectrum-web-components/theme/sp-theme.js';
import '@spectrum-web-components/button/sp-button.js'; 
import '@spectrum-web-components/textfield/sp-textfield.js';
import '@spectrum-web-components/field-label/sp-field-label.js';



// Make sure an <sp-theme> is present
let themeElement = document.querySelector('sp-theme');

if (!themeElement) {
    themeElement = document.createElement('sp-theme');
    document.body.prepend(themeElement); // Add it to the beginning of <body>
}

// Dynamically set theme based on user preference
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
themeElement.setAttribute('color', prefersDark ? 'dark' : 'light');
themeElement.setAttribute('scale', 'medium'); // Optionally set scale too (medium/large)
themeElement.setAttribute('theme', 'express'); // Set to 'express' theme (recommended)