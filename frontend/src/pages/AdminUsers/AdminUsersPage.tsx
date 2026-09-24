import { type FormEvent, useEffect, useState } from 'react'
import { useAuth } from '@/auth/useAuth'
import { useUnauthorizedHandler } from '@/auth/useUnauthorizedHandler'
import { useLanguage } from '@/i18n/useLanguage'
import { formatMessage } from '@/i18n/translations'
import {
  changeAdminUserPassword,
  createAdminUser,
  getAdminUsers,
  updateAdminUser,
} from '@/services/adminUsers'
import { ApiError } from '@/services/api'
import type { AdminUser, AdminUserCreate, AdminUserRole, AdminUserUpdate } from '@/types/adminUser'
import './AdminUsersPage.scss'

const roles: AdminUserRole[] = ['ADMIN', 'MANAGER', 'EMPLOYEE']
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface AccountFormValues {
  email: string
  password: string
  role: AdminUserRole
  isActive: boolean
}

type DialogState =
  | { type: 'create' }
  | { type: 'edit'; user: AdminUser }
  | { type: 'password'; user: AdminUser }
  | null

const emptyAccountForm: AccountFormValues = {
  email: '',
  password: '',
  role: 'EMPLOYEE',
  isActive: true,
}

function accountInitials(email: string) {
  return email.slice(0, 2).toUpperCase()
}

