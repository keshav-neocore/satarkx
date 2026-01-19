export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) {
    console.log("This browser does not support desktop notification");
    return false;
  }
  
  if (Notification.permission === "granted") {
    return true;
  }
  
  const permission = await Notification.requestPermission();
  return permission === "granted";
};

export const sendNotification = (title: string, options?: NotificationOptions) => {
  if (!("Notification" in window)) return;

  if (Notification.permission === "granted") {
    try {
        const n = new Notification(title, {
            icon: 'https://cdn-icons-png.flaticon.com/512/3119/3119338.png', // Generic Shield Icon
            badge: 'https://cdn-icons-png.flaticon.com/512/3119/3119338.png',
            vibrate: [200, 100, 200], // Vibration pattern for mobile
            ...options
        } as any);
        n.onclick = () => {
            window.focus();
            n.close();
        };
    } catch (e) {
        console.error("Notification error:", e);
    }
  }
};

export const sendCriticalAlert = (hazardTitle: string, description?: string) => {
    sendNotification(`⚠️ Critical Alert: ${hazardTitle}`, {
        body: description || "Stay clear of the affected area.",
        tag: 'critical-hazard',
        requireInteraction: true, // Keeps notification until user interacts
        icon: 'https://cdn-icons-png.flaticon.com/512/564/564619.png' // Alert Icon
    });
};

export const sendRewardNotification = (points: number) => {
    sendNotification(`🎉 Report Verified!`, {
        body: `You earned ${points} EcoPoints and unlocked new Scratch Cards!`,
        tag: 'reward-unlock',
        icon: 'https://cdn-icons-png.flaticon.com/512/3119/3119338.png'
    });
};