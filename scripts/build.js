const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Obtener argumentos de línea de comandos
const args = process.argv.slice(2);
const profile = args[0] || 'preview'; // Por defecto "preview" si no se especifica
const platform = args[1] || 'all'; // Por defecto construir para ambas plataformas

console.log(`Iniciando build para perfil: ${profile}, plataforma: ${platform}`);

// Validar argumentos
if (!['development', 'preview', 'production'].includes(profile)) {
  console.error(
    'Error: El perfil debe ser "development", "preview" o "production"'
  );
  process.exit(1);
}

if (!['ios', 'android', 'all'].includes(platform)) {
  console.error('Error: La plataforma debe ser "ios", "android" o "all"');
  process.exit(1);
}

try {
  // Verificar la configuración necesaria
  console.log('Verificando configuración...');

  // Verificar EAS
  try {
    execSync('npx eas-cli --version', { stdio: 'inherit' });
  } catch (error) {
    console.log('Instalando EAS CLI...');
    execSync('npm install -g eas-cli', { stdio: 'inherit' });
  }

  // Construir la aplicación
  console.log(`\nIniciando construcción para ${platform}...`);

  // Comando para construir
  const buildCommand =
    platform === 'all'
      ? `npx eas build --platform all --profile ${profile}`
      : `npx eas build --platform ${platform} --profile ${profile}`;

  console.log(`Ejecutando: ${buildCommand}`);
  execSync(buildCommand, { stdio: 'inherit' });

  // Si es producción, preparar también una actualización OTA
  if (profile === 'production') {
    console.log('\nPublicando actualización OTA...');
    execSync(`npx eas update --channel ${profile}`, { stdio: 'inherit' });
  }

  console.log('\n✅ Construcción completada exitosamente!');
} catch (error) {
  console.error('\n❌ Error durante la construcción:', error);
  process.exit(1);
}
