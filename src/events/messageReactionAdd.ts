import { MessageReaction, User } from 'discord.js'

export async function messageReactionAdd(reaction: MessageReaction, user: User) {
    if (reaction.partial) {
        try {
            await reaction.fetch()
        } catch (e) {
            console.error('Error fetching reaction')
            return
        }
    }

    switch (reaction.emoji.name) {
        case '✅':
            console.log('accept')
            break
        case '❌':
            console.log('deny')
            break
        default:
            return
    }
}