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

  console.log('🔍 CONFIGURANDO ANGULAR (ESTRUTURA ANINHADA)...');

  // ✅ CAMINHO CORRETO - com a estrutura aninhada
  const angularPath = path.join(__dirname, '../dist/retro-scrum/browser/browser');
  const indexPath = path.join(angularPath, 'index.html');

  console.log(`📁 Caminho do build: ${angularPath}`);
  console.log(`📁 Arquivo index: ${indexPath}`);

  // Verificar se existe
  if (fs.existsSync(indexPath)) {
    console.log('✅ INDEX.HTML ENCONTRADO! Iniciando servidor...');

    // Listar arquivos para confirmação
    try {
      const files = fs.readdirSync(angularPath);
      console.log(`📄 Total de arquivos: ${files.length}`);
      console.log(`📄 Primeiros arquivos: ${files.slice(0, 10).join(', ')}`);
    } catch (error) {
      console.log('⚠️  Erro ao listar arquivos:', error.message);
    }

    // ✅ Servir arquivos estáticos do Angular
    app.use(express.static(angularPath));

    // ✅ Rota para SPA - todas as rotas vão para index.html
    app.get('*', (req, res) => {
      res.sendFile(indexPath);
    });

    console.log('🚀 ANGULAR CONFIGURADO COM SUCESSO!');

  } else {
    console.error('❌ index.html não encontrado no caminho aninhado!');

    // ✅ VERIFICAÇÃO COMPLETA DA ESTRUTURA
    console.log('🔍 VERIFICAÇÃO COMPLETA DA ESTRUTURA:');

    const checkStructure = (basePath) => {
      try {
        if (fs.existsSync(basePath)) {
          const items = fs.readdirSync(basePath);
          console.log(`📁 ${basePath}:`);
          items.forEach(item => {
            const fullPath = path.join(basePath, item);
            const isDir = fs.statSync(fullPath).isDirectory();
            console.log(`   ${isDir ? '📁' : '📄'} ${item}${isDir ? '/' : ''}`);

            // Se for diretório, verificar um nível mais profundo
            if (isDir && item === 'browser') {
              const subItems = fs.readdirSync(fullPath);
              console.log(`      ↳ ${subItems.slice(0, 5).join(', ')}${subItems.length > 5 ? '...' : ''}`);
            }
          });
        }
      } catch (e) {
        console.log(`   ❌ Erro: ${e.message}`);
      }
    };

    // Verificar toda a estrutura
    checkStructure(path.join(__dirname, '..', 'dist'));
    checkStructure(path.join(__dirname, '..', 'dist', 'retro-scrum'));
    checkStructure(path.join(__dirname, '..', 'dist', 'retro-scrum', 'browser'));

    // ✅ PROCURAR INDEX.HTML RECURSIVAMENTE
    console.log('🔎 PROCURANDO INDEX.HTQL RECURSIVAMENTE:');

    function findIndexHtml(startPath, maxDepth = 3) {
      function search(currentPath, depth) {
        if (depth > maxDepth) return null;

        try {
          const items = fs.readdirSync(currentPath);
          for (const item of items) {
            const fullPath = path.join(currentPath, item);

            if (item === 'index.html') {
              return fullPath;
            }

            if (fs.statSync(fullPath).isDirectory()) {
              const result = search(fullPath, depth + 1);
              if (result) return result;
            }
          }
        } catch (e) {
          // Ignorar erros de leitura
        }
        return null;
      }

      return search(startPath, 0);
    }

    const foundIndexPath = findIndexHtml(path.join(__dirname, '..', 'dist'));
    if (foundIndexPath) {
      console.log(`🎯 INDEX.HTML ENCONTRADO EM: ${foundIndexPath}`);
      const correctAngularPath = path.dirname(foundIndexPath);

      // Configurar com o caminho encontrado
      app.use(express.static(correctAngularPath));
      app.get('*', (req, res) => {
        res.sendFile(foundIndexPath);
      });
      console.log(`🚀 CONFIGURADO COM SUCESSO NO CAMINHO: ${correctAngularPath}`);

    } else {
      console.error('💥 index.html não encontrado em nenhum lugar!');

      // Rota de fallback
      app.get('*', (req, res) => {
        if (req.path === '/health') {
          return res.json({
            status: 'ERROR',
            message: 'Angular build structure issue',
            investigation: 'Found nested browser folders',
            timestamp: new Date().toISOString()
          });
        }

        res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Estrutura de Build Inesperada</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; }
              .info { background: #e3f2fd; padding: 20px; border-radius: 5px; }
            </style>
          </head>
          <body>
            <h1>🔍 Estrutura de Build Inesperada</h1>
            <div class="info">
              <p>O Angular gerou uma estrutura aninhada com múltiplas pastas "browser".</p>
              <p><strong>Caminho esperado:</strong> /app/dist/retro-scrum/browser/browser/</p>
              <p>Verifique a configuração do angular.json.</p>
            </div>
          </body>
          </html>
        `);
      });
    }
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
