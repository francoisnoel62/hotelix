export interface MessageWithDetails {
  id: number
  contenu: string
  dateEnvoi: Date
  lu: boolean
  expediteur: {
    id: number
    name: string | null
    email: string
    role: string
  }
  destinataire: {
    id: number
    name: string | null
    email: string
    role: string
  }
}

export interface ConversationItem {
  participantId: number
  participantName: string | null
  participantEmail: string
  participantRole: string
  dernierMessage: string
  dateDernierMessage: Date
  messagesNonLus: number
}

export interface MessageFormData {
  contenu: string
  destinataireId: number
}

export interface ConversationFilter {
  search: string
  nonLus: boolean
}

export type MessageDirection = 'sent' | 'received'

export interface ChatMessage {
  id: number
  contenu: string
  dateEnvoi: Date
  lu: boolean
  direction: MessageDirection
  expediteurName: string | null
}