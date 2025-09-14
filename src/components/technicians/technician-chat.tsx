'use client'

import { useState, useEffect, useRef } from 'react'
import { UserSession } from '@/lib/types/auth'
import { TechnicianWithDetails } from '@/lib/types/technician'
import { ChatMessage } from '@/lib/types/message'
import { getConversation, sendMessage, markConversationAsRead } from '@/app/actions/message'
import { useToast } from '@/components/ui/toast'

interface TechnicianChatProps {
  currentUser: UserSession
  technician: TechnicianWithDetails
}

export function TechnicianChat({ currentUser, technician }: TechnicianChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    const loadConversation = async () => {
      setIsLoading(true)
      const conversationData = await getConversation(currentUser.id, technician.id)
      setMessages(conversationData)

      // Marquer la conversation comme lue
      await markConversationAsRead(currentUser.id, technician.id)

      setIsLoading(false)
    }

    loadConversation()
  }, [currentUser.id, technician.id])

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim() || isSending) return

    setIsSending(true)

    try {
      const result = await sendMessage(currentUser.id, technician.id, newMessage.trim())

      if (result.success) {
        // Ajouter le message à la liste localement pour un feedback immédiat
        const tempMessage: ChatMessage = {
          id: Date.now(), // ID temporaire
          contenu: newMessage.trim(),
          dateEnvoi: new Date(),
          lu: false,
          direction: 'sent',
          expediteurName: currentUser.name
        }

        setMessages(prev => [...prev, tempMessage])
        setNewMessage('')

        // Recharger la conversation pour avoir les vrais IDs
        const conversationData = await getConversation(currentUser.id, technician.id)
        setMessages(conversationData)
      } else {
        toast({
          variant: 'error',
          title: 'Erreur',
          description: result.error || 'Erreur lors de l\'envoi du message'
        })
      }
    } catch (error) {
      console.error('Erreur envoi message:', error)
      toast({
        variant: 'error',
        title: 'Erreur',
        description: 'Erreur lors de l\'envoi du message'
      })
    } finally {
      setIsSending(false)
    }
  }

  const formatMessageTime = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  const formatMessageDate = (date: Date) => {
    const today = new Date()
    const messageDate = new Date(date)

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Aujourd\'hui'
    }

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Hier'
    }

    return messageDate.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  // Grouper les messages par date
  const groupedMessages = messages.reduce((groups, message) => {
    const dateKey = new Date(message.dateEnvoi).toDateString()
    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(message)
    return groups
  }, {} as { [key: string]: ChatMessage[] })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-96 bg-white border rounded-lg">
      {/* Header de la conversation */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
            <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">
              {technician.name || technician.email}
            </h3>
            <p className="text-sm text-gray-500">{technician.specialite || 'Technicien'}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Messagerie
        </div>
      </div>

      {/* Zone des messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Object.keys(groupedMessages).length === 0 ? (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun message</h3>
            <p className="mt-1 text-sm text-gray-500">Commencez la conversation avec ce technicien.</p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([dateKey, dayMessages]) => (
            <div key={dateKey}>
              {/* Séparateur de date */}
              <div className="flex items-center justify-center mb-4">
                <div className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-500">
                  {formatMessageDate(new Date(dateKey))}
                </div>
              </div>

              {/* Messages du jour */}
              {dayMessages.map((message, index) => (
                <div
                  key={message.id}
                  className={`flex mb-4 ${message.direction === 'sent' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                    message.direction === 'sent'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <p className="text-sm">{message.contenu}</p>
                    <div className={`flex items-center justify-end gap-1 mt-1 text-xs ${
                      message.direction === 'sent' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      <span>{formatMessageTime(message.dateEnvoi)}</span>
                      {message.direction === 'sent' && (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          {message.lu ? (
                            // Double check (lu)
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          ) : (
                            // Simple check (envoyé)
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          )}
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Zone de saisie */}
      <form onSubmit={handleSendMessage} className="p-4 border-t bg-gray-50 rounded-b-lg">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Tapez votre message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            disabled={isSending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <div className="animate-spin h-4 w-4 border border-white border-t-transparent rounded-full"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}