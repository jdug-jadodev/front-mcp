import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { saveAuth } from '../lib/api';

const Login = () => {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setLoading(true);
		try {
			const result = await authService.login(email, password);
			if (result.status === 'success') {
				saveAuth(result.token, result.user);
				navigate('/dashboard');
			} else {
				setError(result.message || 'Credenciales incorrectas');
			}
		} catch {
			setError('Error de conexión');
		} finally {
			setLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="max-w-sm mx-auto p-4 bg-white rounded shadow">
			<h1 className="text-xl mb-4">Iniciar Sesión</h1>
			{error && <div className="text-red-600 mb-2">{error}</div>}
			<input
				type="email"
				placeholder="Email"
				value={email}
				onChange={e => setEmail(e.target.value)}
				className="w-full mb-2 p-2 border rounded"
				required
			/>
			<input
				type="password"
				placeholder="Contraseña"
				value={password}
				onChange={e => setPassword(e.target.value)}
				className="w-full mb-2 p-2 border rounded"
				required
			/>
			<button type="submit" className="w-full bg-blue-600 text-white p-2 rounded" disabled={loading}>
				{loading ? 'Cargando...' : 'Iniciar Sesión'}
			</button>
			<div className="mt-2 text-center">
				<a href="/forgot-password" className="text-blue-600 text-sm">¿Olvidaste tu contraseña?</a>
			</div>
		</form>
	);
};

export default Login;