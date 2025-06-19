# Use Node.js 18 base image
FROM node:18-bullseye

# Install git
RUN apt-get update && apt-get install -y \
    git \
    ca-certificates \
    curl

# Update CA certificates
RUN update-ca-certificates

# Install claude-code globally
RUN npm i -g @anthropic-ai/claude-code

ENV NODE_TLS_REJECT_UNAUTHORIZED=0

# Clone the specific repo
WORKDIR /workspace
RUN git clone https://github.com/stumason/get-mcp-keys.git
WORKDIR /workspace/get-mcp-keys

# Setup app directory
WORKDIR /app
COPY package.json /app/package.json
RUN npm install
RUN npm install -g nodemon

# Copy server file
COPY server.js /app/server.js

EXPOSE 3000
CMD ["nodemon", "server.js"]