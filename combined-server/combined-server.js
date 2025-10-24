const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);

// ✅ Configuração Railway
const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3000;

console.log(`🚀 Iniciando servidor...`);
console.log(`📍 Ambiente: ${isProduction ? 'Produção' : 'Desenvolvimento'}`);
console.log(`🎯 Porta: ${PORT}`);

if (isProduction) {
  // ✅ PRODUÇÃO: Servir arquivos do Angular
  const angularPath = path.join(__dirname, '../dist/retro-scrum');
  app.use(express.static(angularPath));

  app.get('*', (req, res) => {
    res.sendFile(path.join(angularPath, 'index.html'));
  });

  console.log('📁 Servindo arquivos do Angular (Produção)');
}

// ✅ Rota para health check (importante para Railway)
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
  // ✅ Configuração para produção
  perMessageDeflate: false
});

// ✅ Armazenamento em memória
const sessions = new Map();

wss.on('connection', (ws, request) => {
  // ✅ Em desenvolvimento, verificar origem se necessário
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
          // Verificar se usuário já existe
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

            // Verificar se todos finalizaram
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
  console.log(`🎯 Porta: ${PORT}`);

  if (isProduction) {
    console.log(`🌐 URL: https://seu-app.railway.app`);
  } else {
    console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
    console.log(`📁 Angular Dev: http://localhost:4200`);
    console.log(`📁 Angular Build: http://localhost:${PORT}`);
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
