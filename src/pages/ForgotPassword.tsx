import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
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
		<div className="min-h-screen bg-gradient-animated flex items-center justify-center px-4 py-12 relative overflow-hidden">
			{/* Decorative elements */}
			<div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse" />
			<div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 animate-pulse" />
			
			<Card className="relative z-10">
				<form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
					{/* Header */}
					<div className="text-center mb-4">
						<h1 className="text-3xl font-bold gradient-text mb-2">
							Recuperar Contraseña
						</h1>
						<p className="text-slate-400 text-sm">
							Ingresa tu email para recibir instrucciones
						</p>
					</div>

					{/* Success message */}
					{message && (
						<div className="glass bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-xl text-sm">
							{message}
						</div>
					)}

					{/* Email input */}
					<Input
						id="forgot-email"
						label="Correo electrónico"
						value={email}
						onChange={setEmail}
						type="email"
						placeholder="tu@email.com"
						icon={
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
							</svg>
						}
					/>

					{/* Submit button */}
					<Button type="submit" loading={loading} className="w-full">
						Enviar instrucciones
					</Button>

					{/* Back to login */}
					<div className="text-center">
						<a
							href="/login"
							className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors duration-200 hover:underline decoration-cyan-400/50 underline-offset-2"
						>
							Volver al login
						</a>
					</div>
				</form>
			</Card>
		</div>
	);
};

export default ForgotPassword;