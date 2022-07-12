import { MessageEmbed, MessageReaction, TextChannel, User } from 'discord.js'

import { addParticipant, getSessionById } from '../api/magehand'
import { buildSessionEmbed } from '../helpers/embeds'
import { logger } from '../logger'

export default async function messageReactionAdd(reaction: MessageReaction, user: User) {
    if (user.bot) return
    if (reaction.partial) {
        try {
            await reaction.fetch()
        } catch (e) {
            logger.error('Error fetching reaction')
            return
        }
    }

    try {
        switch (reaction.emoji.name) {
            case '✅':
                const session = await getSessionById(reaction.message.id)
                if (!session || session.cancelled) return

                if (session.participants.includes(user.id)) return

                const updatedSession = await addParticipant(reaction.message.id, user.id)
                if (updatedSession) {
                    const messageChannel = await reaction.client.channels.fetch(session.channel) as TextChannel
                    const message = await messageChannel.messages.fetch(session.messageId)
                    if (message.editable) {
                        const embed: MessageEmbed = buildSessionEmbed(updatedSession)
                        
                        await message.edit({ embeds: [embed] })
                    }
                }
                await user.send(`You're signed up for the session ${updatedSession.name}`)
                break
            case '❌':
                break
            default:
                return
        }
    } catch (e) {
        logger.error(e)
    }
}