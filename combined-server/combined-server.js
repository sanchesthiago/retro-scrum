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

  console.log('🔍 CONFIGURANDO ANGULAR (NOVO BUILD SYSTEM)...');

  // ✅ CAMINHO CORRETO para o novo Angular build system
  const angularPath = path.join(__dirname, '../dist/retro-scrum/browser');
  const indexPath = path.join(angularPath, 'index.html');

  console.log(`📁 Caminho do build: ${angularPath}`);
  console.log(`📁 Arquivo index: ${indexPath}`);

  // Verificar se existe
  if (fs.existsSync(indexPath)) {
    console.log('✅ INDEX.HTML ENCONTRADO! Iniciando servidor...');

    // Listar arquivos para confirmação
    try {
      const files = fs.readdirSync(angularPath);
      const totalFiles = files.length;
      const htmlFiles = files.filter(f => f.endsWith('.html'));
      const jsFiles = files.filter(f => f.endsWith('.js'));

      console.log(`📊 Estatísticas do build:`);
      console.log(`   📄 Total de arquivos: ${totalFiles}`);
      console.log(`   🏷️  Arquivos HTML: ${htmlFiles.length}`);
      console.log(`   ⚡ Arquivos JS: ${jsFiles.length}`);
      console.log(`   📦 Primeiros arquivos: ${files.slice(0, 8).join(', ')}...`);
    } catch (error) {
      console.log('⚠️  Erro ao listar arquivos:', error.message);
    }

    // ✅ Servir arquivos estáticos do Angular
    app.use(express.static(angularPath, {
      index: false, // Importante para SPA
      etag: true,
      lastModified: true,
      maxAge: '1h'
    }));

    // ✅ Rota para SPA - todas as rotas vão para index.html
    app.get('*', (req, res) => {
      console.log(`🌐 Servindo SPA para: ${req.path}`);
      res.sendFile(indexPath);
    });

    console.log('🚀 ANGULAR CONFIGURADO COM SUCESSO!');
    console.log(`📡 Servindo de: ${angularPath}`);

  } else {
    console.error('❌ ERRO: index.html não encontrado!');

    // Debug detalhado da estrutura
    console.log('🔍 INVESTIGANDO ESTRUTURA:');
    try {
      const checkPath = (checkPath, description) => {
        if (fs.existsSync(checkPath)) {
          const items = fs.readdirSync(checkPath);
          console.log(`✅ ${description}: ${checkPath}`);
          console.log(`   Conteúdo: [${items.join(', ')}]`);
          return true;
        } else {
          console.log(`❌ ${description}: ${checkPath} - NÃO EXISTE`);
          return false;
        }
      };

      // Verificar toda a hierarquia
      checkPath(path.join(__dirname, '..', 'dist'), '../dist');
      checkPath(path.join(__dirname, '..', 'dist', 'retro-scrum'), '../dist/retro-scrum');
      checkPath(path.join(__dirname, '..', 'dist', 'retro-scrum', 'browser'), '../dist/retro-scrum/browser');

      // Verificar se há index.html em outros lugares
      console.log('🔎 PROCURANDO INDEX.HTML EM OUTROS LOCAIS:');
      const searchPaths = [
        path.join(__dirname, '..', 'dist', 'retro-scrum'),
        path.join(__dirname, '..', 'dist'),
        path.join(__dirname, 'dist', 'retro-scrum', 'browser'),
        path.join(__dirname, 'dist', 'retro-scrum'),
        path.join(__dirname, 'dist')
      ];

      for (const searchPath of searchPaths) {
        const testIndexPath = path.join(searchPath, 'index.html');
        if (fs.existsSync(testIndexPath)) {
          console.log(`🎯 INDEX.HTML ENCONTRADO EM: ${searchPath}`);
        }
      }

    } catch (e) {
      console.log('💥 Erro na investigação:', e.message);
    }

    // Rota de fallback mais informativa
    app.get('*', (req, res) => {
      if (req.path === '/health') {
        return res.json({
          status: 'ERROR',
          message: 'Angular build not found',
          expectedPath: angularPath,
          structure: {
            currentDir: __dirname,
            angularPath: angularPath,
            indexPath: indexPath
          },
          timestamp: new Date().toISOString()
        });
      }

      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Erro - Build Angular</title>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              margin: 0;
              padding: 20px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              min-height: 100vh;
            }
            .container {
              max-width: 800px;
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
              margin: 20px 0;
            }
            .info {
              background: rgba(255,255,255,0.1);
              padding: 20px;
              border-radius: 8px;
              margin: 15px 0;
            }
            code {
              background: rgba(0,0,0,0.3);
              padding: 4px 8px;
              border-radius: 4px;
              font-family: 'Courier New', monospace;
            }
            h1 { margin-top: 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🚨 Angular Build Não Encontrado</h1>

            <div class="error">
              <h3>Problema Detectado</h3>
              <p>O servidor não encontrou o build do Angular no caminho esperado.</p>
              <p><strong>Caminho esperado:</strong> <code>${angularPath}</code></p>
            </div>

            <div class="info">
              <h3>📋 Informações Técnicas</h3>
              <ul>
                <li><strong>Diretório atual:</strong> <code>${__dirname}</code></li>
                <li><strong>Porta:</strong> ${PORT}</li>
                <li><strong>Ambiente:</strong> ${process.env.NODE_ENV}</li>
                <li><strong>Angular Builder:</strong> @angular/build:application</li>
              </ul>
            </div>

            <div class="info">
              <h3>🔧 Próximos Passos</h3>
              <ol>
                <li>Verifique se o build foi executado com sucesso</li>
                <li>Confirme que o build gerou a pasta <code>browser/</code></li>
                <li>Verifique os logs de build no Railway</li>
                <li>O caminho pode ser: <code>/app/dist/retro-scrum/browser/</code></li>
              </ol>
            </div>
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
