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
	const errorRef = useRef<HTMLDivElement | null>(null)
	const navigate = useNavigate()

	// Detectar y guardar parámetro oauth_request
	useEffect(() => {
		const params = new URLSearchParams(window.location.search)
		const oauthRequest = params.get('oauth_request')
		
		if (oauthRequest) {
			// Guardar en sessionStorage para usarlo después del login
			sessionStorage.setItem('oauth_request', oauthRequest)
		}
	}, [])

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
				
				// Verificar si hay un oauth_request pendiente
				const oauthRequest = sessionStorage.getItem('oauth_request')
				
				if (oauthRequest) {

					console.debug('OAuth request detected, calling callback with JWT')
					console.debug('oauth_request:', oauthRequest)
					console.debug('token present:', Boolean(ok.token))
					try {
						// Llamar al endpoint de OAuth callback con el JWT
						const oauthRes = await authService.oauthCallback(oauthRequest, ok.token)
						// Registrar resultado para diagnóstico
						console.debug('oauthCallback response:', oauthRes)
				
						if ((oauthRes as { status: string }).status === 'success') {
							const oauthOk = oauthRes as { redirectUrl: string }
							// Limpiar sessionStorage
							sessionStorage.removeItem('oauth_request')
							// Redirigir a la URL devuelta por el servidor
							window.location.href = oauthOk.redirectUrl
							return
						} else {
							// Si falla el OAuth, continuar al dashboard normal
							console.error('OAuth callback failed:', oauthRes)
							sessionStorage.removeItem('oauth_request')
						}
					} catch (oauthErr) {
						// Si falla el OAuth, continuar al dashboard normal
						console.error('OAuth callback error:', oauthErr)
						sessionStorage.removeItem('oauth_request')
					}
				}
				
				// Navegación normal al dashboard si no hay OAuth o si falló
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

	useEffect(() => {
		if (error) {
			errorRef.current?.focus()
		}
	}, [error])

	return (
		<div className="min-h-screen bg-gradient-animated flex items-center justify-center px-4 py-12 relative overflow-hidden">
			{/* Decorative elements */}
			<div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse" />
			<div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 animate-pulse" />
			
			<Card className="relative z-10">
				<form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
					{/* Header */}
					<div className="text-center mb-4">
						<h1 className="text-3xl sm:text-4xl font-bold gradient-text mb-2">
							Bienvenido
						</h1>
						<p className="text-slate-400 text-sm">
							Ingresa tus credenciales para continuar
						</p>
					</div>

					{/* Error message */}
					<FormError ref={errorRef} message={error} />

					{/* Email input */}
					<Input
						ref={emailRef}
						id="login-email"
						label="Correo electrónico"
						value={email}
						onChange={setEmail}
						type="email"
						error={fieldErrors.email}
						placeholder="tu@email.com"
						icon={
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
							</svg>
						}
					/>

					{/* Password input */}
					<Input
						id="login-password"
						label="Contraseña"
						value={password}
						onChange={setPassword}
						type="password"
						error={fieldErrors.password}
						placeholder="••••••••"
						showPasswordToggle
						icon={
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
							</svg>
						}
					/>

					{/* Forgot password link */}
					<div className="flex items-center justify-between -mt-2">
						<a
							href="/forgot-password"
							className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors duration-200 hover:underline decoration-cyan-400/50 underline-offset-2"
						>
							¿Olvidaste tu contraseña?
						</a>
					</div>

					{/* Submit button */}
					<Button type="submit" loading={loading} className="w-full mt-2">
						Iniciar sesión
					</Button>

					{/* Divider */}
					<div className="relative my-2">
						<div className="absolute inset-0 flex items-center">
							<div className="w-full border-t border-white/10" />
						</div>
						<div className="relative flex justify-center text-sm">
							<span className="px-4 bg-transparent text-slate-500">
								¿Primera vez aquí?
							</span>
						</div>
					</div>

					{/* Additional info */}
					<p className="text-center text-sm text-slate-400">
						Si aún no tienes cuenta, contacta al administrador
					</p>
				</form>
			</Card>
		</div>
	)
}