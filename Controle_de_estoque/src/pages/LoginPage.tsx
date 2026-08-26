import { useState, type FormEvent } from 'react'
import {
  FiArrowRight,
  FiCheckCircle,
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
  FiShield,
  FiTrendingUp,
} from 'react-icons/fi'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import logo from '../assets/logo.png'
import hero from '../assets/hero.png'
import { useAuth } from '../auth/useAuth'
import { ApiError } from '../services/auth-api'
import '../styles/login.css'

interface LocationState {
  from?: string
}

function LoginPage() {
  const { isAuthenticated, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!email.trim() || !password) {
      setError('Informe seu e-mail e sua senha para continuar.')
      return
    }

    setIsSubmitting(true)

    try {
      await login({ email: email.trim(), password })
      const destination = (location.state as LocationState | null)?.from
      navigate(destination ?? '/dashboard', { replace: true })
    } catch (caughtError) {
      if (caughtError instanceof ApiError) {
        if (caughtError.status === 401) {
          setError('E-mail ou senha inválidos. Revise os dados e tente novamente.')
        } else if (caughtError.status === 429) {
          setError('Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.')
        } else {
          setError(caughtError.message)
        }
      } else {
        setError('Ocorreu um erro inesperado. Tente novamente.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-showcase" aria-label="Apresentação do sistema">
        <div className="login-showcase__glow" />
        <img className="login-showcase__logo" src={logo} alt="Altrion" />

        <div className="login-showcase__content">
          <span className="eyebrow">Operação inteligente</span>
          <h1>Seu armazém sob controle, do recebimento à expedição.</h1>
          <p>
            Visibilidade operacional, rastreabilidade e decisões rápidas em uma
            plataforma criada para crescer com a sua logística.
          </p>

          <div className="showcase-benefits">
            <div>
              <FiTrendingUp aria-hidden="true" />
              <span>Indicadores em tempo real</span>
            </div>
            <div>
              <FiShield aria-hidden="true" />
              <span>Acesso seguro por perfil</span>
            </div>
          </div>
        </div>

        <img className="login-showcase__hero" src={hero} alt="" aria-hidden="true" />

        <div className="login-showcase__footer">
          <span className="status-dot" />
          Ambiente de desenvolvimento seguro
        </div>
      </section>

      <section className="login-access">
        <div className="login-access__inner">
          <div className="mobile-brand">
            <img src={logo} alt="Altrion" />
          </div>

          <header className="login-heading">
            <span className="login-heading__icon"><FiLock aria-hidden="true" /></span>
            <div>
              <span className="eyebrow eyebrow--blue">Área segura</span>
              <h2>Bem-vindo de volta</h2>
            </div>
          </header>
          <p className="login-subtitle">
            Use as credenciais cadastradas no WMS para acessar sua operação.
          </p>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <label className="field-group">
              <span>E-mail corporativo</span>
              <span className="field-control">
                <FiMail aria-hidden="true" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="voce@empresa.com.br"
                  autoComplete="email"
                  autoFocus
                  disabled={isSubmitting}
                  aria-describedby={error ? 'login-error' : undefined}
                />
              </span>
            </label>

            <label className="field-group">
              <span>Senha</span>
              <span className="field-control">
                <FiLock aria-hidden="true" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  aria-describedby={error ? 'login-error' : undefined}
                />
                <button
                  className="password-toggle"
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  disabled={isSubmitting}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </span>
            </label>

            {error && (
              <div className="login-error" id="login-error" role="alert">
                <span>!</span>
                <p>{error}</p>
              </div>
            )}

            <button className="login-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="spinner" aria-hidden="true" />
                  Validando acesso...
                </>
              ) : (
                <>
                  Entrar no sistema
                  <FiArrowRight aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          <div className="secure-note">
            <FiCheckCircle aria-hidden="true" />
            <span>Suas credenciais são enviadas por uma conexão protegida.</span>
          </div>
        </div>

        <footer className="login-access__footer">
          Altrion WMS <span>•</span> Soluções inteligentes para logística
        </footer>
      </section>
    </main>
  )
}

export default LoginPage
