import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import FormError from '../components/FormError';
import { authService } from '../services/authService';
import { validatePasswordRules, calculatePasswordStrength } from '../lib/validators/password';
import { validatePasswordToken } from '../lib/api';
import type { TokenValidationResult } from '../lib/api';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';
import { useRequestLock } from '../hooks/useRequestLock';
import { useTokenFromUrl } from '../hooks/useTokenFromUrl';

type ValidationState = 'validating' | 'valid' | 'expired' | 'used' | 'invalid' | 'no_token' | 'error';

const ResetPassword = () => {
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();
	const token = useTokenFromUrl();

	const [validationState, setValidationState] = useState<ValidationState>('validating');
	const [validationResult, setValidationResult] = useState<TokenValidationResult | null>(null);

	const { locked, remainingMs, start } = useRequestLock();

	const validation = useMemo(() => validatePasswordRules(newPassword), [newPassword]);

	const [strength, setStrength] = useState<{ score: number; level: 'Weak' | 'Fair' | 'Good' | 'Strong' }>({ score: 0, level: 'Weak' });

	// Debounced strength calculation
	useEffect(() => {
		const t = setTimeout(() => {
			setStrength(calculatePasswordStrength(newPassword));
		}, 200);
		return () => clearTimeout(t);
	}, [newPassword]);

	// Validate token on mount using new API
	useEffect(() => {
		if (!token) {
			setValidationState('no_token');
			return;
		}

		setValidationState('validating');
		validatePasswordToken(token, 'password_reset').then((result) => {
			setValidationResult(result);
			
			if (result.valid) {
				setValidationState('valid');
			} else {
				switch (result.status) {
					case 'expired':
						setValidationState('expired');
						break;
					case 'used':
						setValidationState('used');
						break;
					default:
						setValidationState('invalid');
				}
			}
		});
	}, [token]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		
		if (!token) {
			setError('Token no disponible');
			return;
		}

		if (newPassword !== confirmPassword) {
			setError('Las contraseñas no coinciden');
			return;
		}

		if (!validation.ok) {
			setError('La contraseña no cumple los requisitos');
			return;
		}

		if (locked) return;

		start(2000);
		setLoading(true);
		
		try {
			const result = await authService.resetPassword(token, newPassword);
			if (result.status === 'success') {
				navigate('/login', { state: { message: 'Contraseña actualizada. Por favor, inicia sesión.' } });
			} else {
				const err = result as { code?: string; message?: string };
				if (err.code === 'WEAK_PASSWORD') {
					setError('Contraseña rechazada por el servidor: demasiado débil. Intenta una más fuerte.');
				} else if (err.code === 'INVALID_TOKEN') {
					setError('Enlace inválido o expirado. Solicita un nuevo enlace.');
				} else if (err.code === 'TOKEN_ALREADY_USED') {
					setError('Este enlace ya fue usado. Solicita un nuevo enlace.');
				} else {
					setError(err.message ?? 'Error al restablecer la contraseña');
				}
			}
		} catch (_err) {
			void _err;
			setError('Error de conexión');
		} finally {
			setLoading(false);
		}
	};

	// Estado: Validando
	if (validationState === 'validating') {
		return (
			<div className="min-h-screen bg-gradient-animated flex items-center justify-center px-4 py-12 relative overflow-hidden">
				<div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse" />
				<div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 animate-pulse" />
				
				<Card className="relative z-10 w-full max-w-md">
					<div className="space-y-4">
						<div className="h-8 bg-gray-700 rounded animate-pulse"></div>
						<div className="h-4 bg-gray-700 rounded animate-pulse"></div>
						<p className="text-sm text-gray-400 text-center">
							Verificando tu enlace...
						</p>
					</div>
				</Card>
			</div>
		);
	}

	// Estado: No hay token en URL
	if (validationState === 'no_token') {
		return (
			<div className="min-h-screen bg-gradient-animated flex items-center justify-center px-4 py-12 relative overflow-hidden">
				<div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse" />
				<div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 animate-pulse" />
				
				<Card className="relative z-10 w-full max-w-md">
					<div className="space-y-6 text-center">
						<div>
							<h1 className="text-2xl font-bold mb-2">Enlace no válido</h1>
							<p className="text-gray-400">
								No se encontró un enlace de restablecimiento de contraseña.
							</p>
						</div>
						<Button
							onClick={() => navigate('/forgot-password')}
							className="w-full"
						>
							Solicitar un nuevo enlace
						</Button>
					</div>
				</Card>
			</div>
		);
	}

	// Estado: Token expirado
	if (validationState === 'expired') {
		return (
			<div className="min-h-screen bg-gradient-animated flex items-center justify-center px-4 py-12 relative overflow-hidden">
				<div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse" />
				<div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 animate-pulse" />
				
				<Card className="relative z-10 w-full max-w-md">
					<div className="space-y-6 text-center">
						<div>
							<h1 className="text-2xl font-bold mb-2">Enlace expirado</h1>
							<p className="text-gray-400">
								El enlace de restablecimiento de contraseña ya no es válido.
							</p>
						</div>
						<Button
							onClick={() => navigate('/forgot-password')}
							className="w-full"
						>
							Solicitar un nuevo enlace
						</Button>
					</div>
				</Card>
			</div>
		);
	}

	// Estado: Token ya usado
	if (validationState === 'used') {
		return (
			<div className="min-h-screen bg-gradient-animated flex items-center justify-center px-4 py-12 relative overflow-hidden">
				<div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse" />
				<div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 animate-pulse" />
				
				<Card className="relative z-10 w-full max-w-md">
					<div className="space-y-6 text-center">
						<div>
							<h1 className="text-2xl font-bold mb-2">Enlace ya utilizado</h1>
							<p className="text-gray-400">
								Este enlace ya fue usado para restablecer la contraseña.
							</p>
						</div>
						<Button
							onClick={() => navigate('/login')}
							className="w-full"
						>
							Ir al inicio de sesión
						</Button>
					</div>
				</Card>
			</div>
		);
	}

	// Estado: Error genérico o token inválido
	if (validationState === 'invalid' || validationState === 'error') {
		return (
			<div className="min-h-screen bg-gradient-animated flex items-center justify-center px-4 py-12 relative overflow-hidden">
				<div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse" />
				<div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 animate-pulse" />
				
				<Card className="relative z-10 w-full max-w-md">
					<div className="space-y-6 text-center">
						<div>
							<h1 className="text-2xl font-bold mb-2">Error</h1>
							<p className="text-gray-400">
								{validationResult?.message || 
								 'No se pudo procesar tu solicitud. Intenta de nuevo.'}
							</p>
						</div>
						<Button
							onClick={() => navigate('/login')}
							className="w-full"
						>
							Ir al inicio de sesión
						</Button>
					</div>
				</Card>
			</div>
		);
	}

	// Estado: Válido - Mostrar formulario
	return (
		<div className="min-h-screen bg-gradient-animated flex items-center justify-center px-4 py-12 relative overflow-hidden">
			{/* Decorative elements */}
			<div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse" />
			<div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 animate-pulse" />
			
			<Card className="relative z-10 w-full max-w-md">
				<form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
					{/* Header */}
					<div className="text-center mb-4">
						<h1 className="text-3xl font-bold gradient-text mb-2">
							Restablecer Contraseña
						</h1>
						<p className="text-slate-400 text-sm">
							Restableciendo contraseña para: <strong>{validationResult?.email}</strong>
						</p>
						<p className="text-slate-400 text-xs mt-2">
							Requisitos: min. 8 caracteres, mayúscula, minúscula, número y símbolo.
						</p>
					</div>

					{/* Error message */}
					<FormError message={error} />

					{/* New password input */}
					<div className="space-y-2">
						<Input
							id="new-password"
							label="Nueva contraseña"
							value={newPassword}
							onChange={setNewPassword}
							type="password"
							placeholder="••••••••"
							showPasswordToggle
							icon={
								<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
								</svg>
							}
						/>
						
						<PasswordStrengthMeter value={strength.score} level={strength.level} hints={validation.hints} />
					</div>

					{/* Confirm password input */}
					<Input
						id="confirm-password"
						label="Confirmar contraseña"
						value={confirmPassword}
						onChange={setConfirmPassword}
						type="password"
						placeholder="••••••••"
						showPasswordToggle
						icon={
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						}
					/>

					{/* Submit button */}
					<Button
						type="submit"
						loading={loading}
						disabled={!validation.ok || newPassword !== confirmPassword || locked}
						className="w-full"
					>
						{locked ? `Espera ${Math.ceil(remainingMs / 1000)}s` : 'Restablecer Contraseña'}
					</Button>
				</form>
			</Card>
		</div>
	);
};

export default ResetPassword;