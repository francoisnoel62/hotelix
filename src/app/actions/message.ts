'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { MessageWithDetails, ConversationItem, ChatMessage } from '@/lib/types/message'

interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export async function sendMessage(
  expediteurId: number,
  destinataireId: number,
  contenu: string
): Promise<ActionResult> {
  try {
    if (!contenu.trim()) {
      return { success: false, error: 'Le message ne peut pas être vide' }
    }

    // Vérifier que l'expéditeur existe
    const expediteur = await prisma.user.findUnique({ where: { id: expediteurId } })
    if (!expediteur) {
      return { success: false, error: 'Utilisateur expéditeur non trouvé' }
    }

    // Vérifier que le destinataire existe et est dans le même hôtel
    const destinataire = await prisma.user.findUnique({ where: { id: destinataireId } })
    if (!destinataire) {
      return { success: false, error: 'Utilisateur destinataire non trouvé' }
    }

    if (expediteur.hotelId !== destinataire.hotelId) {
      return { success: false, error: 'Impossible d\'envoyer un message à un utilisateur d\'un autre hôtel' }
    }

    // Créer le message
    const message = await prisma.message.create({
      data: {
        contenu: contenu.trim(),
        expediteurId,
        destinataireId,
        hotelId: expediteur.hotelId
      },
      include: {
        expediteur: {
          select: { id: true, name: true, email: true, role: true }
        },
        destinataire: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    })

    revalidatePath('/dashboard/techniciens')

    return {
      success: true,
      data: message,
      message: 'Message envoyé avec succès'
    }
  } catch (error) {
    console.error('Erreur envoi message:', error)
    return {
      success: false,
      error: 'Erreur lors de l\'envoi du message'
    }
  }
}

export async function getConversation(
  user1Id: number,
  user2Id: number
): Promise<ChatMessage[]> {
  try {
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { expediteurId: user1Id, destinataireId: user2Id },
          { expediteurId: user2Id, destinataireId: user1Id }
        ]
      },
      include: {
        expediteur: {
          select: { name: true }
        }
      },
      orderBy: {
        dateEnvoi: 'asc'
      }
    })

    return messages.map(message => ({
      id: message.id,
      contenu: message.contenu,
      dateEnvoi: message.dateEnvoi,
      lu: message.lu,
      direction: message.expediteurId === user1Id ? 'sent' : 'received',
      expediteurName: message.expediteur.name
    }))
  } catch (error) {
    console.error('Erreur récupération conversation:', error)
    return []
  }
}

export async function getConversations(userId: number): Promise<ConversationItem[]> {
  try {
    // Récupérer tous les utilisateurs avec qui l'utilisateur a échangé des messages
    const conversations = await prisma.$queryRaw<{
      participant_id: number
      participant_name: string | null
      participant_email: string
      participant_role: string
      dernier_message: string
      date_dernier_message: Date
      messages_non_lus: bigint
    }[]>`
      SELECT DISTINCT
        CASE
          WHEN m.expediteur_id = ${userId} THEN m.destinataire_id
          ELSE m.expediteur_id
        END as participant_id,
        u.name as participant_name,
        u.email as participant_email,
        u.role as participant_role,
        (
          SELECT contenu
          FROM "Message" m2
          WHERE (
            (m2.expediteur_id = ${userId} AND m2.destinataire_id = CASE WHEN m.expediteur_id = ${userId} THEN m.destinataire_id ELSE m.expediteur_id END)
            OR
            (m2.destinataire_id = ${userId} AND m2.expediteur_id = CASE WHEN m.expediteur_id = ${userId} THEN m.destinataire_id ELSE m.expediteur_id END)
          )
          ORDER BY m2.date_envoi DESC
          LIMIT 1
        ) as dernier_message,
        (
          SELECT date_envoi
          FROM "Message" m3
          WHERE (
            (m3.expediteur_id = ${userId} AND m3.destinataire_id = CASE WHEN m.expediteur_id = ${userId} THEN m.destinataire_id ELSE m.expediteur_id END)
            OR
            (m3.destinataire_id = ${userId} AND m3.expediteur_id = CASE WHEN m.expediteur_id = ${userId} THEN m.destinataire_id ELSE m.expediteur_id END)
          )
          ORDER BY m3.date_envoi DESC
          LIMIT 1
        ) as date_dernier_message,
        (
          SELECT COUNT(*)
          FROM "Message" m4
          WHERE m4.expediteur_id = CASE WHEN m.expediteur_id = ${userId} THEN m.destinataire_id ELSE m.expediteur_id END
          AND m4.destinataire_id = ${userId}
          AND m4.lu = false
        ) as messages_non_lus
      FROM "Message" m
      JOIN "User" u ON u.id = CASE WHEN m.expediteur_id = ${userId} THEN m.destinataire_id ELSE m.expediteur_id END
      WHERE m.expediteur_id = ${userId} OR m.destinataire_id = ${userId}
      ORDER BY date_dernier_message DESC
    `

    return conversations.map(conv => ({
      participantId: conv.participant_id,
      participantName: conv.participant_name,
      participantEmail: conv.participant_email,
      participantRole: conv.participant_role,
      dernierMessage: conv.dernier_message || '',
      dateDernierMessage: conv.date_dernier_message,
      messagesNonLus: Number(conv.messages_non_lus)
    }))
  } catch (error) {
    console.error('Erreur récupération conversations:', error)
    return []
  }
}

export async function markMessageAsRead(messageId: number): Promise<ActionResult> {
  try {
    await prisma.message.update({
      where: { id: messageId },
      data: { lu: true }
    })

    return { success: true }
  } catch (error) {
    console.error('Erreur marquage message lu:', error)
    return {
      success: false,
      error: 'Erreur lors du marquage du message'
    }
  }
}

export async function markConversationAsRead(
  userId: number,
  otherUserId: number
): Promise<ActionResult> {
  try {
    await prisma.message.updateMany({
      where: {
        expediteurId: otherUserId,
        destinataireId: userId,
        lu: false
      },
      data: { lu: true }
    })

    revalidatePath('/dashboard/techniciens')

    return { success: true }
  } catch (error) {
    console.error('Erreur marquage conversation lue:', error)
    return {
      success: false,
      error: 'Erreur lors du marquage de la conversation'
    }
  }
}