const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);

// ✅ DEFINIR isProduction ANTES de usar
const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3000;

// ✅ AGORA pode usar isProduction
console.log('🔍 ENVIRONMENT VARIABLES:');
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);

console.log(`🚀 Iniciando servidor...`);
console.log(`📍 Ambiente: ${isProduction ? 'Produção' : 'Desenvolvimento'}`);
console.log(`🎯 Porta: ${PORT} (definida pelo Railway)`);

if (isProduction) {
  // ✅ PRODUÇÃO: Servir arquivos do Angular
  const fs = require('fs');
  const path = require('path');

  console.log('🔍 INICIANDO BUSCA POR BUILD ANGULAR...');

  // ✅ Buscar recursivamente pelo index.html
  function findAngularBuild(startPath = '/app') {
    console.log(`🔍 Procurando em: ${startPath}`);

    try {
      // Primeiro, verifica se existe dist/retro-scrum no caminho comum
      const commonPaths = [
        path.join(startPath, 'dist', 'retro-scrum', 'browser'),
        path.join(startPath, 'dist', 'retro-scrum'),
        path.join(startPath, 'dist'),
        path.join(__dirname, '..', 'dist', 'retro-scrum', 'browser'),
        path.join(__dirname, '..', 'dist', 'retro-scrum'),
        path.join(__dirname, '..', 'dist'),
        path.join(__dirname, 'dist', 'retro-scrum', 'browser'),
        path.join(__dirname, 'dist', 'retro-scrum'),
        path.join(__dirname, 'dist')
      ];

      for (const buildPath of commonPaths) {
        const indexPath = path.join(buildPath, 'index.html');
        console.log(`   📁 Testando: ${buildPath}`);

        if (fs.existsSync(indexPath)) {
          console.log(`   ✅ ENCONTRADO: ${indexPath}`);
          return buildPath;
        }
      }

      // Se não encontrou, lista a estrutura para debug
      console.log('📂 ESTRUTURA DO /app:');
      try {
        const rootItems = fs.readdirSync('/app');
        console.log('   /app:', rootItems);

        if (fs.existsSync('/app/dist')) {
          const distItems = fs.readdirSync('/app/dist');
          console.log('   /app/dist:', distItems);

          if (fs.existsSync('/app/dist/retro-scrum')) {
            const retroItems = fs.readdirSync('/app/dist/retro-scrum');
            console.log('   /app/dist/retro-scrum:', retroItems);
          }
        }
      } catch (e) {
        console.log('   Erro ao ler estrutura:', e.message);
      }

    } catch (error) {
      console.log('   Erro na busca:', error.message);
    }

    return null;
  }

  const angularPath = findAngularBuild();

  if (angularPath) {
    console.log(`🎯 CONFIGURANDO ANGULAR EM: ${angularPath}`);

    // Listar arquivos para confirmação
    try {
      const files = fs.readdirSync(angularPath);
      console.log(`📄 Arquivos no build (${files.length}):`, files.slice(0, 10));
    } catch (e) {
      console.log('❌ Erro ao listar arquivos:', e.message);
    }

    // ✅ Servir arquivos estáticos
    app.use(express.static(angularPath));

    // ✅ Rota SPA
    app.get('*', (req, res) => {
      const indexPath = path.join(angularPath, 'index.html');
      console.log(`📦 Servindo SPA: ${indexPath}`);
      res.sendFile(indexPath);
    });

    console.log('🚀 ANGULAR CONFIGURADO COM SUCESSO!');

  } else {
    console.error('💥 BUILD DO ANGULAR NÃO ENCONTRADO!');

    // Servir página de erro mais detalhada
    app.get('*', (req, res) => {
      if (req.path === '/health') {
        return res.json({
          status: 'ERROR',
          message: 'Angular build not found',
          timestamp: new Date().toISOString()
        });
      }

      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Erro - Build Não Encontrado</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
            .error { color: #d32f2f; background: #ffebee; padding: 20px; border-radius: 5px; border-left: 4px solid #d32f2f; }
            .info { background: #e3f2fd; padding: 15px; border-radius: 5px; margin-top: 20px; border-left: 4px solid #2196f3; }
            .solution { background: #e8f5e8; padding: 15px; border-radius: 5px; margin-top: 20px; border-left: 4px solid #4caf50; }
            code { background: #f5f5f5; padding: 2px 5px; border-radius: 3px; }
          </style>
        </head>
        <body>
          <h1>🚨 Erro de Deploy</h1>

          <div class="error">
            <h3>Build do Angular Não Encontrado</h3>
            <p>O servidor não conseguiu localizar os arquivos compilados do Angular.</p>
          </div>

          <div class="info">
            <h4>📋 Informações Técnicas:</h4>
            <ul>
              <li><strong>Diretório atual:</strong> <code>${__dirname}</code></li>
              <li><strong>Porta:</strong> ${PORT}</li>
              <li><strong>Ambiente:</strong> ${process.env.NODE_ENV}</li>
              <li><strong>Timestamp:</strong> ${new Date().toISOString()}</li>
            </ul>
          </div>

          <div class="solution">
            <h4>🔧 Possíveis Soluções:</h4>
            <ol>
              <li>Verifique se o build do Angular foi executado com sucesso</li>
              <li>Confirme a configuração do <code>outputPath</code> no <code>angular.json</code></li>
              <li>Verifique os logs de build no Railway</li>
              <li>O build pode estar em um caminho diferente do esperado</li>
            </ol>
          </div>
        </body>
        </html>
      `);
    });
  }
}
app.get('/test', (req, res) => {
  res.json({
    message: 'Servidor funcionando!',
    timestamp: new Date().toISOString(),
    environment: isProduction ? 'production' : 'development'
  });
});

// ✅ Rota para health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: isProduction ? 'production' : 'development',
    port: PORT
  });
});

// ✅ WebSocket Server
const wss = new WebSocket.Server({
  server,
  perMessageDeflate: false
});

// ✅ Armazenamento em memória
const sessions = new Map();

wss.on('connection', (ws, request) => {
  if (!isProduction) {
    const origin = request.headers.origin;
    if (origin && origin !== 'http://localhost:4200' && origin !== 'http://localhost:3000') {
      console.log('🚫 Conexão rejeitada - origem não permitida:', origin);
      ws.close();
      return;
    }
  }

  console.log('✅ Nova conexão WebSocket estabelecida');

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log(`📨 Mensagem recebida: ${message.type}`);

      // 🔹 CRIAR SESSÃO
      if (message.type === 'create-session') {
        const session = {
          id: generateId(),
          name: message.sessionName,
          cards: [],
          participants: [{
            name: message.userName,
            hasFinished: false,
            joinedAt: new Date()
          }],
          isRevealed: false,
          createdAt: new Date(),
          createdBy: message.userName
        };

        sessions.set(session.id, session);
        ws.sessionId = session.id;
        ws.send(JSON.stringify({ type: 'session-created', session }));
        console.log(`🎯 Sessão criada: "${session.name}" (${session.id})`);
      }

      // 🔹 ENTRAR NA SESSÃO
      else if (message.type === 'join-session') {
        const session = sessions.get(message.sessionId);
        if (session) {
          const existingUser = session.participants.find(p => p.name === message.userName);
          if (!existingUser) {
            session.participants.push({
              name: message.userName,
              hasFinished: false,
              joinedAt: new Date()
            });
          }

          ws.sessionId = message.sessionId;
          ws.send(JSON.stringify({ type: 'session-joined', session }));
          broadcastToSession(message.sessionId, { type: 'session-updated', session });
          console.log(`👤 "${message.userName}" entrou na sessão "${session.name}"`);
        } else {
          ws.send(JSON.stringify({ type: 'session-not-found' }));
          console.log(`❌ Tentativa de entrar em sessão inexistente: ${message.sessionId}`);
        }
      }

      // 🔹 ADICIONAR CARD
      else if (message.type === 'add-card') {
        const session = sessions.get(message.sessionId);
        if (session) {
          const newCard = {
            id: generateId(),
            content: message.content,
            column: message.column,
            votes: 0,
            createdAt: new Date()
          };

          session.cards.push(newCard);
          broadcastToSession(message.sessionId, { type: 'session-updated', session });
          console.log(`📝 Card adicionado: "${message.content.substring(0, 30)}..."`);
        }
      }

      // 🔹 FINALIZAR USUÁRIO
      else if (message.type === 'mark-finished') {
        const session = sessions.get(message.sessionId);
        if (session) {
          const participant = session.participants.find(p => p.name === message.userName);
          if (participant) {
            participant.hasFinished = true;
            broadcastToSession(message.sessionId, { type: 'session-updated', session });
            console.log(`✅ "${message.userName}" finalizou`);
            checkIfAllFinished(session);
          }
        }
      }

      // 🔹 REVELAR CARDS
      else if (message.type === 'reveal-cards') {
        const session = sessions.get(message.sessionId);
        if (session) {
          session.isRevealed = true;
          broadcastToSession(message.sessionId, { type: 'session-updated', session });
          console.log(`🎉 Cards revelados na sessão "${session.name}"`);
        }
      }

      // 🔹 VOTAR NO CARD
      else if (message.type === 'vote-card') {
        const session = sessions.get(message.sessionId);
        if (session) {
          const card = session.cards.find(c => c.id === message.cardId);
          if (card) {
            card.votes++;
            broadcastToSession(message.sessionId, { type: 'session-updated', session });
            console.log(`👍 Voto no card: ${card.content.substring(0, 20)}...`);
          }
        }
      }

      // 🔹 DELETAR CARD
      else if (message.type === 'delete-card') {
        const session = sessions.get(message.sessionId);
        if (session) {
          session.cards = session.cards.filter(c => c.id !== message.cardId);
          broadcastToSession(message.sessionId, { type: 'session-updated', session });
          console.log(`🗑️ Card deletado: ${message.cardId}`);
        }
      }

      else {
        console.log(`❓ Mensagem não reconhecida: ${message.type}`);
      }

    } catch (error) {
      console.error('❌ Erro ao processar mensagem:', error);
    }
  });

  ws.on('close', () => {
    console.log('🔌 Conexão WebSocket fechada');
  });

  ws.on('error', (error) => {
    console.error('💥 Erro WebSocket:', error);
  });
});

// ✅ Função para broadcast
function broadcastToSession(sessionId, message) {
  let count = 0;
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN && client.sessionId === sessionId) {
      client.send(JSON.stringify(message));
      count++;
    }
  });
  console.log(`📤 Broadcast para ${count} clientes na sessão ${sessionId}`);
}

// ✅ Verificar se todos finalizaram
function checkIfAllFinished(session) {
  const allFinished = session.participants.every(p => p.hasFinished);
  if (allFinished && !session.isRevealed) {
    console.log(`🎊 Todos finalizaram na sessão "${session.name}"! Revelando cards...`);
    setTimeout(() => {
      session.isRevealed = true;
      broadcastToSession(session.id, { type: 'session-updated', session });
    }, 2000);
  }
}

// ✅ Gerar ID único
function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

// ✅ Iniciar servidor
server.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(50));
  console.log('🚀 EASYRETRO CLONE - SERVIDOR INICIADO!');
  console.log(`📍 Ambiente: ${isProduction ? 'Produção' : 'Desenvolvimento'}`);
  console.log(`🎯 Porta: ${PORT} (Railway internal port)`);

  if (isProduction) {
    // ✅ NOVA URL CORRETA
    console.log(`🌐 URL pública: https://retro-scrum-production.up.railway.app`);
    console.log(`🔌 WebSocket: wss://retro-scrum-production.up.railway.app`);
  }

  console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
  console.log(`💾 Sessões ativas: ${sessions.size}`);
  console.log('='.repeat(50));
});

// ✅ Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Desligando servidor graciosamente...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Recebido SIGTERM, desligando...');
  process.exit(0);
});
