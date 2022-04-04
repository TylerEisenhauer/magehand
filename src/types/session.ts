export interface Session {
    cancelled: boolean
    channel: string
    date: Date
    guild: string
    location: string
    name: string
    participants: string[]
    reminderSent: boolean
}