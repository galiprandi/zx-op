#!/usr/bin/env node

// Script de desarrollo que genera certificados SSL automáticamente
// y luego inicia el servidor Vite

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log(
	"🚀 Iniciando servidor de desarrollo con generación automática de certificados...\n",
);

// Función para generar certificados SSL
function generateCertificates() {
	const certsDir = path.join(__dirname, "certs");

	// Crear directorio de certificados si no existe
	if (!fs.existsSync(certsDir)) {
		fs.mkdirSync(certsDir, { recursive: true });
	}

	console.log("🔐 Generando certificados SSL auto-firmados...");

	// Crear archivo de configuración para el certificado
	const configContent = `
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
C = CL
ST = RM
L = Santiago
O = Zona Xtreme
OU = Development
CN = localhost

[v3_req]
basicConstraints = CA:FALSE
keyUsage = digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth, clientAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = *.local
IP.1 = 127.0.0.1
IP.2 = 192.168.68.58
IP.3 = 192.168.1.1
IP.4 = 10.0.0.1
IP.5 = 172.16.0.1
`;

	const configPath = path.join(certsDir, "cert.conf");
	fs.writeFileSync(configPath, configContent);

	try {
		// Generar el certificado
		execSync(
			`openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes -config cert.conf -extensions v3_req`,
			{
				cwd: certsDir,
				stdio: "pipe",
			},
		);

		console.log("✅ Certificados generados exitosamente");

		// Limpiar archivo de configuración
		fs.unlinkSync(configPath);

		return true;
	} catch (error) {
		console.error("❌ Error generando certificados:", error.message);
		return false;
	}
}

// Generar certificados siempre al iniciar
console.log("📋 Generando certificados frescos para esta sesión...");
if (generateCertificates()) {
	console.log("\n🌐 URLs de acceso:");
	console.log("   Local:     https://localhost:3000/");
	console.log("   Móviles:   https://192.168.68.58:3000/");
	console.log('\n⚠️  En móviles verás "Tu conexión no es privada" - es NORMAL');
	console.log(
		'   Chrome: "Avanzado" → "Continuar a 192.168.68.58 (no seguro)"',
	);
	console.log('   Safari: "Mostrar detalles" → "Visitar este sitio web"');
	console.log("\n🚀 Iniciando servidor Vite...\n");

	// Importar y ejecutar Vite
	import("vite")
		.then(({ createServer }) => {
			createServer({
				configFile: path.join(__dirname, "vite.config.ts"),
				server: {
					port: 3000,
					host: true,
				},
			}).then((server) => {
				server.listen();
			});
		})
		.catch((error) => {
			console.error("❌ Error iniciando Vite:", error);
			process.exit(1);
		});
} else {
	console.error("❌ No se pudieron generar los certificados");
	process.exit(1);
}
