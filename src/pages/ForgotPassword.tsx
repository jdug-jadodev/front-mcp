import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

const ForgotPassword = () => {
	const [email, setEmail] = useState('');
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState('');
	const navigate = useNavigate();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setMessage('');
		try {
			await authService.forgotPassword(email);
			setMessage('Si el email existe, recibirás instrucciones para restablecer tu contraseña');
			setTimeout(() => navigate('/login'), 3000);
		} catch {
			setMessage('Error de conexión');
		} finally {
			setLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="max-w-sm mx-auto p-4 bg-white rounded shadow">
			<h1 className="text-xl mb-4">Recuperar Contraseña</h1>
			{message && <div className="text-green-700 mb-2">{message}</div>}
			<input
				type="email"
				placeholder="Email"
				value={email}
				onChange={e => setEmail(e.target.value)}
				className="w-full mb-2 p-2 border rounded"
				required
			/>
			<button type="submit" className="w-full bg-blue-600 text-white p-2 rounded" disabled={loading}>
				{loading ? 'Enviando...' : 'Enviar instrucciones'}
			</button>
			<div className="mt-2 text-center">
				<a href="/login" className="text-blue-600 text-sm">Volver al login</a>
			</div>
		</form>
	);
};

export default ForgotPassword;