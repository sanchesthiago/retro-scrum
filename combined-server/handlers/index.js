const SessionHandler = require('./session-handler');
const CardHandler = require('./card-handler');
const ParticipantHandler = require('./participant-handler');

class Handlers {
  constructor(sessions, broadcastToSession, generateId) {
    this.sessionHandler = new SessionHandler(sessions, broadcastToSession, generateId);
    this.cardHandler = new CardHandler(sessions, broadcastToSession, generateId);
    this.participantHandler = new ParticipantHandler(sessions, broadcastToSession, generateId);
  }

  getHandlers() {
    return {
      // Session handlers
      'create-session': this.sessionHandler.handleCreateSession.bind(this.sessionHandler),
      'join-session': this.sessionHandler.handleJoinSession.bind(this.sessionHandler),
      'reveal-cards': this.sessionHandler.handleRevealCards.bind(this.sessionHandler),

      // Card handlers
      'add-card': this.cardHandler.handleAddCard.bind(this.cardHandler),
      'vote-card': this.cardHandler.handleVoteCard.bind(this.cardHandler),
      'delete-card': this.cardHandler.handleDeleteCard.bind(this.cardHandler),

      // Participant handlers
      'mark-finished': this.participantHandler.handleMarkFinished.bind(this.participantHandler)
    };
  }
}

module.exports = Handlers;
