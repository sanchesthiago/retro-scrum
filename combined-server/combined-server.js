const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');

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
    console.log('🔍 ENVIRONMENT VARIABLES:');
    console.log('  PORT:', process.env.PORT);
    console.log('  NODE_ENV:', process.env.NODE_ENV);
  }

  setupStaticFiles() {
    // ✅ Middleware básico
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // ✅ Headers de segurança
    this.app.use((req, res, next) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      next();
    });
  }

  setupApiRoutes() {
    // ✅ Health Check melhorado
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

    // ✅ API de status do servidor
    this.app.get('/api/status', (req, res) => {
      res.json({
        version: '1.0.0',
        status: 'running',
        websocketConnections: this.wss.clients.size,
        activeSessions: this.sessions.size,
        serverTime: new Date().toISOString()
      });
    });

    // ✅ Test endpoint
    this.app.get('/api/test', (req, res) => {
      res.json({
        message: 'API funcionando!',
        timestamp: new Date().toISOString()
      });
    });
  }

  setupAngularSpa() {
    if (!this.isProduction) {
      console.log('🔧 Modo desenvolvimento: API apenas');
      return;
    }

    console.log('📦 Configurando Angular SPA...');

    const angularConfigs = [
      // ✅ Estrutura atual (aninhada)
      { path: '../dist/retro-scrum/browser/browser', name: 'aninhada' },
      // ✅ Estrutura padrão esperada
      { path: '../dist/retro-scrum/browser', name: 'padrão' },
      // ✅ Estrutura alternativa
      { path: '../dist/retro-scrum', name: 'alternativa' },
      // ✅ Fallback absoluto
      { path: '/app/dist/retro-scrum/browser', name: 'absoluta' }
    ];

    let angularPath = null;

    for (const config of angularConfigs) {
      const testPath = path.join(__dirname, config.path);
      const indexPath = path.join(testPath, 'index.html');

      if (fs.existsSync(indexPath)) {
        angularPath = testPath;
        console.log(`✅ Angular encontrado (${config.name}): ${angularPath}`);
        break;
      } else {
        console.log(`❌ Não encontrado (${config.name}): ${testPath}`);
      }
    }

    if (angularPath) {
      // ✅ Servir arquivos estáticos
      this.app.use(express.static(angularPath, {
        index: false,
        etag: true,
        lastModified: true,
        maxAge: this.isProduction ? '1h' : '0'
      }));

      // ✅ Rota SPA para todas as outras requisições
      this.app.get('*', (req, res) => {
        // Ignorar rotas de API
        if (req.path.startsWith('/api/') || req.path.startsWith('/health')) {
          return res.status(404).json({ error: 'Endpoint não encontrado' });
        }

        const indexPath = path.join(angularPath, 'index.html');
        res.sendFile(indexPath);
      });

      console.log('🎉 Angular SPA configurado com sucesso!');
    } else {
      console.error('💥 Angular não encontrado em nenhum local!');
      this.setupFallbackRoutes();
    }
  }

  setupFallbackRoutes() {
    // ✅ Página de erro mais informativa
    this.app.get('*', (req, res) => {
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint não encontrado' });
      }

      res.status(500).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Retro Scrum - Erro de Configuração</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              margin: 0;
              padding: 40px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              min-height: 100vh;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: rgba(255,255,255,0.1);
              padding: 30px;
              border-radius: 10px;
              backdrop-filter: blur(10px);
            }
            .error {
              background: rgba(255,0,0,0.2);
              padding: 20px;
              border-radius: 8px;
              border-left: 4px solid #ff4444;
            }
            code {
              background: rgba(0,0,0,0.3);
              padding: 2px 6px;
              border-radius: 4px;
              font-family: 'Courier New', monospace;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🚨 Retro Scrum - Erro de Configuração</h1>
            <div class="error">
              <p>O build do Angular não foi encontrado.</p>
              <p>Verifique se o build foi executado com sucesso.</p>
            </div>
            <p><strong>Dica:</strong> Execute <code>npm run build</code> no frontend.</p>
          </div>
        </body>
        </html>
      `);
    });
  }

  setupWebSocket() {
    this.wss.on('connection', (ws, request) => {
      // ✅ Validação de origem em produção
      if (this.isProduction) {
        const origin = request.headers.origin;
        const allowedOrigins = [
          'https://retro-scrum-production.up.railway.app',
          'https://yourdomain.com' // Adicione outros domínios se necessário
        ];

        if (origin && !allowedOrigins.includes(origin)) {
          console.log('🚫 Conexão rejeitada - origem não permitida:', origin);
          ws.close();
          return;
        }
      }

      console.log('✅ Nova conexão WebSocket estabelecida');
      ws.isAlive = true;

      // ✅ Heartbeat para conexões ativas
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

    // ✅ Heartbeat interval
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

      const handlers = {
        'create-session': this.handleCreateSession.bind(this),
        'join-session': this.handleJoinSession.bind(this),
        'add-card': this.handleAddCard.bind(this),
        'mark-finished': this.handleMarkFinished.bind(this),
        'reveal-cards': this.handleRevealCards.bind(this),
        'vote-card': this.handleVoteCard.bind(this),
        'delete-card': this.handleDeleteCard.bind(this)
      };

      const handler = handlers[message.type];
      if (handler) {
        handler(ws, message);
      } else {
        console.log(`❓ Mensagem não reconhecida: ${message.type}`);
        ws.send(JSON.stringify({ type: 'error', message: 'Tipo de mensagem não suportado' }));
      }

    } catch (error) {
      console.error('❌ Erro ao processar mensagem:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Erro interno do servidor'
      }));
    }
  }

  // ✅ Handlers melhorados (mantenha os que você já tem, mas organizados)
  handleCreateSession(ws, message) {
    const session = {
      id: this.generateId(),
      name: message.sessionName,
      cards: [],
      participants: [{
        name: message.userName,
        hasFinished: false,
        joinedAt: new Date(),
        id: this.generateId()
      }],
      isRevealed: false,
      createdAt: new Date(),
      createdBy: message.userName,
      settings: {
        maxVotes: 5,
        allowMultipleVotes: false
      }
    };

    this.sessions.set(session.id, session);
    ws.sessionId = session.id;
    ws.userName = message.userName;

    ws.send(JSON.stringify({
      type: 'session-created',
      session,
      user: { name: message.userName, isHost: true }
    }));

    console.log(`🎯 Sessão criada: "${session.name}" (${session.id}) por ${message.userName}`);
  }

  handleJoinSession(ws, message) {
    const session = this.sessions.get(message.sessionId);
    if (!session) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Sessão não encontrada'
      }));
      return;
    }

    const existingUser = session.participants.find(p => p.name === message.userName);
    if (!existingUser) {
      session.participants.push({
        name: message.userName,
        hasFinished: false,
        joinedAt: new Date(),
        id: this.generateId()
      });
    }

    ws.sessionId = message.sessionId;
    ws.userName = message.userName;

    ws.send(JSON.stringify({
      type: 'session-joined',
      session,
      user: {
        name: message.userName,
        isHost: session.createdBy === message.userName
      }
    }));

    this.broadcastToSession(message.sessionId, {
      type: 'session-updated',
      session
    });

    console.log(`👤 "${message.userName}" entrou na sessão "${session.name}"`);
  }

  // ✅ Mantenha os outros handlers (add-card, mark-finished, etc) que você já tem

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
        // Remove user da sessão se necessário
        console.log(`👋 ${ws.userName} desconectado da sessão ${session.name}`);
      }
    }
  }

  generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  startServer() {
    this.server.listen(this.PORT, '0.0.0.0', () => {
      console.log('='.repeat(50));
      console.log('🚀 RETRO SCRUM - SERVIDOR INICIADO!');
      console.log(`📍 Ambiente: ${this.isProduction ? 'Produção' : 'Desenvolvimento'}`);
      console.log(`🎯 Porta: ${this.PORT}`);

      if (this.isProduction) {
        console.log(`🌐 URL: https://retro-scrum-production.up.railway.app`);
        console.log(`🔌 WebSocket: wss://retro-scrum-production.up.railway.app`);
      } else {
        console.log(`🌐 URL: http://localhost:${this.PORT}`);
        console.log(`🔌 WebSocket: ws://localhost:${this.PORT}`);
      }

      console.log(`❤️  Health Check: /health`);
      console.log(`📊 API Status: /api/status`);
      console.log(`💾 Sessões ativas: ${this.sessions.size}`);
      console.log('='.repeat(50));
    });
  }
}

// ✅ Graceful shutdown
function setupGracefulShutdown(server) {
  const shutdown = (signal) => {
    console.log(`\n🛑 Recebido ${signal}, desligando graciosamente...`);

    // Fechar todas as conexões WebSocket
    server.wss.clients.forEach(client => {
      client.close();
    });

    // Parar o servidor
    server.server.close(() => {
      console.log('✅ Servidor parado com sucesso');
      process.exit(0);
    });

    // Timeout forçado após 10 segundos
    setTimeout(() => {
      console.log('⚠️  Shutdown forçado');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

// ✅ Iniciar servidor
const server = new RetroScrumServer();
setupGracefulShutdown(server);

module.exports = server;
