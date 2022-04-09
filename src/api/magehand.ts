import axios, { AxiosInstance } from 'axios'

import { Session, Settings } from '../types'

let apiClient: AxiosInstance

async function getAuthToken(): Promise<string> {
    try {
        const { data } = await axios.post<{ access_token: string }>(`${process.env.MAGEHAND_API_URL}/login`, {
            username: process.env.MAGEHAND_API_USER,
            password: process.env.MAGEHAND_API_PASSWORD
        })

        return `Bearer ${data.access_token}`
    } catch (e) {
        console.log(e)
    }
    return null
}

export async function initializeMageHandClient(): Promise<void> {
    apiClient = axios.create({
        baseURL: process.env.MAGEHAND_API_URL,
        headers: {
            Authorization: await getAuthToken()
        },
        timeout: 5000
    })
}

export async function getSettings(guildId: string): Promise<Settings> {
    try {
        const { data } = await apiClient.get<Settings>(`/settings/${guildId}`)
        return data
    } catch (e) {
        if (e.response.status === 404) {
            return null
        }
        throw e
    }
}

export async function getSessionById(id: string): Promise<Session> {
    try {
        const { data } = await apiClient.get<Session>(`/session/${id}`)
        return data
    } catch (e) {
        if (e.response.status === 404) {
            return null
        }
        throw e
    }
}

export async function createSession(session: Session): Promise<Session> {
    try {
        const { data } = await apiClient.post<Session>(`/session`, { ...session })
        return data
    } catch (e) {
        throw e
    }
}

export async function updateSession(session: Partial<Session>): Promise<Session> {
    try {
        const { data } = await apiClient.patch<Session>(`/session/${session._id}`, { ...session })
        return data
    } catch (e) {
        if (e.response.status === 404) {
            return null
        }
        throw e
    }
}

export async function addParticipant(messageId: string, participantId: string): Promise<Session> {
    try {
        const { data } = await apiClient.post<Session>(`/session/${messageId}`, {
            participantId
        })
        return data
    } catch (e) {
        if (e.response.status === 404) {
            return null
        }
        throw e
    }
}

export async function removeParticipant(messageId: string, participantId: string): Promise<Session> {
    try {
        const { data } = await apiClient.delete<Session>(`/session/${messageId}/${participantId}`)
        return data
    } catch (e) {
        if (e.response.status === 404) {
            return null
        }
        throw e
    }
}