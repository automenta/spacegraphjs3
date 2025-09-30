import { spawn } from 'child_process';
import path from 'path';

// List of screenshot capture scripts to run
const scripts = [
  'capture-screenshots.js',
  'capture-basic-renderer-screenshots.js',
  'capture-visible-rendering-demo.js'
];

/**
 * Run a screenshot capture script
 * @param {string} script - Script filename to run
 * @returns {Promise<void>}
 */
function runScript(script) {
  return new Promise((resolve, reject) => {
    console.log(`Running ${script}...`);
    
    const scriptPath = path.join(process.cwd(), 'doc/screenshots', script);
    const child = spawn('node', [scriptPath], {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`${script} completed successfully`);
        resolve();
      } else {
        console.error(`${script} exited with code ${code}`);
        reject(new Error(`${script} failed with exit code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      console.error(`Failed to start ${script}:`, error);
      reject(error);
    });
  });
}

/**
 * Run all screenshot capture scripts sequentially
 */
async function runAllScripts() {
  console.log('Starting screenshot capture process...');
  console.log('Make sure the development server is running on http://localhost:5174');
  console.log('');
  
  for (const script of scripts) {
    try {
      await runScript(script);
      console.log('');
    } catch (error) {
      console.error(`Error running ${script}:`, error);
      process.exit(1);
    }
  }
  
  console.log('All screenshot capture scripts completed successfully!');
}

// Run all scripts
runAllScripts().catch((error) => {
  console.error('Error running screenshot capture scripts:', error);
  process.exit(1);
});