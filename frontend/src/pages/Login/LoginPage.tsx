import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LanguageSelector } from '../../components/LanguageSelector/LanguageSelector'
import { useLanguage } from '../../i18n/useLanguage'
import './LoginPage.scss'

interface LoginErrors {
  email?: boolean
  password?: boolean
}

export function LoginPage() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<LoginErrors>({})

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors: LoginErrors = {}
    if (!email.trim()) nextErrors.email = true
    if (!password.trim()) nextErrors.password = true

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length === 0) navigate('/')
  }

  return (
    <main className="login-page">
      <section className="login-page__identity" aria-labelledby="login-brand-title">
        <div className="login-page__topbar">
          <div className="login-brand">
            <span className="login-brand__mark" aria-hidden="true">CO</span>
            <span><strong>CORP OPS</strong><small>{t.brand.subtitle}</small></span>
          </div>
          <LanguageSelector />
        </div>
        <div className="login-page__statement">
          <p className="login-page__kicker">{t.login.internalSystem}</p>
          <h1 id="login-brand-title">{t.login.title}</h1>
          <p>{t.login.description}</p>
        </div>
        <p className="login-page__classification">{t.login.classification}</p>
      </section>

      <section className="login-page__access" aria-labelledby="login-title">
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="login-form__heading">
            <p>{t.login.workspaceAccess}</p>
            <h2 id="login-title">{t.login.signInTitle}</h2>
            <span>{t.login.instruction}</span>
          </div>

          <div className="form-field">
            <label htmlFor="email">{t.login.email}</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'email-error' : undefined}
              onChange={(event) => setEmail(event.target.value)}
            />
            {errors.email && <span className="form-field__error" id="email-error">{t.login.emailRequired}</span>}
          </div>

          <div className="form-field">
            <label htmlFor="password">{t.login.password}</label>
            <div className="password-field">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? 'password-error' : undefined}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button type="button" onClick={() => setShowPassword((visible) => !visible)}>
                {showPassword ? t.login.hidePassword : t.login.showPassword}
              </button>
            </div>
            {errors.password && <span className="form-field__error" id="password-error">{t.login.passwordRequired}</span>}
          </div>

          <button className="login-form__submit" type="submit">{t.login.signIn}</button>

          <div className="login-form__notice">
            <strong>{t.login.developmentAccess}</strong>
            <span>{t.login.developmentNotice}</span>
          </div>
        </form>
      </section>
    </main>
  )
}
