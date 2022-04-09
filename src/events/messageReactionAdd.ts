import { MessageEmbed, MessageReaction, TextChannel, User } from 'discord.js'
import { addParticipant, getSessionById } from '../api/magehand'

export default async function messageReactionAdd(reaction: MessageReaction, user: User) {
    if (user.bot) return
    if (reaction.partial) {
        try {
            await reaction.fetch()
        } catch (e) {
            console.error('Error fetching reaction')
            return
        }
    }

    try {
        switch (reaction.emoji.name) {
            case '✅':
                const session = await getSessionById(reaction.message.id)
                if (!session || session.cancelled) return
                const updatedSession = await addParticipant(reaction.message.id, user.id)
                if (updatedSession) {
                    const messageChannel = await reaction.client.channels.fetch(session.channel) as TextChannel
                    const message = await messageChannel.messages.fetch(session.messageId)
                    if (message.editable) {
                        const mentions: string = updatedSession.participants.reduce((x, y,) => {
                            return x + `<@${y}> `
                        }, '')
                        const embed: MessageEmbed = new MessageEmbed()
                            .setColor('#00FF00')
                            .setAuthor({
                                name: `${updatedSession.name}`
                            })
                            .setDescription(updatedSession.description)
                            .addFields(
                                { name: 'Players Signed Up', value: mentions ? mentions : 'No players signed up' },
                                { name: 'Location', value: updatedSession.location, inline: true },
                                { name: 'Time', value: `<t:${+new Date(updatedSession.date) / 1000}:f>`, inline: true }
                            )
                            .setFooter({ text: `Session id | ${updatedSession._id}` })
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
        console.log(e)
    }
}