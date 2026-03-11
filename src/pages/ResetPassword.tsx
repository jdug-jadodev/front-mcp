import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/authService';

const ResetPassword = () => {
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const token = searchParams.get('token');

	const validatePassword = () => {
		if (newPassword.length < 8) return 'Mínimo 8 caracteres';
		if (!/[A-Z]/.test(newPassword)) return 'Debe tener una mayúscula';
		if (!/[a-z]/.test(newPassword)) return 'Debe tener una minúscula';
		if (!/[0-9]/.test(newPassword)) return 'Debe tener un número';
		if (newPassword !== confirmPassword) return 'Las contraseñas no coinciden';
		return null;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		if (!token) {
			setError('Token inválido o expirado');
			navigate('/forgot-password');
			return;
		}
		const validationError = validatePassword();
		if (validationError) {
			setError(validationError);
			return;
		}
		setLoading(true);
		try {
			const result = await authService.resetPassword(token, newPassword);
			if (result.status === 'success') {
				alert('Contraseña actualizada exitosamente');
				navigate('/login');
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
		<form onSubmit={handleSubmit} className="max-w-sm mx-auto p-4 bg-white rounded shadow">
			<h1 className="text-xl mb-4">Restablecer Contraseña</h1>
			<ul className="text-xs mb-2 text-gray-600">
				<li>Mínimo 8 caracteres</li>
				<li>Al menos una mayúscula</li>
				<li>Al menos una minúscula</li>
				<li>Al menos un número</li>
			</ul>
			{error && <div className="text-red-600 mb-2">{error}</div>}
			<input
				type="password"
				placeholder="Nueva contraseña"
				value={newPassword}
				onChange={e => setNewPassword(e.target.value)}
				className="w-full mb-2 p-2 border rounded"
				required
			/>
			<input
				type="password"
				placeholder="Confirmar contraseña"
				value={confirmPassword}
				onChange={e => setConfirmPassword(e.target.value)}
				className="w-full mb-2 p-2 border rounded"
				required
			/>
			<button type="submit" className="w-full bg-blue-600 text-white p-2 rounded" disabled={loading}>
				{loading ? 'Cambiando...' : 'Cambiar Contraseña'}
			</button>
		</form>
	);
};

export default ResetPassword;