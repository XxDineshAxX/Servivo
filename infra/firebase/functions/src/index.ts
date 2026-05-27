import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

admin.initializeApp();

export { onNewBooking, onBookingStatusChange } from './notifications';
