// Dynamic Widget Generator for SpaceGraphJS
class WidgetGenerator {
  constructor() {
    this.templates = new Map();
    this.registerDefaultTemplates();
  }

  // Register default widget templates
  registerDefaultTemplates() {
    // Info Widget Template
    this.templates.set('info', {
      title: 'Information',
      icon: 'widget',
      content: (data) => `
        <div class="info-widget">
          <h4 style="margin: 0 0 8px 0; color: #00ff00;">${data.title || 'Info'}</h4>
          <p style="margin: 0; line-height: 1.4;">${data.message || 'No information available.'}</p>
          ${data.timestamp ? `<small style="color: #888; margin-top: 8px; display: block;">Updated: ${new Date(data.timestamp).toLocaleString()}</small>` : ''}
        </div>
      `,
      style: `
        .info-widget h4 { color: #00ff00; font-size: 16px; }
        .info-widget p { color: #ffffff; }
      `
    });

    // Metric Widget Template
    this.templates.set('metric', {
      title: 'Metrics',
      icon: 'graph',
      content: (data) => `
        <div class="metric-widget">
          <div class="metric-value" style="font-size: 24px; font-weight: bold; color: #00ff00; text-align: center;">
            ${data.value || '0'}
          </div>
          <div class="metric-label" style="text-align: center; color: #cccccc; margin-top: 4px;">
            ${data.label || 'Metric'}
          </div>
          ${data.change !== undefined ? `
            <div class="metric-change" style="text-align: center; margin-top: 8px; font-size: 12px; color: ${data.change >= 0 ? '#00ff00' : '#ff4444'};">
              ${data.change >= 0 ? '↑' : '↓'} ${Math.abs(data.change)}%
            </div>
          ` : ''}
        </div>
      `,
      style: `
        .metric-widget { text-align: center; }
        .metric-value { font-family: 'Courier New', monospace; }
      `
    });

    // Control Widget Template
    this.templates.set('control', {
      title: 'Controls',
      icon: 'settings',
      content: (data) => `
        <div class="control-widget">
          ${data.controls ? data.controls.map(control => `
            <div class="control-item" style="margin-bottom: 12px;">
              <label style="display: block; color: #cccccc; font-size: 12px; margin-bottom: 4px;">
                ${control.label}
              </label>
              ${control.type === 'button' ? `
                <button onclick="${control.action}" style="
                  background: linear-gradient(135deg, #00ff00, #00cc00);
                  border: none;
                  border-radius: 4px;
                  padding: 6px 12px;
                  color: #000;
                  font-size: 12px;
                  cursor: pointer;
                  width: 100%;
                  transition: all 0.2s ease;
                "
                onmouseover="this.style.transform='scale(1.02)'"
                onmouseout="this.style.transform='scale(1)'">
                  ${control.text || 'Action'}
                </button>
              ` : control.type === 'slider' ? `
                <input type="range" min="${control.min || 0}" max="${control.max || 100}" value="${control.value || 50}"
                  onchange="${control.action}"
                  style="width: 100%; accent-color: #00ff00;">
              ` : ''}
            </div>
          `).join('') : '<p style="color: #888; text-align: center;">No controls available</p>'}
        </div>
      `,
      style: `
        .control-widget { }
        .control-item button:hover { box-shadow: 0 2px 8px rgba(0, 255, 0, 0.3); }
      `
    });

    // Interactive Widget Template
    this.templates.set('interactive', {
      title: 'Interactive',
      icon: 'interactive',
      content: (data) => `
        <div class="interactive-widget">
          <div class="interactive-content" style="min-height: 60px;">
            ${data.content || '<p style="color: #888; text-align: center;">Interactive content goes here</p>'}
          </div>
          <div class="interactive-actions" style="margin-top: 12px; display: flex; gap: 8px;">
            ${data.actions ? data.actions.map(action => `
              <button onclick="${action.action}" style="
                flex: 1;
                background: linear-gradient(135deg, #00ccff, #0088ff);
                border: none;
                border-radius: 4px;
                padding: 6px 8px;
                color: #fff;
                font-size: 11px;
                cursor: pointer;
                transition: all 0.2s ease;
              "
              onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 2px 6px rgba(0, 204, 255, 0.3)'"
              onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none'">
                ${action.label}
              </button>
            `).join('') : ''}
          </div>
        </div>
      `,
      style: `
        .interactive-widget { }
        .interactive-actions button:hover { background: linear-gradient(135deg, #00aaff, #0066ff); }
      `
    });
  }

  // Generate widget HTML
  generateWidget(type, data = {}) {
    const template = this.templates.get(type);
    if (!template) {
      console.warn(`Widget template '${type}' not found`);
      return this.generateWidget('info', { title: 'Error', message: `Template '${type}' not found` });
    }

    const widgetId = `widget-${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return `
      <div id="${widgetId}" class="sg-widget dynamic-widget widget-${type}" style="
        background: linear-gradient(135deg, rgba(30, 30, 30, 0.95), rgba(20, 20, 20, 0.95));
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 20px;
        min-width: 240px;
        min-height: 120px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(20px);
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        color: #ffffff;
        overflow: hidden;
        line-height: 1.5;
        transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        position: relative;
      ">
        <style>${template.style}</style>

        <!-- Widget Header -->
        <div class="widget-header" style="
          display: flex;
          align-items: center;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 8px; opacity: 0.8;">
            ${this.getIconSVG(template.icon)}
          </svg>
          <span class="widget-title" style="font-size: 14px; font-weight: 600; color: #ffffff;">
            ${template.title}
          </span>
        </div>

        <!-- Widget Content -->
        <div class="widget-content">
          ${template.content(data)}
        </div>

        <!-- Inner glow effect -->
        <div style="
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 11px;
          padding: 1px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), transparent);
          pointer-events: none;
        "></div>
      </div>
    `;
  }

  // Get SVG icon
  getIconSVG(iconName) {
    const icons = {
      widget: `<rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2" fill="none"/>
               <rect x="7" y="7" width="10" height="2" fill="currentColor"/>
               <rect x="7" y="11" width="6" height="2" fill="currentColor"/>
               <rect x="7" y="15" width="8" height="2" fill="currentColor"/>`,
      graph: `<circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
              <circle cx="6" cy="6" r="2" stroke="currentColor" stroke-width="2"/>
              <circle cx="18" cy="6" r="2" stroke="currentColor" stroke-width="2"/>
              <circle cx="6" cy="18" r="2" stroke="currentColor" stroke-width="2"/>
              <circle cx="18" cy="18" r="2" stroke="currentColor" stroke-width="2"/>
              <line x1="12" y1="12" x2="6" y2="6" stroke="currentColor" stroke-width="1"/>
              <line x1="12" y1="12" x2="18" y2="6" stroke="currentColor" stroke-width="1"/>
              <line x1="12" y1="12" x2="6" y2="18" stroke="currentColor" stroke-width="1"/>
              <line x1="12" y1="12" x2="18" y2="18" stroke="currentColor" stroke-width="1"/>`,
      settings: `<circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                 <path d="M19.4 15A7.65 7.65 0 0 0 19 12C19 8.13 15.87 5 12 5S5 8.13 5 12C5 15.87 8.13 19 12 19C13.39 19 14.68 18.59 15.8 17.9" stroke="currentColor" stroke-width="2"/>`,
      interactive: `<path d="M12 2L15 8H21L16.5 12L18 18L12 15L6 18L7.5 12L3 8H9L12 2Z" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.2"/>`
    };

    return icons[iconName] || icons.widget;
  }

  // Register custom template
  registerTemplate(name, template) {
    this.templates.set(name, template);
  }

  // Create widget element
  createWidgetElement(type, data = {}) {
    const html = this.generateWidget(type, data);
    const template = document.createElement('template');
    template.innerHTML = html.trim();
    return template.content.firstElementChild;
  }

  // Auto-generate widgets based on data
  autoGenerateWidgets(dataArray) {
    return dataArray.map(data => {
      // Determine widget type based on data
      let type = 'info';
      if (typeof data.value !== 'undefined') {
        type = 'metric';
      } else if (data.controls || data.actions) {
        type = 'interactive';
      }

      return this.generateWidget(type, data);
    });
  }
}

// Export for use in modules
// eslint-disable-next-line no-undef
if (typeof module !== 'undefined' && module.exports) {
  // eslint-disable-next-line no-undef
  module.exports = WidgetGenerator;
}

// Make available globally
if (typeof window !== 'undefined') {
  window.WidgetGenerator = WidgetGenerator;
}