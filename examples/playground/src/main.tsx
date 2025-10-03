import { createSignal, onMount } from 'solid-js';
import * as monaco from 'monaco-editor';
import { SpaceGraph } from 'spacegraphjs';

const [_code, setCode] = createSignal('');
const [graph, setGraph] = createSignal<SpaceGraph | null>(null);

let editor: monaco.editor.IStandaloneCodeEditor;
let graphContainer: HTMLDivElement;

const templates = {
  basic: `// Basic SpaceGraphJS Example
const graph = new SpaceGraph({
  element: '#graph-container',
  data: {
    nodes: [
      { id: '1', label: 'Node 1', x: 0, y: 0 },
      { id: '2', label: 'Node 2', x: 100, y: 100 },
      { id: '3', label: 'Node 3', x: -100, y: 100 }
    ],
    links: [
      { source: '1', target: '2' },
      { source: '2', target: '3' },
      { source: '3', target: '1' }
    ]
  }
});

graph.render();`,

  large: `// Large Graph Example
const nodes = [];
const links = [];

for (let i = 0; i < 100; i++) {
  nodes.push({
    id: i.toString(),
    label: \`Node \${i}\`,
    x: Math.random() * 1000 - 500,
    y: Math.random() * 1000 - 500
  });
}

for (let i = 0; i < 200; i++) {
  const source = Math.floor(Math.random() * 100);
  const target = Math.floor(Math.random() * 100);
  if (source !== target) {
    links.push({
      source: source.toString(),
      target: target.toString()
    });
  }
}

const graph = new SpaceGraph({
  element: '#graph-container',
  data: { nodes, links }
});

graph.render();`,

  interactive: `// Interactive Edges Example
const graph = new SpaceGraph({
  element: '#graph-container',
  data: {
    nodes: [
      { id: '1', label: 'Node 1', x: -100, y: 0 },
      { id: '2', label: 'Node 2', x: 100, y: 0 }
    ],
    links: [
      { source: '1', target: '2', label: 'Interactive Edge' }
    ]
  },
  interaction: {
    edges: {
      hoverable: true,
      clickable: true
    }
  }
});

graph.render();`,
};

function initializeEditor() {
  const editorContainer = document.getElementById('editor-container');
  if (!editorContainer) return;

  editor = monaco.editor.create(editorContainer, {
    value: templates.basic,
    language: 'javascript',
    theme: 'vs-dark',
    fontSize: 14,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    automaticLayout: true,
  });

  setCode(templates.basic);
}

function runCode() {
  const currentCode = editor.getValue();
  setCode(currentCode);

  // Clean up previous graph
  if (graph()) {
    graph()!.destroy();
  }

  // Clear container
  graphContainer.innerHTML = '';

  try {
    // Execute the code in a sandboxed environment
    const func = new Function('SpaceGraph', 'container', currentCode);
    const newGraph = func(SpaceGraph, graphContainer);
    setGraph(newGraph);
  } catch (error) {
    console.error('Error executing code:', error);
    // Display error in preview
    graphContainer.innerHTML =
      '<div style="color: red; padding: 20px;">Error: ' +
      (error as Error).message +
      '</div>';
  }
}

function loadTemplate(template: string) {
  const templateCode = templates[template as keyof typeof templates];
  if (templateCode && editor) {
    editor.setValue(templateCode);
    runCode();
  }
}

function _parseCSV(csvText: string) {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map((h) => h.trim());

  const nodes = [];
  const links = [];

  // Assume first column is node ID, second is label, third/fourth are x/y coordinates
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim());
    if (values.length >= 2) {
      nodes.push({
        id: values[0],
        label: values[1] || values[0],
        x: values[2] ? parseFloat(values[2]) : Math.random() * 400 - 200,
        y: values[3] ? parseFloat(values[3]) : Math.random() * 400 - 200,
      });
    }
  }

  // If there are link columns (source,target), create links
  if (headers.length >= 5) {
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim());
      if (values[4] && values[5]) {
        links.push({
          source: values[4],
          target: values[5],
        });
      }
    }
  }

  return { nodes, links };
}

function importData() {
  const input = document.getElementById('file-input') as HTMLInputElement;
  input.click();

  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        // Generate code from data
        const generatedCode = generateCodeFromData(data);
        editor.setValue(generatedCode);
        runCode();
      } catch (error) {
        alert('Error parsing file: ' + (error as Error).message);
      }
    };
    reader.readAsText(file);
  };
}

function generateCodeFromData(data: any) {
  return `const graph = new SpaceGraph({
  element: '#graph-container',
  data: ${JSON.stringify(data, null, 2)}
});

graph.render();`;
}

