import { useState } from 'react'
import { api } from '../lib/api'
import type { User } from '../types'

const USER_ID_KEY = 'project_evaluator_user_id'
const NICKNAME_KEY = 'project_evaluator_nickname'

export function useUser() {
  const [userId, setUserId] = useState<string | null>(
    localStorage.getItem(USER_ID_KEY) || localStorage.getItem('cyberarena_user_id')
  )
  const [nickname, setNickname] = useState<string | null>(
    localStorage.getItem(NICKNAME_KEY) || localStorage.getItem('cyberarena_nickname')
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const claimNickname = async (nick: string, password?: string) => {
    setLoading(true)
    setError(null)
    try {
      const user = await api.claimNickname(nick, password) as User
      localStorage.setItem(USER_ID_KEY, user.id)
      localStorage.setItem(NICKNAME_KEY, user.nickname)
      setUserId(user.id)
      setNickname(user.nickname)
      return user
    } catch (e: any) {
      setError(e.message)
      throw e
    } finally {
      setLoading(false)
    }
  }
  
  const isAdmin = () => {
    // Simple client-side check; real enforcement is server-side
    const adminNicknames = ['ADMIN', 'JUDGE', 'ROOT']
    return nickname ? adminNicknames.includes(nickname.toUpperCase()) : false
  }
  
  return { userId, nickname, loading, error, claimNickname, isAdmin }
}
