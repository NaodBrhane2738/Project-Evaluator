import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, AlertCircle, ArrowRight, User, Lock, KeyRound, Eye, EyeOff, X } from 'lucide-react'
import { useUser } from '../hooks/useUser'
import { api } from '../lib/api'
import { Button } from '../components/ui/Button'

interface AccountCheckResult {
  exists: boolean
  hasPassword: boolean
  nickname: string
}

export function Onboarding() {
  const { claimNickname, loading } = useUser()
  const navigate = useNavigate()
  const [handle, setHandle] = useState('')
  const [password, setPassword] = useState('')
  const [showPasswordText, setShowPasswordText] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  // Popup modal state
  const [showModal, setShowModal] = useState(false)
  const [accountInfo, setAccountInfo] = useState<AccountCheckResult | null>(null)
  const [modalError, setModalError] = useState<string | null>(null)
  const [isSubmittingModal, setIsSubmittingModal] = useState(false)

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = handle.trim()
    if (!trimmed) return
    setError(null)
    setModalError(null)
    setPassword('')
    setIsChecking(true)

    try {
      const check = await api.checkNickname(trimmed)
      setAccountInfo({
        exists: check.exists,
        hasPassword: check.has_password,
        nickname: check.nickname || trimmed,
      })
      setShowModal(true)
    } catch (err: any) {
      setError(err.message || 'Failed to verify nickname. Please try again.')
    } finally {
      setIsChecking(false)
    }
  }

  const handleModalAuth = async (usePassword: boolean) => {
    if (!accountInfo) return
    if (accountInfo.hasPassword && (!password || !password.trim())) {
      setModalError('Please enter your account password.')
      return
    }
    setModalError(null)
    setIsSubmittingModal(true)

    try {
      const pwToSend = usePassword ? password.trim() || undefined : undefined
      await claimNickname(accountInfo.nickname, pwToSend)
      setShowModal(false)
      navigate('/', { replace: true })
    } catch (err: any) {
      setModalError(err.message || 'Authentication failed. Please check your credentials.')
    } finally {
      setIsSubmittingModal(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: '#050505',
      }}
    >
      {/* Main Nickname Entry Card */}
      <div
        className="glass-card anim-fade-up"
        style={{
          width: '100%',
          maxWidth: 420,
          padding: 36,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              margin: '0 auto 12px',
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(255,255,255,0.15)',
            }}
          >
            <Shield size={24} color="#000000" strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#ffffff', letterSpacing: '-0.02em' }}>
            Project Evaluator
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', margin: '4px 0 0' }}>
            5-Week Cybersecurity Competition
          </p>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginBottom: 24 }}>
          Enter your competition nickname to log in or create a new profile.
        </p>

        <form onSubmit={handleInitialSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 5 }}>
              Nickname
            </label>
            <div style={{ position: 'relative' }}>
              <User
                size={15}
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'rgba(255,255,255,0.3)',
                }}
              />
              <input
                type="text"
                className="input"
                style={{ paddingLeft: 36, textTransform: 'uppercase' }}
                placeholder="ENTER NICKNAME..."
                value={handle}
                onChange={e => setHandle(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                required
                minLength={3}
                maxLength={20}
              />
            </div>
          </div>

          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: 'rgba(248,113,113,0.9)',
                fontSize: '0.8rem',
                background: 'rgba(248,113,113,0.08)',
                border: '1px solid rgba(248,113,113,0.25)',
                borderRadius: 8,
                padding: '10px 12px',
              }}
            >
              <AlertCircle size={14} style={{ flexShrink: 0 }} /> {error}
            </div>
          )}

          <Button type="submit" variant="primary" fullWidth loading={isChecking || loading} style={{ marginTop: 6 }}>
            {isChecking ? 'Checking…' : 'Enter / Log In'} <ArrowRight size={15} style={{ marginLeft: 6 }} />
          </Button>
        </form>
      </div>

      {/* Password Authentication Popup Modal (Optional) */}
      {showModal && accountInfo && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20,
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="glass-card anim-scale-in"
            style={{
              width: '100%',
              maxWidth: 420,
              padding: 30,
              boxShadow: '0 24px 60px rgba(0,0,0,0.95), 0 0 0 1px rgba(255,255,255,0.15)',
              background: '#121212',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: accountInfo.exists ? 'rgba(74,222,128,0.12)' : 'rgba(129,140,248,0.12)',
                    border: `1px solid ${accountInfo.exists ? 'rgba(74,222,128,0.25)' : 'rgba(129,140,248,0.25)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {accountInfo.exists ? (
                    <KeyRound size={20} color="#34d399" />
                  ) : (
                    <Lock size={20} color="#818cf8" />
                  )}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
                    {accountInfo.exists ? `Welcome Back!` : `Create Profile`}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 600 }}>
                    {accountInfo.nickname}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Description note */}
            <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, margin: '0 0 18px 0' }}>
              {accountInfo.exists ? (
                accountInfo.hasPassword ? (
                  <span>This account is protected by a password. Please enter your password to sign in.</span>
                ) : (
                  <span>This handle is registered without a password. You can enter a password to attach one, or proceed without a password.</span>
                )
              ) : (
                <span>You can optionally set a password now to secure your new handle, or proceed without a password <strong>(Completely optional)</strong>.</span>
              )}
            </p>

            {/* Password Input Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 5 }}>
                  {accountInfo.hasPassword ? 'Account Password (Required)' : 'Password (Optional)'}
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock
                    size={14}
                    style={{
                      position: 'absolute',
                      left: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'rgba(255,255,255,0.3)',
                    }}
                  />
                  <input
                    type={showPasswordText ? 'text' : 'password'}
                    className="input"
                    style={{ paddingLeft: 36, paddingRight: 36 }}
                    placeholder={accountInfo.hasPassword ? 'Enter your password…' : 'Enter optional password…'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        handleModalAuth(true)
                      }
                    }}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordText(!showPasswordText)}
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'rgba(255,255,255,0.4)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {showPasswordText ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {modalError && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    color: 'rgba(248,113,113,0.9)',
                    fontSize: '0.78rem',
                    background: 'rgba(248,113,113,0.08)',
                    border: '1px solid rgba(248,113,113,0.25)',
                    borderRadius: 8,
                    padding: '8px 12px',
                  }}
                >
                  <AlertCircle size={14} style={{ flexShrink: 0 }} /> {modalError}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
                {accountInfo.hasPassword ? (
                  <Button
                    variant="primary"
                    fullWidth
                    loading={isSubmittingModal}
                    onClick={() => handleModalAuth(true)}
                  >
                    Sign In with Password
                  </Button>
                ) : (
                  <>
                    {password.trim().length > 0 && (
                      <Button
                        variant="primary"
                        fullWidth
                        loading={isSubmittingModal}
                        onClick={() => handleModalAuth(true)}
                      >
                        {accountInfo.exists ? 'Attach Password & Enter' : 'Set Password & Enter'}
                      </Button>
                    )}

                    <Button
                      variant={password.trim().length > 0 ? 'ghost' : 'primary'}
                      fullWidth
                      loading={isSubmittingModal && !password.trim()}
                      onClick={() => handleModalAuth(false)}
                    >
                      Continue without Password (Optional)
                    </Button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255,255,255,0.4)',
                    fontSize: '0.74rem',
                    cursor: 'pointer',
                    padding: '6px 0',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
                >
                  Choose a different nickname
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
