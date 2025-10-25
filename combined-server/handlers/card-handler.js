class CardHandler {
  constructor(sessions, broadcastToSession, generateId) {
    this.sessions = sessions;
    this.broadcastToSession = broadcastToSession;
    this.generateId = generateId;
  }

  handleAddCard(ws, message) {
    const session = this.sessions.get(message.sessionId);
    if (session) {
      const newCard = {
        id: this.generateId(),
        content: message.content,
        column: message.column,
        votes: 0,
        createdAt: new Date(),
        createdBy: message.userName
      };

      session.cards.push(newCard);
      this.broadcastToSession(message.sessionId, {
        type: 'session-updated',
        session
      });
      console.log(`📝 Card adicionado por ${message.userName}: "${message.content.substring(0, 30)}..."`);
    }
  }

  handleVoteCard(ws, message) {
    const session = this.sessions.get(message.sessionId);
    if (session) {
      const card = session.cards.find(c => c.id === message.cardId);
      if (card) {
        card.votes++;
        this.broadcastToSession(message.sessionId, {
          type: 'session-updated',
          session
        });
        console.log(`👍 Voto no card: ${card.content.substring(0, 20)}...`);
      }
    }
  }

  handleDeleteCard(ws, message) {
    const session = this.sessions.get(message.sessionId);
    if (session) {
      session.cards = session.cards.filter(c => c.id !== message.cardId);
      this.broadcastToSession(message.sessionId, {
        type: 'session-updated',
        session
      });
      console.log(`🗑️ Card deletado: ${message.cardId}`);
    }
  }
}

module.exports = CardHandler;
