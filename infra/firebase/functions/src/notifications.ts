import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

const db = admin.firestore();
const messaging = admin.messaging();

/**
 * Cloud Function: fires whenever a booking document is CREATED.
 *
 * Looks up the target pro's FCM token in Firestore and sends a push
 * notification alerting them to the new booking request.
 */
export const onNewBooking = functions.firestore
  .document('bookings/{bookingId}')
  .onCreate(async (snap, context) => {
    const booking = snap.data();
    if (!booking) return;

    const { bookingId } = context.params;
    const { proId, consumerName, serviceType, distanceKm } = booking;

    // Fetch the pro's profile to get their FCM token
    const proSnap = await db.collection('users').doc(proId).get();
    if (!proSnap.exists) {
      functions.logger.warn(`Pro ${proId} not found — skipping notification`);
      return;
    }

    const pro = proSnap.data()!;
    const fcmToken: string | undefined = pro.fcmToken;

    if (!fcmToken) {
      functions.logger.info(`Pro ${proId} has no FCM token — skipping notification`);
      return;
    }

    const message: admin.messaging.Message = {
      token: fcmToken,
      notification: {
        title: '🔔 New Booking Request',
        body: `${consumerName} needs ${serviceType} — ${Number(distanceKm).toFixed(1)} km away`,
      },
      data: {
        bookingId,
        type: 'NEW_BOOKING',
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'bookings',
          sound: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: '🔔 New Booking Request',
              body: `${consumerName} needs ${serviceType} — ${Number(distanceKm).toFixed(1)} km away`,
            },
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    try {
      const response = await messaging.send(message);
      functions.logger.info(`FCM sent to pro ${proId}:`, response);
    } catch (err) {
      functions.logger.error(`FCM send failed for pro ${proId}:`, err);
    }
  });

/**
 * Cloud Function: fires when a booking status changes to 'accepted' or 'rejected'.
 * Notifies the consumer of the pro's decision.
 */
export const onBookingStatusChange = functions.firestore
  .document('bookings/{bookingId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    if (before.status === after.status) return;
    if (!['accepted', 'rejected'].includes(after.status)) return;

    const { consumerId, proName, serviceType } = after;
    const { bookingId } = context.params;

    const consumerSnap = await db.collection('users').doc(consumerId).get();
    if (!consumerSnap.exists) return;

    const consumer = consumerSnap.data()!;
    const fcmToken: string | undefined = consumer.fcmToken;
    if (!fcmToken) return;

    const accepted = after.status === 'accepted';

    const message: admin.messaging.Message = {
      token: fcmToken,
      notification: {
        title: accepted ? '✅ Booking Accepted!' : '❌ Booking Declined',
        body: accepted
          ? `${proName} accepted your ${serviceType} request and is on the way!`
          : `${proName} is unavailable. Try booking another pro.`,
      },
      data: {
        bookingId,
        type: 'BOOKING_STATUS_CHANGE',
        status: after.status,
      },
    };

    try {
      await messaging.send(message);
    } catch (err) {
      functions.logger.error('Consumer notification failed:', err);
    }
  });
