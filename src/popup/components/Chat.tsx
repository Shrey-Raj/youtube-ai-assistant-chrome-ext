import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { chatWithVideo } from '../../utils/api';

interface ChatProps {
  videoId: string;
  videoTitle: string;
  transcript: string | null;
}

interface Message {
  role: string;
  content: string;
}

const Chat: React.FC<ChatProps> = ({ videoId, videoTitle, transcript }) => {
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: message };
    const updatedConversation = [...conversation, userMessage];
    
    setConversation(updatedConversation);
    setMessage('');
    setIsLoading(true);

    try {
      const aiResponse = await chatWithVideo(
        videoId,
        videoTitle,
        transcript,
        updatedConversation
      );
      
      setConversation(prev => [...prev, { role: 'model', content: aiResponse }]);
    } catch (error) {
      console.error('Chat error:', error);
      setConversation(prev => [...prev, { 
        role: 'model', 
        content: "I'm having trouble answering that. Please try again." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex-1 bg-dark-800/30 backdrop-blur-sm border border-white/10 rounded-xl flex flex-col overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white">AI Chat</h3>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto scrollbar-thin space-y-4">
          {conversation.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-r from-primary-500/20 to-primary-700/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-400\" fill="none\" stroke="currentColor\" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-gray-400 text-sm">Ask me anything about this video!</p>
              <div className="mt-4 space-y-2">
                <button
                  onClick={() => setMessage("What are the main points discussed in this video?")}
                  className="block w-full text-left px-3 py-2 text-sm text-gray-300 bg-white/5 hover:bg-white/10 rounded-lg transition-colors duration-200"
                >
                  What are the main points discussed?
                </button>
                <button
                  onClick={() => setMessage("Can you explain the key concepts mentioned?")}
                  className="block w-full text-left px-3 py-2 text-sm text-gray-300 bg-white/5 hover:bg-white/10 rounded-lg transition-colors duration-200"
                >
                  Explain the key concepts
                </button>
              </div>
            </div>
          )}

          {conversation.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
            >
              <div
                className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-500/25'
                    : 'bg-dark-700/50 text-gray-200 border border-white/10'
                } ${msg.role === 'user' ? 'rounded-br-md' : 'rounded-bl-md'}`}
              >
                <div className="text-sm leading-relaxed prose prose-invert max-w-none">
                  <ReactMarkdown
                    components={{
                      strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
                      li: ({ children }) => <li className="ml-4 list-disc text-gray-300">{children}</li>,
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>

                </div>

              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start animate-slide-up">
              <div className="bg-dark-700/50 border border-white/10 px-4 py-3 rounded-2xl rounded-bl-md">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-gray-400">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <div className="p-4 border-t border-white/10">
          <form onSubmit={handleSubmit} className="flex space-x-3">
            <div className="flex-1 relative">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                placeholder="Ask about this video..."
                rows={1}
                className="w-full px-4 py-3 bg-dark-700/50 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ minHeight: '48px', maxHeight: '120px' }}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !message.trim()}
              className="px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-xl font-medium transition-all duration-200 disabled:cursor-not-allowed shadow-lg shadow-primary-500/25 disabled:shadow-none"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;