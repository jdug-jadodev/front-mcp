import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../components/Card'
import Input from '../components/Input'
import Button from '../components/Button'
import FormError from '../components/FormError'
import { authService } from '../services/authService'
import { saveAuth, type AuthUser } from '../lib/api'

export default function LoginPage() {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
	const emailRef = useRef<HTMLInputElement | null>(null)
	const navigate = useNavigate()

	useEffect(() => {
		emailRef.current?.focus()
	}, [])

	const validate = () => {
		const errs: typeof fieldErrors = {}
		if (!email.trim()) errs.email = 'Correo requerido'
		else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errs.email = 'Email inválido'
		if (!password) errs.password = 'Contraseña requerida'
		setFieldErrors(errs)
		return Object.keys(errs).length === 0
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setError(null)
		if (!validate()) return
		setLoading(true)
		try {
			const res = await authService.login(email, password)
			if ((res as { status: string }).status === 'success') {
				const ok = res as { token: string; user: AuthUser }
				saveAuth(ok.token, ok.user)
				navigate('/dashboard')
			} else {
				setError((res as { message?: string }).message || 'Credenciales incorrectas')
			}
		} catch (err: unknown) {
			if (err instanceof Error) {
				setError(err.message || 'Error de conexión')
			} else {
				setError('Error de conexión')
			}
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="min-h-screen flex items-center justify-center px-4 py-8">
			<Card className="w-full max-w-md">
				<form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
					<h2 className="text-2xl font-semibold">Iniciar sesión</h2>
					<FormError message={error} />
					<Input ref={emailRef} id="login-email" label="Correo" value={email} onChange={setEmail} type="email" error={fieldErrors.email} />
					<Input id="login-password" label="Contraseña" value={password} onChange={setPassword} type="password" error={fieldErrors.password} showPasswordToggle />
					<div className="flex items-center justify-between">
						<a href="/forgot-password" className="text-sm text-brand-primary-600 hover:underline">¿Olvidaste tu contraseña?</a>
					</div>
					<Button type="submit" loading={loading}>
						Entrar
					</Button>
				</form>
			</Card>
		</div>
	)
}