function shareCode() {
  const currentCode = editor.getValue();
  const encoded = btoa(currentCode);
  const url = `${window.location.origin}${window.location.pathname}?code=${encoded}`;

  navigator.clipboard.writeText(url).then(() => {
    alert('Share URL copied to clipboard!');
  });
}

function loadFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  const encodedCode = urlParams.get('code');
  if (encodedCode) {
    try {
      const decodedCode = atob(encodedCode);
      editor.setValue(decodedCode);
      runCode();
    } catch (error) {
      console.error('Error loading code from URL:', error);
    }
  }
  function _startTutorial() {
    const steps = [
      {
        title: 'Welcome to SpaceGraphJS Playground!',
        content:
          "This interactive playground lets you create and visualize graphs using SpaceGraphJS. Let's walk through the main features.",
        target: null,
      },
      {
        title: 'Code Editor',
        content:
          'This is the Monaco code editor where you write JavaScript code to create your graphs. Try editing the code and see the preview update automatically!',
        target: '.editor-container',
      },
      {
        title: 'Template Selection',
        content:
          'Choose from pre-built templates to get started quickly. Select different templates from the dropdown to see various graph examples.',
        target: '#template-select',
      },
      {
        title: 'Run Button',
        content:
          "Click 'Run' to execute your code and update the graph preview. The preview updates automatically, but you can also run manually.",
        target: '#run-btn',
      },
      {
        title: 'Import Data',
        content:
          'Import your own data from JSON or CSV files. The playground will generate code based on your data structure.',
        target: '#import-btn',
      },
      {
        title: 'Share Your Creations',
        content:
          'Share your graphs with others using the shareable URL feature. Your code gets encoded in the URL for easy sharing.',
        target: '#share-btn',
      },
      {
        title: 'Live Preview',
        content:
          'See your graph come to life in the preview panel. Interact with nodes and edges, zoom and pan to explore your data.',
        target: '.preview-container',
      },
      {
        title: 'Ready to Explore!',
        content:
          "Now you're ready to create amazing graphs! Try the different templates, import your own data, or write custom code. Have fun exploring SpaceGraphJS!",
        target: null,
      },
    ];

    const _currentStep = 0;

    function showStep(stepIndex: number) {
      // Remove previous highlights
      document.querySelectorAll('.tutorial-highlight').forEach((el) => {
        el.classList.remove('tutorial-highlight');
      });

      const step = steps[stepIndex];

      // Create modal
      const modal = document.createElement('div');
      modal.className = 'tutorial-modal';
      modal.innerHTML = `
      <div class="tutorial-content">
        <h2>${step.title}</h2>
        <p>${step.content}</p>
        <div class="tutorial-buttons">
          ${stepIndex > 0 ? '<button id="prev-btn">Previous</button>' : ''}
          <button id="next-btn">${stepIndex < steps.length - 1 ? 'Next' : 'Finish'}</button>
          <button id="skip-btn">Skip Tutorial</button>
        </div>
      </div>
    `;

      document.body.appendChild(modal);

      // Highlight target element
      if (step.target) {
        const targetElement = document.querySelector(step.target);
        if (targetElement) {
          targetElement.classList.add('tutorial-highlight');
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }

      // Event listeners
      document.getElementById('next-btn')?.addEventListener('click', () => {
        document.body.removeChild(modal);
        if (stepIndex < steps.length - 1) {
          showStep(stepIndex + 1);
        }
      });

      document.getElementById('prev-btn')?.addEventListener('click', () => {
        document.body.removeChild(modal);
        if (stepIndex > 0) {
          showStep(stepIndex - 1);
        }
      });

      document.getElementById('skip-btn')?.addEventListener('click', () => {
        document.body.removeChild(modal);
        // Remove highlights
        document.querySelectorAll('.tutorial-highlight').forEach((el) => {
          el.classList.remove('tutorial-highlight');
        });
      });
    }

    showStep(0);
  }
}

onMount(() => {
  graphContainer = document.getElementById('graph-container') as HTMLDivElement;

  initializeEditor();

  // Event listeners
  document.getElementById('run-btn')?.addEventListener('click', runCode);
  document
    .getElementById('template-select')
    ?.addEventListener('change', (e) => {
      loadTemplate((e.target as HTMLSelectElement).value);
    });
  document.getElementById('import-btn')?.addEventListener('click', importData);
  document.getElementById('share-btn')?.addEventListener('click', shareCode);

  // Load from URL if present
  loadFromURL();

  // Initial run
  runCode();
});

// Cleanup on unmount
window.addEventListener('beforeunload', () => {
  if (graph()) {
    graph()!.destroy();
  }
  if (editor) {
    editor.dispose();
  }
});
