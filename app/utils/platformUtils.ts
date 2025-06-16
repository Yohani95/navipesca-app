import { Platform, Alert } from 'react-native';

/**
 * Muestra una alerta que funciona tanto en web como en móvil
 */
export function showAlert(
  title: string,
  message: string,
  onConfirm?: () => void
): void {
  if (Platform.OS === 'web') {
    window.alert(`${title}: ${message}`);
    if (onConfirm) onConfirm();
  } else {
    Alert.alert(
      title,
      message,
      onConfirm ? [{ text: 'OK', onPress: onConfirm }] : [{ text: 'OK' }]
    );
  }
}

/**
 * Muestra un diálogo de confirmación que funciona tanto en web como en móvil
 */
export function showConfirm(
  title: string,
  message: string,
  onConfirm: () => void,
  onCancel?: () => void
): void {
  if (Platform.OS === 'web') {
    const result = window.confirm(`${title}: ${message}`);
    if (result) {
      onConfirm();
    } else if (onCancel) {
      onCancel();
    }
  } else {
    Alert.alert(title, message, [
      {
        text: 'Cancelar',
        style: 'cancel',
        onPress: onCancel,
      },
      {
        text: 'Aceptar',
        onPress: onConfirm,
      },
    ]);
  }
}
