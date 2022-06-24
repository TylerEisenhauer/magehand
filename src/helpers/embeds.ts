import { MessageEmbed } from "discord.js";
import { Session } from "../types";

const buildSessionEmbed = (session: Session): MessageEmbed => {
    const mentions: string = session.participants.reduce((x, y,) => {
        return x + `<@${y}> `
    }, '')

    const embed: MessageEmbed = new MessageEmbed()
        .setColor('#00FF00')
        .setAuthor({
            name: `${session.name}`
        })
        .setDescription(session.description)
        .addFields(
            { name: 'Players Signed Up', value: mentions ? mentions : 'No players signed up' },
            { name: 'Location', value: session.location, inline: true },
            { name: 'Time', value: `<t:${+new Date(session.date) / 1000}:f>`, inline: true }
        )
        .setFooter({ text: `Session id | ${session._id}` })

    return embed
}

export {
    buildSessionEmbed
}