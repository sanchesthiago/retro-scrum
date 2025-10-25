const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');
const Handlers = require('./handlers');

class RetroScrumServer {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.wss = new WebSocket.Server({
      server: this.server,
      perMessageDeflate: false
    });

    this.sessions = new Map();
    this.isProduction = process.env.NODE_ENV === 'production';
    this.PORT = process.env.PORT || 3000;

    // ✅ Inicializar handlers
    this.handlers = new Handlers(
      this.sessions,
      this.broadcastToSession.bind(this),
      this.generateId.bind(this)
    );

    this.init();
  }

  init() {
    this.setupEnvironment();
    this.setupStaticFiles();
    this.setupApiRoutes();
    this.setupWebSocket();
    this.setupAngularSpa();
    this.startServer();
  }

  setupEnvironment() {
    console.log('🚀 INICIANDO RETRO SCRUM SERVER');
    console.log('📍 Ambiente:', this.isProduction ? 'Produção' : 'Desenvolvimento');
    console.log('🎯 Porta:', this.PORT);
  }

  setupStaticFiles() {
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    this.app.use((req, res, next) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      next();
    });
  }

  setupApiRoutes() {
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: this.isProduction ? 'production' : 'development',
        sessions: this.sessions.size,
        memory: process.memoryUsage(),
        uptime: process.uptime()
      });
    });

    this.app.get('/api/status', (req, res) => {
      res.json({
        version: '1.0.0',
        status: 'running',
        websocketConnections: this.wss.clients.size,
        activeSessions: this.sessions.size,
        serverTime: new Date().toISOString()
      });
    });

    this.app.get('/api/test', (req, res) => {
      res.json({
        message: 'API funcionando!',
        timestamp: new Date().toISOString()
      });
    });
  }

  setupWebSocket() {
    this.wss.on('connection', (ws, request) => {
      if (this.isProduction) {
        const origin = request.headers.origin;
        const allowedOrigins = [
          'https://retro-scrum-production.up.railway.app'
        ];

        if (origin && !allowedOrigins.includes(origin)) {
          console.log('🚫 Conexão rejeitada - origem não permitida:', origin);
          ws.close();
          return;
        }
      }

      console.log('✅ Nova conexão WebSocket estabelecida');
      ws.isAlive = true;

      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('message', (data) => {
        this.handleWebSocketMessage(ws, data);
      });

      ws.on('close', () => {
        console.log('🔌 Conexão WebSocket fechada');
        this.cleanupUserSession(ws);
      });

      ws.on('error', (error) => {
        console.error('💥 Erro WebSocket:', error);
      });
    });

    setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (!ws.isAlive) {
          console.log('💔 Conexão inativa, fechando...');
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);
  }

  handleWebSocketMessage(ws, data) {
    try {
      const message = JSON.parse(data.toString());
      console.log(`📨 Mensagem recebida: ${message.type}`);

      // ✅ Obter handlers do módulo
      const handlers = this.handlers.getHandlers();
      const handler = handlers[message.type];

      if (handler) {
        handler(ws, message);
      } else {
        console.log(`❓ Mensagem não reconhecida: ${message.type}`);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Tipo de mensagem não suportado'
        }));
      }

    } catch (error) {
      console.error('❌ Erro ao processar mensagem:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Erro interno do servidor'
      }));
    }
  }

  broadcastToSession(sessionId, message) {
    let count = 0;
    this.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN && client.sessionId === sessionId) {
        client.send(JSON.stringify(message));
        count++;
      }
    });
    console.log(`📤 Broadcast para ${count} clientes na sessão ${sessionId}`);
  }

  cleanupUserSession(ws) {
    if (ws.sessionId && ws.userName) {
      const session = this.sessions.get(ws.sessionId);
      if (session) {
        console.log(`👋 ${ws.userName} desconectado da sessão ${session.name}`);
      }
    }
  }

  generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  setupAngularSpa() {
    if (!this.isProduction) {
      console.log('🔧 Modo desenvolvimento: API apenas');
      return;
    }

    console.log('📦 Configurando Angular SPA...');

    const angularConfigs = [
      { path: '../dist/retro-scrum/browser', name: 'natural' },
      { path: '../dist/retro-scrum/browser/browser', name: 'aninhada' }
    ];

    let angularPath = null;

    for (const config of angularConfigs) {
      const testPath = path.join(__dirname, config.path);
      const indexPath = path.join(testPath, 'index.html');

      if (fs.existsSync(indexPath)) {
        angularPath = testPath;
        console.log(`✅ Angular encontrado (${config.name}): ${angularPath}`);
        break;
      }
    }

    if (angularPath) {
      this.app.use(express.static(angularPath, { index: false }));

      this.app.get('*', (req, res) => {
        if (req.path.startsWith('/api/') || req.path.startsWith('/health')) {
          return res.status(404).json({ error: 'Endpoint não encontrado' });
        }
        res.sendFile(path.join(angularPath, 'index.html'));
      });

      console.log('🎉 Angular SPA configurado com sucesso!');
    } else {
      console.error('💥 Angular não encontrado!');
      this.setupFallbackRoutes();
    }
  }

  setupFallbackRoutes() {
    this.app.get('*', (req, res) => {
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint não encontrado' });
      }
      res.status(500).send('Angular build não encontrado');
    });
  }

  startServer() {
    this.server.listen(this.PORT, '0.0.0.0', () => {
      console.log('='.repeat(50));
      console.log('🚀 RETRO SCRUM - SERVIDOR INICIADO!');
      console.log(`📍 Ambiente: ${this.isProduction ? 'Produção' : 'Desenvolvimento'}`);
      console.log(`🎯 Porta: ${this.PORT}`);
      console.log(`💾 Sessões ativas: ${this.sessions.size}`);
      console.log('='.repeat(50));
    });
  }
}

// ✅ Graceful shutdown
function setupGracefulShutdown(server) {
  const shutdown = (signal) => {
    console.log(`\n🛑 Recebido ${signal}, desligando...`);
    server.wss.clients.forEach(client => client.close());
    server.server.close(() => {
      console.log('✅ Servidor parado');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

const server = new RetroScrumServer();
setupGracefulShutdown(server);

module.exports = server;
