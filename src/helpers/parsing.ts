const quotePattern = /[^\s"']+|"([^"]*)"|'([^']*)'/g

export function parseArgs(prefix: string, messageContent: string): string[] {
    return messageContent.slice(prefix.length).trim().match(quotePattern).map((arg) => {
        return arg.replace(/['"]/g, '')
    })
}