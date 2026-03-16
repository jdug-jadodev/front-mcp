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
		}, 3000);
		return () => clearTimeout(timer);
	}, []);

	const handleLogout = () => {
		clearAuth();
		navigate('/login');
	};

	const stats = [
		{ label: 'Sesiones Activas', value: '1', icon: '🔐', color: 'from-cyan-500 to-blue-500' },
		{ label: 'Última Actividad', value: 'Ahora', icon: '⏰', color: 'from-purple-500 to-pink-500' },
		{ label: 'Nivel de Seguridad', value: 'Alto', icon: '🛡️', color: 'from-emerald-500 to-teal-500' },
		{ label: 'Notificaciones', value: '0', icon: '🔔', color: 'from-amber-500 to-orange-500' },
	];

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

					{/* Stats Grid */}
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
						{stats.map((stat, index) => (
							<div
								key={stat.label}
								className="glass rounded-xl p-4 hover:glass-strong transition-all duration-300 hover:scale-105 cursor-pointer"
								style={{
									animationDelay: `${index * 100}ms`,
								}}
							>
								<div className="flex items-center justify-between mb-2">
									<span className="text-3xl">{stat.icon}</span>
									<div className={`w-2 h-2 rounded-full bg-linear-to-r ${stat.color}`} />
								</div>
								<p className="text-slate-400 text-xs mb-1">{stat.label}</p>
								<p className="text-white text-2xl font-bold">{stat.value}</p>
							</div>
						))}
					</div>

					{/* Quick Actions */}
					<div className="space-y-4">
						<h3 className="text-lg font-semibold text-white mb-4">
							Acciones Rápidas
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<button className="glass rounded-xl p-4 text-left hover:glass-strong transition-all duration-300 hover:scale-[1.02] group">
								<div className="flex items-center gap-3">
									<div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
										⚙️
									</div>
									<div>
										<p className="text-white font-semibold">Configuración</p>
										<p className="text-slate-400 text-sm">Personaliza tu cuenta</p>
									</div>
								</div>
							</button>

							<button className="glass rounded-xl p-4 text-left hover:glass-strong transition-all duration-300 hover:scale-[1.02] group">
								<div className="flex items-center gap-3">
									<div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
										🔒
									</div>
									<div>
										<p className="text-white font-semibold">Seguridad</p>
										<p className="text-slate-400 text-sm">Gestiona tu privacidad</p>
									</div>
								</div>
							</button>

							<button className="glass rounded-xl p-4 text-left hover:glass-strong transition-all duration-300 hover:scale-[1.02] group">
								<div className="flex items-center gap-3">
									<div className="w-12 h-12 rounded-lg bg-pink-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
										📊
									</div>
									<div>
										<p className="text-white font-semibold">Estadísticas</p>
										<p className="text-slate-400 text-sm">Ver actividad reciente</p>
									</div>
								</div>
							</button>

							<button className="glass rounded-xl p-4 text-left hover:glass-strong transition-all duration-300 hover:scale-[1.02] group">
								<div className="flex items-center gap-3">
									<div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
										💬
									</div>
									<div>
										<p className="text-white font-semibold">Soporte</p>
										<p className="text-slate-400 text-sm">Obtén ayuda</p>
									</div>
								</div>
							</button>
						</div>
					</div>
				</Card>

				{/* Activity Timeline */}
				<Card className="animate-in slide-in-from-bottom duration-1000">
					<h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
						<span className="text-2xl">📝</span>
						Actividad Reciente
					</h3>
					<div className="space-y-4">
						<div className="flex items-start gap-4 glass-strong rounded-lg p-3">
							<div className="w-10 h-10 rounded-full bg-linear-to-r from-cyan-500 to-blue-500 flex items-center justify-center shrink-0">
								✓
							</div>
							<div className="flex-1">
								<p className="text-white font-medium">Inicio de sesión exitoso</p>
								<p className="text-slate-400 text-sm">Hace unos momentos • IP: {user?.email ? '***' : 'Desconocida'}</p>
							</div>
							<span className="text-xs text-cyan-400 font-semibold">AHORA</span>
						</div>

						<div className="flex items-start gap-4 glass rounded-lg p-3 opacity-60">
							<div className="w-10 h-10 rounded-full bg-linear-to-r from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
								🔐
							</div>
							<div className="flex-1">
								<p className="text-white font-medium">Cuenta verificada</p>
								<p className="text-slate-400 text-sm">Última actualización de seguridad</p>
							</div>
							<span className="text-xs text-slate-500 font-semibold">RECIENTE</span>
						</div>
					</div>
				</Card>

				{/* Footer Info */}
				<div className="mt-8 text-center">
					<p className="text-slate-500 text-sm">
						Sistema de autenticación seguro • MCP Auth v2.0
					</p>
				</div>
			</div>
		</div>
	);
};

export default Dashboard;