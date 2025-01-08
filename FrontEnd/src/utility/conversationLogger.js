// src/utility/conversationLogger.js

export class ConversationLogger {
    constructor(sessionId) {
      this.sessionId = sessionId;
      this.startTime = new Date().toISOString();
      this.conversationLog = [];
      this.messageCount = {
        user: 0,
        assistant: 0,
        total: 0
      };
    }
  
    addEntry(entry) {
      // Update message counts
      if (entry.type === 'user_message') {
        this.messageCount.user++;
      } else if (entry.type === 'api_response') {
        this.messageCount.assistant++;
      }
      this.messageCount.total++;
  
      const logEntry = {
        id: `${this.sessionId}_${this.conversationLog.length}`,
        timestamp: new Date().toISOString(),
        ...entry,
        metadata: {
          ...entry.metadata,
          messageNumber: this.messageCount.total
        }
      };
      
      this.conversationLog.push(logEntry);
    }
  
    getFormattedLog() {
      const endTime = new Date().toISOString();
      const duration = new Date(endTime) - new Date(this.startTime);
  
      return {
        sessionInfo: {
          sessionId: this.sessionId,
          startTime: this.startTime,
          endTime: endTime,
          durationInSeconds: Math.floor(duration / 1000),
          userInfo: this.extractUserInfo(this.sessionId)
        },
        statistics: {
          totalMessages: this.messageCount.total,
          userMessages: this.messageCount.user,
          assistantResponses: this.messageCount.assistant,
          averageResponseTime: this.calculateAverageResponseTime()
        },
        conversation: this.formatConversation(),
        metadata: {
          platform: navigator.platform,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        }
      };
    }
  
    extractUserInfo(sessionId) {
      // Extract user info from sessionId (assuming format: uuid+name+mobile)
      const parts = sessionId.split('+');
      return {
        id: parts[0],
        name: parts[1] || 'Unknown',
        mobile: parts[2] || 'Unknown'
      };
    }
  
    calculateAverageResponseTime() {
      let totalResponseTime = 0;
      let responseCount = 0;
  
      for (let i = 0; i < this.conversationLog.length - 1; i++) {
        if (this.conversationLog[i].type === 'user_message' &&
            this.conversationLog[i + 1].type === 'api_response') {
          const requestTime = new Date(this.conversationLog[i].timestamp);
          const responseTime = new Date(this.conversationLog[i + 1].timestamp);
          totalResponseTime += responseTime - requestTime;
          responseCount++;
        }
      }
  
      return responseCount > 0 ? 
        Math.floor(totalResponseTime / responseCount / 1000) : 0; // in seconds
    }
  
    formatConversation() {
      return this.conversationLog.map((entry, index) => ({
        messageNumber: index + 1,
        timestamp: entry.timestamp,
        type: entry.type,
        content: entry.content,
        metadata: {
          ...entry.metadata,
          timeSincePreviousMessage: index > 0 ? 
            (new Date(entry.timestamp) - new Date(this.conversationLog[index - 1].timestamp)) / 1000 : 0
        }
      }));
    }
  }