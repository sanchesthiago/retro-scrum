class SessionHandler {
  constructor(sessions, broadcastToSession, generateId) {
    this.sessions = sessions;
    this.broadcastToSession = broadcastToSession;
    this.generateId = generateId;
  }

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

  handleRevealCards(ws, message) {
    const session = this.sessions.get(message.sessionId);
    if (session) {
      session.isRevealed = true;
      this.broadcastToSession(message.sessionId, {
        type: 'session-updated',
        session
      });
      console.log(`🎉 Cards revelados na sessão "${session.name}"`);
    }
  }

  checkIfAllFinished(session) {
    const allFinished = session.participants.every(p => p.hasFinished);
    if (allFinished && !session.isRevealed) {
      console.log(`🎊 Todos finalizaram na sessão "${session.name}"! Revelando cards...`);
      setTimeout(() => {
        session.isRevealed = true;
        this.broadcastToSession(session.id, {
          type: 'session-updated',
          session
        });
      }, 2000);
    }
  }
}

module.exports = SessionHandler;
