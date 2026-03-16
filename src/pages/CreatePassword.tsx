import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import FormError from '../components/FormError';
import { authService } from '../services/authService';
import { validatePasswordRules, calculatePasswordStrength } from '../lib/validators/password';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';
import { useRequestLock } from '../hooks/useRequestLock';
import { useTokenFromUrl } from '../hooks/useTokenFromUrl';

const CreatePassword: React.FC = () => {
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();
	const token = useTokenFromUrl();
	const [verified, setVerified] = useState<boolean | null>(null);
	const [verifying, setVerifying] = useState(false);

	const { locked, remainingMs, start } = useRequestLock();

	const validation = useMemo(() => validatePasswordRules(password), [password]);

	const [strength, setStrength] = useState<{ score: number; level: 'Weak' | 'Fair' | 'Good' | 'Strong' }>({ score: 0, level: 'Weak' });

	// Debounced strength calculation
	useEffect(() => {
		const t = setTimeout(() => {
			setStrength(calculatePasswordStrength(password));
		}, 200);
		return () => clearTimeout(t);
	}, [password]);

	// Verify token with backend before rendering form
	useEffect(() => {
		let mounted = true;
		const doVerify = async () => {
			if (!token) {
				if (mounted) setVerified(false);
				return;
			}
			setVerifying(true);
			try {
				const res = await authService.verifyResetToken(token);
				if (res.status === 'success') {
					if (mounted) setVerified(true);
				} else {
					if (mounted) setVerified(false);
				}
			} catch (_err) {
				void _err;
				if (mounted) setVerified(false);
			} finally {
				if (mounted) setVerifying(false);
			}
		};
		doVerify();
		return () => { mounted = false; };
	}, [token]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		if (!token) {
			setError('Token inválido o expirado');
			navigate('/forgot-password');
			return;
		}
		if (verified === false) {
			setError('Enlace inválido o expirado');
			return;
		}
		if (!validation.ok) {
			setError('La contraseña no cumple los requisitos');
			return;
		}
		if (password !== confirmPassword) {
			setError('Las contraseñas no coinciden');
			return;
		}
		if (locked) return;

		start(2000);
		setLoading(true);
			try {
				const result = await authService.createPassword(token, password);
				if (result.status === 'success') {
				// show success and redirect
				navigate('/login', { state: { message: 'Contraseña creada correctamente' } });
			} else {
					const err = result as { status?: string; code?: string; message?: string };
					const code = err.code;
				if (code === 'WEAK_PASSWORD') {
					setError('Contraseña rechazada por el servidor: demasiado débil. Intenta una más fuerte.');
				} else if (code === 'INVALID_TOKEN') {
					setError('Enlace inválido o expirado. Solicita un nuevo enlace.');
				} else if (code === 'TOKEN_ALREADY_USED') {
					setError('Este enlace ya fue usado. Solicita un nuevo enlace.');
				} else if (code === 'ALREADY_HAS_PASSWORD') {
					setError('El usuario ya tiene contraseña. Puedes iniciar sesión.');
				} else if (code === 'TOO_MANY_REQUESTS') {
					setError('Demasiadas solicitudes. Intenta nuevamente más tarde.');
				} else {
					setError(err.message ?? 'Error al crear la contraseña');
				}
			}
			} catch (_err) {
				void _err;
				setError('Error de conexión');
			} finally {
			setLoading(false);
		}
	};

	if (verifying) {
		return (
			<div className="min-h-screen bg-gradient-animated flex items-center justify-center px-4 py-12">
				<Card>
					<div className="text-center text-slate-300">Verificando enlace...</div>
				</Card>
			</div>
		);
	}

	if (verified === false) {
		return (
			<div className="min-h-screen bg-gradient-animated flex items-center justify-center px-4 py-12 relative overflow-hidden">
				<div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse" />
				<div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 animate-pulse" />
				
				<Card className="relative z-10">
					<div className="text-center mb-6">
						<h1 className="text-2xl font-bold gradient-text mb-2">Enlace Inválido</h1>
						<p className="text-rose-300 mb-4">Enlace inválido o expirado. Solicita un nuevo enlace.</p>
						<Button onClick={() => navigate('/forgot-password')}>
							Solicitar nuevo enlace
						</Button>
					</div>
				</Card>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-animated flex items-center justify-center px-4 py-12 relative overflow-hidden">
			{/* Decorative elements */}
			<div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse" />
			<div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 animate-pulse" />
			
			<Card className="relative z-10">
				<form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
					{/* Header */}
					<div className="text-center mb-4">
						<h1 className="text-3xl font-bold gradient-text mb-2">
							Crear Contraseña
						</h1>
						<p className="text-slate-400 text-xs mb-2">
							Requisitos mínimos: mínimo 8 caracteres, mayúscula, minúscula, número y símbolo.
						</p>
					</div>

					{/* Error message */}
					<FormError message={error} />

					{/* Password input */}
					<div className="space-y-2">
						<Input
							id="create-password"
							label="Nueva contraseña"
							value={password}
							onChange={setPassword}
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
						disabled={!validation.ok || password !== confirmPassword || locked}
						className="w-full"
					>
						{locked ? `Espera ${Math.ceil(remainingMs / 1000)}s` : 'Crear Contraseña'}
					</Button>
				</form>
			</Card>
		</div>
	);
};

export default CreatePassword;