/**
 * _logoutCallback es una función que se llamará para cerrar la sesión.
 * Inicialmente, es una función vacía que advierte si no se ha configurado.
 */
let _logoutCallback: () => Promise<void> = async () => {
  console.warn(
    'La función de logout no ha sido inicializada. Asegúrate de que AuthProvider llame a setLogoutCallback.'
  );
};

/**
 * setLogoutCallback permite que AuthContext (o donde tengas tu lógica de logout)
 * registre la función real que debe ejecutarse para cerrar la sesión.
 * @param logoutFn La función que efectivamente cierra la sesión en la app.
 */
export const setLogoutCallback = (logoutFn: () => Promise<void>) => {
  _logoutCallback = logoutFn;
};

/**
 * triggerLogout es llamada por el interceptor de Axios cuando se detecta
 * un error 401 (token inválido/expirado) para iniciar el cierre de sesión.
 */
export const triggerLogout = async () => {
  console.log('Cierre de sesión automático iniciado por triggerLogout.');
  await _logoutCallback();
};
