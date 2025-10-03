// Vector Icons for SpaceGraphJS Widgets
const VectorIcons = {
  // Widget icons
  widget: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2" fill="none"/>
    <rect x="7" y="7" width="10" height="2" fill="currentColor"/>
    <rect x="7" y="11" width="6" height="2" fill="currentColor"/>
    <rect x="7" y="15" width="8" height="2" fill="currentColor"/>
  </svg>`,

  graph: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
    <circle cx="6" cy="6" r="2" stroke="currentColor" stroke-width="2"/>
    <circle cx="18" cy="6" r="2" stroke="currentColor" stroke-width="2"/>
    <circle cx="6" cy="18" r="2" stroke="currentColor" stroke-width="2"/>
    <circle cx="18" cy="18" r="2" stroke="currentColor" stroke-width="2"/>
    <line x1="12" y1="12" x2="6" y2="6" stroke="currentColor" stroke-width="1"/>
    <line x1="12" y1="12" x2="18" y2="6" stroke="currentColor" stroke-width="1"/>
    <line x1="12" y1="12" x2="6" y2="18" stroke="currentColor" stroke-width="1"/>
    <line x1="12" y1="12" x2="18" y2="18" stroke="currentColor" stroke-width="1"/>
  </svg>`,

  interactive: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L15 8H21L16.5 12L18 18L12 15L6 18L7.5 12L3 8H9L12 2Z" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.2"/>
  </svg>`,

  settings: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
    <path d="M19.4 15A7.65 7.65 0 0 0 19 12C19 8.13 15.87 5 12 5S5 8.13 5 12C5 15.87 8.13 19 12 19C13.39 19 14.68 18.59 15.8 17.9" stroke="currentColor" stroke-width="2"/>
    <path d="M12 2V5" stroke="currentColor" stroke-width="2"/>
    <path d="M12 19V22" stroke="currentColor" stroke-width="2"/>
    <path d="M2 12H5" stroke="currentColor" stroke-width="2"/>
    <path d="M19 12H22" stroke="currentColor" stroke-width="2"/>
  </svg>`,

  // Action icons
  close: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </svg>`,

  expand: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 3H21V9M9 21H3V15M21 3L14 10M3 21L10 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  minimize: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 3V6H5M16 3V6H19M8 21V18H5M16 21V18H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  // Status icons
  success: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.7089 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M8 12L12 16L22 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  warning: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 9V11M12 15H12.01M10.29 3.86L1.82 18C1.64639 18.3024 1.55399 18.6453 1.55279 18.9945C1.55159 19.3437 1.64161 19.6871 1.81323 19.9905C1.98485 20.2939 2.23176 20.5447 2.52441 20.7158C2.81706 20.8869 3.14215 20.9728 3.47222 20.9722H20.5278C20.8579 20.9728 21.183 20.8869 21.4756 20.7158C21.7682 20.5447 22.0151 20.2939 22.1868 19.9905C22.3584 19.6871 22.4484 19.3437 22.4472 18.9945C22.446 18.6453 22.3536 18.3024 22.18 18L13.71 3.86C13.5317 3.56611 13.2807 3.32312 12.9812 3.15447C12.6817 2.98583 12.3437 2.89725 12 2.89725C11.6563 2.89725 11.3183 2.98583 11.0188 3.15447C10.7193 3.32312 10.4683 3.56611 10.29 3.86Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  error: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
    <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </svg>`,

  // Utility function to create icon element
  createIcon: function (name, className = '') {
    const iconContainer = document.createElement('span');
    iconContainer.className = `sg-icon ${className}`;
    iconContainer.innerHTML = this[name] || this.widget;
    return iconContainer;
  },

  // Add icons to widget headers
  addWidgetIcons: function (widgetElement) {
    if (!widgetElement) return;

    // Add header with icon if not present
    let header = widgetElement.querySelector('.widget-header');
    if (!header) {
      header = document.createElement('div');
      header.className = 'widget-header';
      header.style.display = 'flex';
      header.style.alignItems = 'center';
      header.style.marginBottom = '12px';
      header.style.paddingBottom = '8px';
      header.style.borderBottom = '1px solid rgba(255, 255, 255, 0.1)';

      const icon = this.createIcon('widget', 'widget-icon');
      icon.style.marginRight = '8px';
      icon.style.opacity = '0.7';

      const title = document.createElement('span');
      title.className = 'widget-title';
      title.textContent = 'Widget';
      title.style.fontSize = '14px';
      title.style.fontWeight = '600';
      title.style.color = '#ffffff';

      header.appendChild(icon);
      header.appendChild(title);

      // Insert header at the beginning
      if (widgetElement.firstChild) {
        widgetElement.insertBefore(header, widgetElement.firstChild);
      } else {
        widgetElement.appendChild(header);
      }
    }
  },
};

// Export for use in modules
// eslint-disable-next-line no-undef
if (typeof module !== 'undefined' && module.exports) {
  // eslint-disable-next-line no-undef
  module.exports = VectorIcons;
}

// Make available globally
if (typeof window !== 'undefined') {
  window.VectorIcons = VectorIcons;
}
