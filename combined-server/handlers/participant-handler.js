class ParticipantHandler {
  constructor(sessions, broadcastToSession, generateId) {
    this.sessions = sessions;
    this.broadcastToSession = broadcastToSession;
    this.generateId = generateId;
  }

  handleMarkFinished(ws, message) {
    const session = this.sessions.get(message.sessionId);
    if (session) {
      const participant = session.participants.find(p => p.name === message.userName);
      if (participant) {
        participant.hasFinished = true;
        this.broadcastToSession(message.sessionId, {
          type: 'session-updated',
          session
        });
        console.log(`✅ "${message.userName}" finalizou`);
        this.checkIfAllFinished(session);
      }
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

module.exports = ParticipantHandler;
