import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import axios from 'axios';

// إعدادات فايربيس تؤخذ من بيئة Vite (متغيرات البيئة في .env)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

let app;
let messaging;

try {
    if (firebaseConfig.apiKey && firebaseConfig.projectId) {
        app = initializeApp(firebaseConfig);
        messaging = getMessaging(app);
    }
} catch (error) {
    console.warn("Failed to initialize Firebase:", error);
}

/**
 * طلب الإذن لإرسال الإشعارات وجلب توكن FCM
 */
export const requestFirebaseNotificationPermission = async () => {
    if (!messaging) return null;

    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            const currentToken = await getToken(messaging, { 
                vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY // تأكد من إضافته إذا لزم الأمر في الويب
            });
            
            if (currentToken) {
                // إرسال التوكن إلى السيرفر لحفظه
                await axios.post(route('notifications.fcm-token'), { token: currentToken });
                return currentToken;
            }
        }
        return null;
    } catch (error) {
        console.error('حدث خطأ أثناء جلب التوكن أو طلب الصلاحية:', error);
        return null;
    }
};

/**
 * استقبال الإشعارات عندما يكون المستخدم نشطاً في التطبيق (Foreground)
 */
export const onForegroundMessage = (callback) => {
    if (!messaging) return () => {};
    return onMessage(messaging, (payload) => {
        callback(payload);
    });
};
