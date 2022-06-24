import { MessageEmbed, MessageReaction, TextChannel, User } from 'discord.js'

import { getSessionById, removeParticipant } from '../api/magehand'
import { buildSessionEmbed } from '../helpers/embeds'
import { logger } from '../logger'

export default async function messageReactionRemove(reaction: MessageReaction, user: User) {
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
                const updatedSession = await removeParticipant(reaction.message.id, user.id)
                if (updatedSession) {
                    const messageChannel = await reaction.client.channels.fetch(session.channel) as TextChannel
                    const message = await messageChannel.messages.fetch(session.messageId)
                    if (message.editable) {
                        const embed: MessageEmbed = buildSessionEmbed(updatedSession)
                        
                        await message.edit({ embeds: [embed] })
                    }
                }
                await user.send(`You're no longer signed up for the session ${session.name}`)
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