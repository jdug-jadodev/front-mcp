import React, { useState } from 'react';
import { authService } from '../services/authService';
import { getToken } from '../lib/api';

const AdminUsers = () => {
	const [email, setEmail] = useState('');
	const [message, setMessage] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setMessage('');
		setError('');
		setLoading(true);
		const token = getToken();
		try {
			const result = await authService.registerEmail(email, token || '');
			if (result.status === 'success') {
				setMessage(`Usuario ${email} registrado. Se envió email de bienvenida.`);
			} else {
				const err = result as { code?: string; message?: string };
				if (err.code === 'EMAIL_ALREADY_EXISTS') {
					setError('Este email ya está registrado');
				} else if (err.code === 'FORBIDDEN') {
					setError('No tienes permisos de administrador');
				} else {
					setError(err.message || 'Error desconocido');
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
			<h1 className="text-xl mb-4">Registrar Usuario (Admin)</h1>
			{message && <div className="text-green-700 mb-2">{message}</div>}
			{error && <div className="text-red-600 mb-2">{error}</div>}
			<input
				type="email"
				placeholder="Email del nuevo usuario"
				value={email}
				onChange={e => setEmail(e.target.value)}
				className="w-full mb-2 p-2 border rounded"
				required
			/>
			<button type="submit" className="w-full bg-blue-600 text-white p-2 rounded" disabled={loading}>
				{loading ? 'Registrando...' : 'Registrar Usuario'}
			</button>
		</form>
	);
};

export default AdminUsers;