export function AdminUsersPage() {
  const { user: currentUser } = useAuth()
  const handleUnauthorized = useUnauthorizedHandler()
  const { t } = useLanguage()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [dialog, setDialog] = useState<DialogState>(null)
  const [accountForm, setAccountForm] = useState<AccountFormValues>(emptyAccountForm)
  const [newPassword, setNewPassword] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    let isCurrent = true

    getAdminUsers()
      .then((userList) => {
        if (isCurrent) setUsers(userList)
      })
      .catch((error: unknown) => {
        if (!handleUnauthorized(error) && isCurrent) setLoadError(true)
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [handleUnauthorized])

  useEffect(() => {
    if (!dialog) return

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isSaving) {
        setDialog(null)
        setAccountForm(emptyAccountForm)
        setNewPassword('')
        setFormError(null)
      }
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [dialog, isSaving])

  async function handleRetry() {
    setIsLoading(true)
    setLoadError(false)
    try {
      setUsers(await getAdminUsers())
    } catch (error) {
      if (!handleUnauthorized(error)) setLoadError(true)
    } finally {
      setIsLoading(false)
    }
  }

  function openCreateDialog() {
    setAccountForm(emptyAccountForm)
    setFormError(null)
    setFeedback(null)
    setDialog({ type: 'create' })
  }

  function openEditDialog(user: AdminUser) {
    setAccountForm({
      email: user.email,
      password: '',
      role: user.role,
      isActive: user.is_active,
    })
    setFormError(null)
    setFeedback(null)
    setDialog({ type: 'edit', user })
  }

  function openPasswordDialog(user: AdminUser) {
    setNewPassword('')
    setFormError(null)
    setFeedback(null)
    setDialog({ type: 'password', user })
  }

  function closeDialog() {
    if (isSaving) return
    setDialog(null)
    setAccountForm(emptyAccountForm)
    setNewPassword('')
    setFormError(null)
  }

  function errorMessage(error: unknown, fallback: string) {
    if (error instanceof ApiError) {
      if (error.status === 409) return t.adminUsers.errors.duplicateEmail
      if (error.status === 422) return t.adminUsers.errors.validation
      if (error.status === 400) return t.adminUsers.errors.selfProtection
    }
    return fallback
  }

  function validateEmail(email: string) {
    if (!email) return t.adminUsers.errors.emailRequired
    if (!emailPattern.test(email)) return t.adminUsers.errors.invalidEmail
    return null
  }

  function validatePassword(password: string) {
    if (!password.trim()) return t.adminUsers.errors.passwordRequired
    if (password.length < 8) return t.adminUsers.errors.passwordLength
    return null
  }

  async function handleAccountSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSaving || dialog?.type === 'password' || !dialog) return

    const email = accountForm.email.trim()
    const emailError = validateEmail(email)
    if (emailError) {
      setFormError(emailError)
      return
    }

    if (dialog.type === 'create') {
      const passwordError = validatePassword(accountForm.password)
      if (passwordError) {
        setFormError(passwordError)
        return
      }
    }

    setIsSaving(true)
    setFormError(null)
    try {
      if (dialog.type === 'create') {
        const payload: AdminUserCreate = {
          email,
          password: accountForm.password,
          role: accountForm.role,
          is_active: accountForm.isActive,
        }
        const createdUser = await createAdminUser(payload)
        setUsers((current) => [...current, createdUser].sort((first, second) => first.id - second.id))
        setFeedback(formatMessage(t.adminUsers.feedback.created, { email: createdUser.email }))
      } else {
        const target = dialog.user
        const isCurrentAdministrator = target.id === currentUser?.id
        const payload: AdminUserUpdate = {}
        if (email !== target.email) payload.email = email
        if (!isCurrentAdministrator && accountForm.role !== target.role) payload.role = accountForm.role
        if (!isCurrentAdministrator && accountForm.isActive !== target.is_active) payload.is_active = accountForm.isActive

        const updatedUser = await updateAdminUser(target.id, payload)
        setUsers((current) => current.map((user) => user.id === updatedUser.id ? updatedUser : user))
        setFeedback(formatMessage(t.adminUsers.feedback.updated, { email: updatedUser.email }))
      }
      setDialog(null)
      setAccountForm(emptyAccountForm)
    } catch (error) {
      if (!handleUnauthorized(error)) setFormError(errorMessage(error, t.adminUsers.errors.saveFailed))
    } finally {
      setIsSaving(false)
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSaving || dialog?.type !== 'password') return

    const passwordError = validatePassword(newPassword)
    if (passwordError) {
      setFormError(passwordError)
      return
    }

    const target = dialog.user
    setIsSaving(true)
    setFormError(null)
    try {
      await changeAdminUserPassword(target.id, { password: newPassword })
      setFeedback(formatMessage(t.adminUsers.feedback.passwordChanged, { email: target.email }))
      setNewPassword('')
      setDialog(null)
    } catch (error) {
      if (!handleUnauthorized(error)) setFormError(errorMessage(error, t.adminUsers.errors.passwordFailed))
    } finally {
      setIsSaving(false)
    }
  }

  const activeCount = users.filter((user) => user.is_active).length
  const selectedUser = dialog && dialog.type !== 'create' ? dialog.user : null
  const editingSelf = dialog?.type === 'edit' && dialog.user.id === currentUser?.id

  return (
    <div className="admin-users-page">
      <section className="admin-users-page__heading">
        <div>
          <p className="admin-users-page__eyebrow">{t.adminUsers.eyebrow}</p>
          <h2>{t.adminUsers.title}</h2>
          <p>{t.adminUsers.description}</p>
        </div>
        <div className="admin-users-page__heading-actions">
          <span>{formatMessage(t.adminUsers.count, { count: users.length })}</span>
          <button className="admin-button admin-button--primary" type="button" onClick={openCreateDialog}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
            {t.adminUsers.createUser}
          </button>
        </div>
      </section>

      {feedback && (
        <div className="admin-users-page__feedback" role="status">
          <span aria-hidden="true">✓</span>
          <p>{feedback}</p>
          <button type="button" onClick={() => setFeedback(null)} aria-label={t.adminUsers.dismissFeedback}>×</button>
        </div>
      )}

      <section className="admin-users-table" aria-labelledby="admin-user-directory-heading">
        <header>
          <div>
            <h3 id="admin-user-directory-heading">{t.adminUsers.directory}</h3>
            <p>{t.adminUsers.directoryDescription}</p>
          </div>
          {!isLoading && !loadError && <span>{formatMessage(t.adminUsers.activeCount, { count: activeCount })}</span>}
        </header>

        {isLoading && (
          <div className="admin-users-page__state" role="status">
            <span className="admin-users-page__loader" aria-hidden="true" />
            <strong>{t.adminUsers.loading}</strong>
          </div>
        )}

        {!isLoading && loadError && (
          <div className="admin-users-page__state" role="alert">
            <span className="admin-users-page__state-icon" aria-hidden="true">!</span>
            <strong>{t.adminUsers.loadError}</strong>
            <p>{t.adminUsers.loadErrorDescription}</p>
            <button className="admin-button" type="button" onClick={() => void handleRetry()}>{t.adminUsers.retry}</button>
          </div>
        )}

        {!isLoading && !loadError && users.length === 0 && (
          <div className="admin-users-page__state">
            <span className="admin-users-page__state-icon" aria-hidden="true">0</span>
            <strong>{t.adminUsers.emptyTitle}</strong>
            <p>{t.adminUsers.emptyDescription}</p>
            <button className="admin-button admin-button--primary" type="button" onClick={openCreateDialog}>{t.adminUsers.createUser}</button>
          </div>
        )}

        {!isLoading && !loadError && users.length > 0 && (
          <div className="admin-users-table__scroll">
            <table>
              <thead>
                <tr>
                  <th scope="col">{t.adminUsers.account}</th>
                  <th scope="col">{t.adminUsers.role}</th>
                  <th scope="col">{t.adminUsers.status}</th>
                  <th scope="col"><span className="sr-only">{t.adminUsers.actions}</span></th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isCurrentAdministrator = user.id === currentUser?.id
                  return (
                    <tr key={user.id}>
                      <td data-label={t.adminUsers.account}>
                        <div className="admin-user-identity">
                          <span className="admin-user-identity__avatar" aria-hidden="true">{accountInitials(user.email)}</span>
                          <span>
                            <strong>{user.email}</strong>
                            <small>
                              {formatMessage(t.adminUsers.userId, { id: user.id })}
                              {isCurrentAdministrator && <em>{t.adminUsers.you}</em>}
                            </small>
                          </span>
                        </div>
                      </td>
                      <td data-label={t.adminUsers.role}>
                        <span className={`admin-role-badge admin-role-badge--${user.role.toLowerCase()}`}>{user.role}</span>
                      </td>
                      <td data-label={t.adminUsers.status}>
                        <span className={`admin-account-status${user.is_active ? '' : ' admin-account-status--inactive'}`}>
                          <i aria-hidden="true" />
                          {user.is_active ? t.adminUsers.active : t.adminUsers.inactive}
                        </span>
                      </td>
                      <td data-label={t.adminUsers.actions}>
                        <div className="admin-user-actions">
                          <button type="button" onClick={() => openEditDialog(user)}>{t.adminUsers.edit}</button>
                          <button type="button" onClick={() => openPasswordDialog(user)}>{t.adminUsers.changePassword}</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {dialog && (
        <div className="admin-dialog-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeDialog()
        }}>
          <section className="admin-dialog" role="dialog" aria-modal="true" aria-labelledby="admin-user-dialog-title">
            <header className="admin-dialog__header">
              <div>
                <span>{dialog.type === 'password' ? t.adminUsers.securityAction : t.adminUsers.accountDetails}</span>
                <h3 id="admin-user-dialog-title">
                  {dialog.type === 'create' && t.adminUsers.createUser}
                  {dialog.type === 'edit' && t.adminUsers.editUser}
                  {dialog.type === 'password' && t.adminUsers.passwordTitle}
                </h3>
                <p>
                  {dialog.type === 'create' && t.adminUsers.createDescription}
                  {dialog.type === 'edit' && t.adminUsers.editDescription}
                  {dialog.type === 'password' && formatMessage(t.adminUsers.passwordDescription, { email: selectedUser?.email ?? '' })}
                </p>
              </div>
              <button className="admin-dialog__close" type="button" disabled={isSaving} onClick={closeDialog} aria-label={t.adminUsers.closeDialog}>×</button>
            </header>

            {dialog.type === 'password' ? (
              <form onSubmit={handlePasswordSubmit} noValidate>
                <div className="admin-dialog__body">
                  <label className="admin-field">
                    <span>{t.adminUsers.newPassword}</span>
                    <input
                      autoFocus
                      type="password"
                      autoComplete="new-password"
                      minLength={8}
                      value={newPassword}
                      disabled={isSaving}
                      onChange={(event) => setNewPassword(event.target.value)}
                    />
                    <small>{t.adminUsers.passwordHint}</small>
                  </label>
                  {formError && <p className="admin-dialog__error" role="alert">{formError}</p>}
                </div>
                <footer className="admin-dialog__footer">
                  <button className="admin-button" type="button" disabled={isSaving} onClick={closeDialog}>{t.adminUsers.cancel}</button>
                  <button className="admin-button admin-button--primary" type="submit" disabled={isSaving}>
                    {isSaving ? t.adminUsers.changingPassword : t.adminUsers.confirmPasswordChange}
                  </button>
                </footer>
              </form>
            ) : (
              <form onSubmit={handleAccountSubmit} noValidate>
                <div className="admin-dialog__body">
                  <div className="admin-dialog__fields">
                    <label className="admin-field admin-field--wide">
                      <span>{t.adminUsers.email}</span>
                      <input
                        autoFocus
                        type="email"
                        autoComplete="off"
                        value={accountForm.email}
                        disabled={isSaving}
                        onChange={(event) => setAccountForm((current) => ({ ...current, email: event.target.value }))}
                      />
                    </label>
                    {dialog.type === 'create' && (
                      <label className="admin-field admin-field--wide">
                        <span>{t.adminUsers.password}</span>
                        <input
                          type="password"
                          autoComplete="new-password"
                          minLength={8}
                          value={accountForm.password}
                          disabled={isSaving}
                          onChange={(event) => setAccountForm((current) => ({ ...current, password: event.target.value }))}
                        />
                        <small>{t.adminUsers.passwordHint}</small>
                      </label>
                    )}
                    <label className="admin-field">
                      <span>{t.adminUsers.role}</span>
                      <select
                        value={accountForm.role}
                        disabled={isSaving || editingSelf}
                        onChange={(event) => setAccountForm((current) => ({ ...current, role: event.target.value as AdminUserRole }))}
                      >
                        {roles.map((role) => <option key={role} value={role}>{t.adminUsers.roleLabels[role]}</option>)}
                      </select>
                    </label>
                    <label className={`admin-switch${editingSelf ? ' admin-switch--disabled' : ''}`}>
                      <input
                        type="checkbox"
                        checked={accountForm.isActive}
                        disabled={isSaving || editingSelf}
                        onChange={(event) => setAccountForm((current) => ({ ...current, isActive: event.target.checked }))}
                      />
                      <span aria-hidden="true"><i /></span>
                      <strong>{t.adminUsers.activeAccount}</strong>
                    </label>
                  </div>
                  {editingSelf && (
                    <p className="admin-dialog__notice">
                      <span aria-hidden="true">i</span>
                      {t.adminUsers.selfProtectionNotice}
                    </p>
                  )}
                  {formError && <p className="admin-dialog__error" role="alert">{formError}</p>}
                </div>
                <footer className="admin-dialog__footer">
                  <button className="admin-button" type="button" disabled={isSaving} onClick={closeDialog}>{t.adminUsers.cancel}</button>
                  <button className="admin-button admin-button--primary" type="submit" disabled={isSaving}>
                    {isSaving ? t.adminUsers.saving : dialog.type === 'create' ? t.adminUsers.createAccount : t.adminUsers.saveChanges}
                  </button>
                </footer>
              </form>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
