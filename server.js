import express from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import { spawn } from 'child_process';

const execPromise = promisify(exec);
const app = express();
app.use(express.json());

const WORKSPACE = '/workspace/get-mcp-keys';

// Test if claude works
app.get('/test-claude', async (req, res) => {
  try {
    // Test basic claude execution
    const { stdout, stderr } = await execPromise('claude --version');
    res.json({ 
      success: true, 
      version: stdout.trim(),
      stderr,
      nodeVersion: process.version 
    });
  } catch (error) {
    res.json({ 
      success: false, 
      error: error.message,
      stdout: error.stdout,
      stderr: error.stderr,
      nodeVersion: process.version
    });
  }
});

// Try running claude with input via stdin
app.post('/run-stdin', async (req, res) => {
  const { command } = req.body;
  
  if (!command) {
    return res.status(400).json({ error: 'No command provided' });
  }

  try {
    // Create a promise to handle the spawn
    const result = await new Promise((resolve, reject) => {
      const claude = spawn('claude', [], {
        cwd: WORKSPACE,
        env: process.env
      });

      let stdout = '';
      let stderr = '';

      claude.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      claude.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      claude.on('close', (code) => {
        if (code !== 0) {
          reject({ code, stdout, stderr });
        } else {
          resolve({ stdout, stderr });
        }
      });

      claude.on('error', (err) => {
        reject({ error: err.message, stdout, stderr });
      });

      // Send the command to claude
      claude.stdin.write(command + '\n');
      claude.stdin.end();
    });

    res.json({
      success: true,
      output: result.stdout,
      error: result.stderr,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      ...error,
      timestamp: new Date().toISOString()
    });
  }
});

// Alternative: Try with echo pipe
app.post('/run-pipe', async (req, res) => {
  const { command } = req.body;
  
  if (!command) {
    return res.status(400).json({ error: 'No command provided' });
  }

  try {
    const { stdout, stderr } = await execPromise(
      `echo "${command.replace(/"/g, '\\"')}" | claude`,
      { 
        cwd: WORKSPACE,
        maxBuffer: 1024 * 1024 * 10
      }
    );

    res.json({
      success: true,
      output: stdout,
      error: stderr,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      stdout: error.stdout || '',
      stderr: error.stderr || '',
      timestamp: new Date().toISOString()
    });
  }
});

// Health check
app.get('/health', async (req, res) => {
  try {
    const { stdout: nodeVersion } = await execPromise('node --version');
    const { stdout: npmVersion } = await execPromise('npm --version');
    
    res.json({ 
      status: 'ok',
      workspace: WORKSPACE,
      nodeVersion: nodeVersion.trim(),
      npmVersion: npmVersion.trim(),
      processNodeVersion: process.version
    });
  } catch (error) {
    res.json({ 
      status: 'error',
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Claude API server running on port ${PORT}`);
});