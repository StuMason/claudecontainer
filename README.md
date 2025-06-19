# Claude Code Remote API

A containerized API service that enables remote access to Anthropic's Claude Code functionality, allowing you to fix build issues and run development tasks from anywhere - even from your phone via WhatsApp and n8n integrations.

## Overview

This project solves a common developer pain point: getting notified about broken builds on your phone but being unable to do anything about it until you're back at your computer. By containerizing Claude Code and exposing it through a REST API, you can now trigger code fixes remotely through various interfaces like WhatsApp, Slack, or any HTTP client.

## Architecture

```
Phone/WhatsApp → n8n/Zapier → HTTP Request → Claude Code API → Your Codebase
```

The system consists of:
- **Express.js API Server**: Provides HTTP endpoints for Claude Code interactions
- **Docker Container**: Isolates the environment and includes Claude Code CLI
- **Target Repository**: A workspace repository (`get-mcp-keys`) that Claude can operate on

## Features

- ✅ Remote Claude Code execution via REST API
- ✅ Multiple input methods (stdin, pipe)
- ✅ Containerized environment for consistent execution
- ✅ Health check endpoints
- ✅ Error handling and logging
- ✅ Ready for integration with automation tools (n8n, Zapier, etc.)

## API Endpoints

### `GET /health`
Health check endpoint to verify the service is running.

**Response:**
```json
{
  "status": "ok",
  "workspace": "/workspace/get-mcp-keys",
  "nodeVersion": "v18.x.x",
  "npmVersion": "9.x.x",
  "processNodeVersion": "v18.x.x"
}
```

### `GET /test-claude`
Test Claude Code installation and get version information.

**Response:**
```json
{
  "success": true,
  "version": "claude-code version x.x.x",
  "nodeVersion": "v18.x.x"
}
```

### `POST /run-stdin`
Execute Claude Code commands via stdin.

**Request Body:**
```json
{
  "command": "fix this build error: npm ERR! missing script: start"
}
```

**Response:**
```json
{
  "success": true,
  "output": "Claude's response and code fixes...",
  "error": "",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### `POST /run-pipe`
Execute Claude Code commands via echo pipe (alternative method).

**Request Body:**
```json
{
  "command": "analyze the package.json and suggest improvements"
}
```

## Setup Instructions

### Prerequisites
- Docker and Docker Compose installed
- Anthropic API key configured in your environment
- Git access to your target repository

### 1. Clone and Build
```bash
git clone <your-repo>
cd ccpoc

# Build the Docker image
docker build -t claude-mcp-authenticated .
```

### 2. Configure Environment
Make sure Claude Code is properly authenticated in your environment. The container will inherit your SSH keys for Git access.

### 3. Run with Docker Compose
```bash
docker-compose up -d
```

The API will be available at `http://localhost:3001`

### 4. Test the Setup
```bash
# Health check
curl http://localhost:3001/health

# Test Claude Code
curl http://localhost:3001/test-claude

# Send a command
curl -X POST http://localhost:3001/run-stdin \
  -H "Content-Type: application/json" \
  -d '{"command": "list all files in the current directory"}'
```

## Integration Examples

### WhatsApp via n8n
1. Set up an n8n workflow with WhatsApp trigger
2. Add an HTTP Request node pointing to your API
3. Parse the message content and send to `/run-stdin`
4. Return Claude's response back to WhatsApp

### Slack Bot
```javascript
// Slack bot example
app.command('/fix-build', async ({ command, ack, respond }) => {
  await ack();
  
  const response = await fetch('http://your-server:3001/run-stdin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command: command.text })
  });
  
  const result = await response.json();
  await respond(result.output);
});
```

### Mobile Shortcut (iOS)
Create a Shortcuts automation that:
1. Accepts text input
2. Makes HTTP request to your API
3. Displays the response

## Configuration

### Environment Variables
- `PORT`: API server port (default: 3000)
- `NODE_TLS_REJECT_UNAUTHORIZED`: Set to 0 in container for SSL issues

### Workspace Configuration
The container clones the `get-mcp-keys` repository to `/workspace/get-mcp-keys`. To change the target repository, modify the Dockerfile:

```dockerfile
RUN git clone https://github.com/your-username/your-repo.git
```

## Security Considerations

⚠️ **Important Security Notes:**
- This API provides direct access to Claude Code execution
- Ensure proper network security (VPN, firewall rules)
- Consider adding authentication/authorization
- Monitor API usage and logs
- The current setup uses `NODE_TLS_REJECT_UNAUTHORIZED=0` - review for production

## Troubleshooting

### Common Issues

1. **Claude authentication fails**
   - Ensure your Anthropic API key is properly configured
   - Check that `claude --version` works in your local environment

2. **Git access issues**
   - Verify SSH keys are properly mounted
   - Check repository permissions

3. **Container networking**
   - Ensure port 3001 is available
   - Check Docker network configuration

### Logs
```bash
# View container logs
docker-compose logs -f get-mcp-keys-claude

# Check health endpoint
curl http://localhost:3001/health
```

## Development

### Local Development
```bash
npm install
npm install -g nodemon
nodemon server.js
```

### Adding New Endpoints
The Express server is set up for easy extension. Add new routes in `server.js`:

```javascript
app.post('/custom-command', async (req, res) => {
  // Your custom logic here
});
```

## Use Cases

- **Remote Build Fixes**: Get build error notifications and fix them remotely
- **Code Review Assistance**: Quick code analysis and suggestions
- **Documentation Generation**: Generate docs for repositories
- **Dependency Updates**: Analyze and update project dependencies
- **Security Scanning**: Remote security analysis of codebases

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with the containerized environment
5. Submit a pull request

## License

[Add your license here]

---

**Built with ❤️ to solve the "broken build on mobile" problem** 