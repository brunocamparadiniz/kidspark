import * as Haptics from 'expo-haptics';

export function lightImpact(): void {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Haptics unavailable (e.g. simulator)
  }
}

export function mediumImpact(): void {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {
    // Haptics unavailable
  }
}

export function successNotification(): void {
  try {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // Haptics unavailable
  }
}
