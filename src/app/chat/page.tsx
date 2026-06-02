'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { TypingIndicator } from '@/components/ui/typing-indicator';
import { 
  Send, 
  Brain, 
  LogOut, 
  Plus, 
  MessageSquare,
  Loader2,
  User,
  Bot,
  Upload
} from 'lucide-react';
import type { Message, Session, ChatResponse } from '@/types';

export default function ChatPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout, _hasHydrated } = useAuthStore();
  const { 
    currentSession, 
    sessions,
    isLoading,
    setCurrentSession, 
    setSessions,
    addMessage,
    setLoading,
    setError
  } = useChatStore();

  const [query, setQuery] = useState('');
  const [streamingMessage, setStreamingMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Wait for hydration before checking auth
  useEffect(() => {
    if (!_hasHydrated) return; // Wait for store to hydrate
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Load sessions
    loadSessions();
  }, [isAuthenticated, _hasHydrated, router]);

  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages, isLoading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSessions = async () => {
    if (!user) return;
    
    try {
      const response = await api.getSessions();
      const userSessions = response.sessions || [];
      setSessions(userSessions);
      
      // Auto-load first session with messages
      if (!currentSession && userSessions.length > 0) {
        const sessionsWithMessages = userSessions.filter((s: Session) => s.messageCount && s.messageCount > 0);
        if (sessionsWithMessages.length > 0) {
          // Load full session details with messages
          await loadSessionDetails(sessionsWithMessages[0].sessionId);
        }
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  const loadSessionDetails = async (sessionId: string) => {
    try {
      const fullSession = await api.getSession(sessionId);
      setCurrentSession(fullSession);
    } catch (error) {
      console.error('Failed to load session details:', error);
    }
  };

const createNewSession = () => {
    // Don't create session until first message is sent
    setCurrentSession(null);
    setError(null);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading || !user) return;

    const userQuery = query;
    setQuery('');

    // Add user message IMMEDIATELY so it shows up right away
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userQuery,
      timestamp: new Date().toISOString(),
    };

    // If no session exists yet, create a temporary one for UI
    if (!currentSession) {
      const tempSession: Session = {
        sessionId: `temp_${Date.now()}`, // Will be replaced with real ID
        userId: user._id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messageCount: 1,
        totalTokens: 0,
        model: 'gpt-4o-mini',
        status: 'active',
        messages: [userMessage],
      };
      setCurrentSession(tempSession);
    } else {
      addMessage(userMessage);
    }

    // Now start loading and make API call
    setLoading(true);

    try {
      const sessionId = currentSession?.sessionId.startsWith('temp_') ? undefined : currentSession?.sessionId;
      const response = await api.sendQuery(sessionId, userQuery, false);
      
      // If this was a new session, update with real session ID
      if (!currentSession || currentSession.sessionId.startsWith('temp_')) {
        const newSession: Session = {
          sessionId: response.sessionId,
          userId: user._id,
          createdAt: response.timestamp,
          updatedAt: response.timestamp,
          messageCount: 2,
          totalTokens: response.tokens.total,
          model: 'gpt-4o-mini',
          status: 'active',
          messages: [userMessage], // Keep the user message we already added
        };
        setCurrentSession(newSession);
        setSessions([newSession, ...sessions]);
      }
      
      // Add assistant message with the actual response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        timestamp: response.timestamp,
      };
      addMessage(assistantMessage);

      // Poll for AI-generated title for new sessions
      // Title generation takes 5-8 seconds, poll every 2s for up to 20s
      let pollCount = 0;
      const maxPolls = 10; // 10 polls × 2s = 20s max
      
      const pollForTitle = async () => {
        pollCount++;
        
        try {
          const updatedSessions = await api.getSessions();
          const updatedSession = updatedSessions.sessions.find(
            (s: Session) => s.sessionId === response.sessionId
          );
          
          if (updatedSession?.title) {
            // Title found! Update sessions list
            setSessions(sessions.map((s: Session) => 
              s.sessionId === response.sessionId 
                ? { ...s, title: updatedSession.title }
                : s
            ));
            // Stop polling
            return;
          }
        } catch (error) {
          console.error('Failed to poll for title:', error);
        }
        
        // Continue polling if we haven't found the title and haven't exceeded max polls
        if (pollCount < maxPolls) {
          setTimeout(pollForTitle, 2000);
        }
      };
      
      // Start polling after 2 seconds (give backend time to start title generation)
      setTimeout(pollForTitle, 2000);
    } catch (error: any) {
      console.error('Failed to send message:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error.response?.data?.error || 'Failed to get response'}`,
        timestamp: new Date().toISOString(),
      };
      
      addMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Show loading during hydration
  if (!_hasHydrated) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="p-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Brain className="h-8 w-8 text-white animate-pulse" />
          </div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="h-screen flex bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900/50 backdrop-blur border-r border-slate-800 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-white">Peregrine AI</span>
          </div>
          
          <Button 
            onClick={createNewSession}
            className="w-full bg-purple-500 hover:bg-purple-600 mb-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
          
          <Button 
            onClick={() => router.push('/documents')}
            variant="outline"
            className="w-full border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Documents
          </Button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-2">
          {sessions.filter(s => s.messageCount && s.messageCount > 0).length === 0 ? (
            <div className="text-center text-slate-400 text-sm mt-4 px-2">
              No conversations yet.<br />Start a new chat!
            </div>
          ) : (
            sessions
              .filter(s => s.messageCount && s.messageCount > 0)
              .map((session) => (
                <button
                  key={session.sessionId}
                  onClick={() => loadSessionDetails(session.sessionId)}
                  className={`w-full p-3 mb-2 rounded-lg text-left transition-colors ${
                    currentSession?.sessionId === session.sessionId
                      ? 'bg-purple-500/20 border border-purple-500/50'
                      : 'bg-slate-800/50 hover:bg-slate-800 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-purple-400" />
                    <span className="text-sm text-white truncate">
                      {session.title || `${session.messageCount || 0} messages`}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {new Date(session.updatedAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </button>
              ))
          )}
        </div>

        {/* User Info */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="text-sm">
                <div className="text-white font-medium">{user.username}</div>
                <div className="text-slate-400 text-xs capitalize">{user.role}</div>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleLogout}
              className="text-slate-400 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6">
          {!currentSession || !currentSession.messages || currentSession.messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="p-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Welcome to Peregrine AI
                </h2>
                <p className="text-slate-400 max-w-md">
                  Your intelligent assistant for business insights, financial analysis, and data-driven decisions.
                </p>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-6">
              {currentSession.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-4 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <Bot className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  )}
                  
                  <Card className={`max-w-2xl ${
                    message.role === 'user'
                      ? 'bg-purple-500/20 border-purple-500/50'
                      : 'bg-slate-800/50 border-slate-700'
                  }`}>
                    <div className="p-4">
                      <div className="text-white whitespace-pre-wrap">
                        {message.content}
                      </div>
                      
                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-700">
                          <div className="text-xs text-slate-400">
                            Sources: {message.sources.length} references
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>

                  {message.role === 'user' && (
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center animate-pulse">
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <Card className="max-w-2xl bg-slate-800/50 border-slate-700">
                    <TypingIndicator />
                  </Card>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-slate-800 bg-slate-900/50 backdrop-blur p-4">
          <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
            <div className="flex gap-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask me anything about your business..."
                disabled={isLoading}
                className="flex-1 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
              <Button 
                type="submit" 
                disabled={isLoading || !query.trim()}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
