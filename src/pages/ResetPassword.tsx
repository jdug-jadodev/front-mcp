import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import FormError from '../components/FormError';
import { authService } from '../services/authService';
import { useTokenFromUrl } from '../hooks/useTokenFromUrl';

const ResetPassword = () => {
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [error, setError] = useState('');
	const [fieldErrors, setFieldErrors] = useState<{ newPassword?: string; confirmPassword?: string }>({});
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();
	const token = useTokenFromUrl();

	const validatePassword = () => {
		const errs: typeof fieldErrors = {};
		if (newPassword.length < 8) errs.newPassword = 'Mínimo 8 caracteres';
		else if (!/[A-Z]/.test(newPassword)) errs.newPassword = 'Debe tener una mayúscula';
		else if (!/[a-z]/.test(newPassword)) errs.newPassword = 'Debe tener una minúscula';
		else if (!/[0-9]/.test(newPassword)) errs.newPassword = 'Debe tener un número';
		if (newPassword && confirmPassword && newPassword !== confirmPassword) errs.confirmPassword = 'Las contraseñas no coinciden';
		setFieldErrors(errs);
		return Object.keys(errs).length === 0;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		if (!token) {
			setError('Token inválido o expirado');
			navigate('/forgot-password');
			return;
		}
		if (!validatePassword()) return;
		
		setLoading(true);
		try {
			const result = await authService.resetPassword(token, newPassword);
			if (result.status === 'success') {
				navigate('/login', { state: { message: 'Contraseña actualizada exitosamente' } });
			} else {
				const err = result as { code?: string; message?: string };
				if (err.code === 'INVALID_TOKEN') {
					setError('El enlace ha expirado. Solicita uno nuevo.');
					setTimeout(() => navigate('/forgot-password'), 2000);
				} else if (err.code === 'TOKEN_ALREADY_USED') {
					setError('Este enlace ya fue utilizado');
					setTimeout(() => navigate('/login'), 2000);
				} else {
					setError(err.message ?? 'Error al restablecer la contraseña');
				}
			}
		} catch {
			setError('Error de conexión');
		} finally {
			setLoading(false);
		}
	};

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
							Restablecer Contraseña
						</h1>
						<p className="text-slate-400 text-sm mb-4">
							Ingresa tu nueva contraseña
						</p>
						<ul className="text-xs text-slate-500 text-left space-y-1">
							<li>• Mínimo 8 caracteres</li>
							<li>• Al menos una mayúscula</li>
							<li>• Al menos una minúscula</li>
							<li>• Al menos un número</li>
						</ul>
					</div>

					{/* Error message */}
					<FormError message={error} />

					{/* New password input */}
					<Input
						id="new-password"
						label="Nueva contraseña"
						value={newPassword}
						onChange={setNewPassword}
						type="password"
						error={fieldErrors.newPassword}
						placeholder="••••••••"
						showPasswordToggle
						icon={
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
							</svg>
						}
					/>

					{/* Confirm password input */}
					<Input
						id="confirm-password"
						label="Confirmar contraseña"
						value={confirmPassword}
						onChange={setConfirmPassword}
						type="password"
						error={fieldErrors.confirmPassword}
						placeholder="••••••••"
						showPasswordToggle
						icon={
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						}
					/>

					{/* Submit button */}
					<Button type="submit" loading={loading} className="w-full">
						Cambiar Contraseña
					</Button>
				</form>
			</Card>
		</div>
	);
};

export default ResetPassword;