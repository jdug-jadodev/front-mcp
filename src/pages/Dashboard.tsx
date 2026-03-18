import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import { getUser, clearAuth, getToken } from '../lib/api';
import { authService } from '../services/authService';

const Dashboard = () => {
	const navigate = useNavigate();
	const user = getUser();
	const [showWelcome, setShowWelcome] = useState(true);
	const [isLoggingOut, setIsLoggingOut] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => setShowWelcome(false), 5000);
		return () => clearTimeout(timer);
	}, []);

	// Si hay un oauth_request pendiente, hacer el callback y redirigir a VS Code
	useEffect(() => {
		async function handleOauthCallback() {
			const oauthRequest = sessionStorage.getItem('oauth_request');
			const token = getToken();
			if (!oauthRequest || !token) return;
			try {
				const res = await authService.oauthCallback(oauthRequest, token);
				sessionStorage.removeItem('oauth_request');
				const r = res as { status?: string; redirectUrl?: string };
				if (r.status === 'success' && r.redirectUrl) {
					// Abrir en nueva pestaña para no salir del dashboard
					window.open(r.redirectUrl, '_blank');
				}
				// Si falla o no hay redirectUrl, quedarse en el dashboard
			} catch (err) {
				console.error('OAuth callback error:', err);
				sessionStorage.removeItem('oauth_request');
				// Error de red: quedarse en el dashboard
			}
		}
		handleOauthCallback();
	}, []);

	/**
	 * Ejecutar promesa con timeout
	 * Evita que el logout se bloquee indefinidamente
	 */
	function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
		return Promise.race([
			promise,
			new Promise<T>((_, reject) =>
				setTimeout(() => reject(new Error('Timeout')), timeoutMs)
			)
		]);
	}

	/**
	 * Logout completo: revoca tokens en AMBOS sistemas
	 * 1. Backend de Login (Loggin-MCP) - revoca JWT
	 * 2. MCP Server - revoca access_token OAuth
	 * 
	 * Al completar, VSCode pierde acceso al MCP inmediatamente.
	 */
	const handleLogout = async () => {
		setIsLoggingOut(true);
		
		console.log('🚪 ===== INICIANDO LOGOUT COMPLETO =====');
		
		// 1. Obtener todos los tokens almacenados
		const loginToken = localStorage.getItem('authToken');
		const mcpAccessToken = localStorage.getItem('mcp_access_token');
		const mcpRefreshToken = localStorage.getItem('mcp_refresh_token');
		
		let loginRevoked = false;
		let mcpRevoked = false;
		
		// 2. Revocar JWT del Backend de Login
		// 2. Intentar revocación server-side en backend (requiere JWT válido)
		if (loginToken) {
			try {
				console.log('📡 Intentando revocación MCP server-side (POST /oauth/revoke)');
				type RevokeResult = { status: 'success' } | { status: 'error'; message: string };
				const srvRes = (await withTimeout(authService.revokeMCPServerSide(), 5000).catch(err => ({ status: 'error', message: String(err) } as { status: 'error'; message: string }))) as RevokeResult;
				if (srvRes.status === 'success') {
					console.log('✅ Revocación MCP realizada server-side');
					mcpRevoked = true;
				} else {
					console.warn('⚠️ Revocación server-side falló o no disponible:', srvRes.message);
				}
			} catch (err) {
				console.warn('⚠️ Error al solicitar revocación server-side:', err);
			}
		} else {
			console.log('ℹ️ No hay JWT disponible para solicitar revocación server-side');
		}

		// 3. Si la revocación server-side no se realizó y hay tokens en localStorage, intentar revocación cliente-side
		if (!mcpRevoked) {
			if (mcpAccessToken) {
				try {
					// 3.1. Revocar refresh_token primero (más importante para seguridad)
					if (mcpRefreshToken) {
						console.log('📡 Paso fallback: Revocando refresh_token de MCP (client-side)...');
						await withTimeout(
							authService.revokeMCPRefreshToken(mcpRefreshToken, mcpAccessToken),
							5000
						).catch(err => console.warn('⚠️ Error revocando refresh_token (fallback):', err));
					}
					// 3.2. Revocar access_token
					console.log('📡 Paso fallback: Revocando access_token de MCP (client-side)...');
					const result = await withTimeout(
						authService.revokeMCPToken(mcpAccessToken),
						5000
					);
					if (result.status === 'success') {
						console.log('✅ Access token de MCP revocado correctamente (fallback)');
						mcpRevoked = true;
					} else {
						console.warn('⚠️ No se pudo revocar access_token de MCP (fallback):', result.message);
					}
				} catch (error) {
					console.error('❌ Error/Timeout revocando tokens de MCP (fallback):', error);
				}
			} else {
				console.log('ℹ️ No hay access_token de MCP para revocar (fallback)');
			}
		}
		
		// 4. Revocar JWT del Backend de Login (hacerlo después de las revocaciones que requieren JWT)
		if (loginToken) {
			try {
				console.log('📡 Paso final: Revocando JWT en Backend de Login...');
				const result = await withTimeout(
					authService.logout(loginToken),
					5000 // 5 segundos de timeout
				);
				
				if (result.status === 'success') {
					console.log('✅ JWT revocado correctamente');
					loginRevoked = true;
				} else {
					console.warn('⚠️ No se pudo revocar JWT:', result.message);
				}
			} catch (error) {
				console.error('❌ Error/Timeout revocando JWT:', error);
				// Continuar con el logout aunque falle
			}
		} else {
			console.log('ℹ️ No hay JWT del Backend de Login para revocar');
		}
		
		// 4. Limpiar TODOS los datos del localStorage
		console.log('🧹 Limpiando almacenamiento local...');
		localStorage.removeItem('authToken');
		localStorage.removeItem('token_expires_at');
		localStorage.removeItem('user');
		localStorage.removeItem('mcp_access_token');
		localStorage.removeItem('mcp_refresh_token');
		localStorage.removeItem('mcp_token_expires_at');
		sessionStorage.removeItem('oauth_request');
		
		// También limpiar memoria (clearAuth de api.ts)
		clearAuth();
		
		// 5. Log del resultado
		if (loginRevoked && mcpRevoked) {
			console.log('✅ ===== LOGOUT COMPLETO EXITOSO =====');
			console.log('   JWT revocado: ✓');
			console.log('   MCP token revocado: ✓');
			console.log('   VSCode perderá acceso al MCP');
		} else if (loginRevoked || mcpRevoked) {
			console.log('🔶 ===== LOGOUT PARCIAL =====');
			console.log(`   JWT revocado: ${loginRevoked ? '✓' : '✗'}`);
			console.log(`   MCP token revocado: ${mcpRevoked ? '✓' : '✗'}`);
		} else {
			console.log('⚠️ ===== LOGOUT LOCAL SOLAMENTE =====');
			console.log('   No se pudieron revocar tokens remotos');
			console.log('   Tokens expirarán naturalmente');
		}
		
		setIsLoggingOut(false);
		
		// 6. Redirigir a login
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
						<Button 
							variant="ghost" 
							onClick={handleLogout}
							disabled={isLoggingOut}
						>
							{isLoggingOut ? (
								<>
									{/* Spinner SVG */}
									<svg className="animate-spin h-5 w-5 mr-2 inline-block" viewBox="0 0 24 24">
										<circle 
											className="opacity-25" 
											cx="12" 
											cy="12" 
											r="10" 
											stroke="currentColor" 
											strokeWidth="4" 
											fill="none" 
										/>
										<path 
											className="opacity-75" 
											fill="currentColor" 
											d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
										/>
									</svg>
									Cerrando sesión...
								</>
							) : (
								'Cerrar Sesión'
							)}
						</Button>
					</div>
				</Card>
			</div>
		</div>
	);
};

export default Dashboard;