import React, { useEffect, useMemo, useState } from 'react';import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/authService';
import { validatePasswordRules, calculatePasswordStrength } from '../lib/validators/password';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';
import { useRequestLock } from '../hooks/useRequestLock';

const CreatePassword: React.FC = () => {
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const token = searchParams.get('token');
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
					// Clean token from URL
					try {
						window.history.replaceState(null, '', window.location.pathname);
					} catch (err) {
						console.debug('Failed to remove token from URL', err);
					}
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
		return <div className="max-w-sm mx-auto p-4 bg-white rounded shadow">Verificando enlace...</div>;
	}

	if (verified === false) {
		return (
			<div className="max-w-sm mx-auto p-4 bg-white rounded shadow">
				<div className="text-red-600">Enlace inválido o expirado. Solicita un nuevo enlace.</div>
				<button className="mt-4 bg-blue-600 text-white p-2 rounded" onClick={() => navigate('/forgot-password')}>Solicitar nuevo enlace</button>
			</div>
		);
	}

	return (
		<form onSubmit={handleSubmit} className="max-w-sm mx-auto p-4 bg-white rounded shadow">
			<h1 className="text-xl mb-4">Crear Contraseña</h1>
			<div className="text-xs mb-2 text-gray-600">
				Requisitos mínimos: mínimo 8 caracteres, mayúscula, minúscula, número y símbolo.
			</div>

			<div role="status" aria-live="polite" className="mb-2">
				{error && <div className="text-red-600 mb-2">{error}</div>}
			</div>

			<input
				type="password"
				placeholder="Nueva contraseña"
				value={password}
				onChange={e => setPassword(e.target.value)}
				className="w-full mb-2 p-2 border rounded"
				aria-describedby="password-hints"
				required
			/>

			<PasswordStrengthMeter value={strength.score} level={strength.level} hints={validation.hints} />

			<input
				type="password"
				placeholder="Confirmar contraseña"
				value={confirmPassword}
				onChange={e => setConfirmPassword(e.target.value)}
				className="w-full mb-2 p-2 border rounded"
				required
			/>

			<button
				type="submit"
				className="w-full bg-blue-600 text-white p-2 rounded disabled:opacity-60"
				disabled={loading || !validation.ok || password !== confirmPassword || locked}
			>
				{loading ? 'Creando...' : locked ? `Espera ${(Math.ceil(remainingMs / 1000))}s` : 'Crear Contraseña'}
			</button>
		</form>
	);
};

export default CreatePassword;