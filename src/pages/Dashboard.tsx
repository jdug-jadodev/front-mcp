import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import { getUser, clearAuth } from '../lib/api';

const Dashboard = () => {
	const navigate = useNavigate();
	const user = getUser();
	const [showWelcome, setShowWelcome] = useState(true);

	useEffect(() => {
		// Hide welcome message after 3 seconds
		const timer = setTimeout(() => {
			setShowWelcome(false);
		}, 5000);
		return () => clearTimeout(timer);
	}, []);

	const handleLogout = () => {
		clearAuth();
		navigate('/login');
	};

	return (
		<div className="min-h-screen bg-gradient-animated flex items-center justify-center px-4 py-12 relative overflow-hidden">
			{/* Decorative elements */}
			<div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse" />
			<div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 animate-pulse" />
			<div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />

			<div className="relative z-10 w-full max-w-6xl">
				{/* Welcome Banner */}
				{showWelcome && (
					<div className="mb-8 animate-in slide-in-from-top duration-500">
						<Card className="text-center border-2 border-cyan-500/30 shadow-glow">
							<div className="flex items-center justify-center gap-3 mb-2">
								<span className="text-4xl">✨</span>
								<h1 className="text-3xl font-bold gradient-text">
									¡Bienvenido de nuevo!
								</h1>
								<span className="text-4xl">✨</span>
							</div>
							<p className="text-slate-300 text-lg">
								Inicio de sesión exitoso
							</p>
						</Card>
					</div>
				)}

				{/* Main Dashboard Card */}
				<Card className="mb-8 animate-in slide-in-from-bottom duration-700">
					<div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
						<div className="flex items-center gap-4">
							<div className="w-16 h-16 rounded-full bg-linear-to-r from-cyan-500 via-purple-500 to-pink-500 flex items-center justify-center text-3xl">
								👤
							</div>
							<div>
								<h2 className="text-2xl font-bold text-white">
									{user?.email || 'Usuario'}
								</h2>
								<p className="text-slate-400 text-sm">
									Cuenta activa • Verificado
								</p>
							</div>
						</div>
						<Button variant="ghost" onClick={handleLogout}>
							Cerrar Sesión
						</Button>
					</div>
				</Card>
			</div>
		</div>
	);
};

export default Dashboard;