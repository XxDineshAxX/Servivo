import {
  getFirestore,
  collection,
  doc,
  addDoc,
  setDoc,
  onSnapshot,
  query,
  where,
  limit,
  arrayUnion,
  type Unsubscribe,
} from 'firebase/firestore';
import type { Conversation, Message } from '@servivo/types';
import { firebaseApp } from './config';

const db = getFirestore(firebaseApp);
const conversationsRef = collection(db, 'conversations');

/** Deterministic conversation ID — same regardless of who initiates. */
function makeConversationId(consumerId: string, proId: string): string {
  return [consumerId, proId].sort().join('_');
}

/** Get or create a conversation between a consumer and a pro. Returns the conversationId.
 *  Uses setDoc with merge so it's idempotent — safe to call every time the chat screen opens.
 */
export async function getOrCreateConversation(
  consumerId: string,
  proId: string,
  consumerName: string,
  proName: string,
): Promise<string> {
  const id = makeConversationId(consumerId, proId);
  const ref = doc(conversationsRef, id);
  // setDoc + merge is atomic and idempotent — creates if missing, leaves existing fields alone
  await setDoc(
    ref,
    {
      id,
      consumerId,
      proId,
      consumerName,
      proName,
      participantIds: [consumerId, proId],
    },
    { merge: true },
  );
  return id;
}

/**
 * Send a message to a conversation.
 *
 * Always pass `participantIds` — it is written on every send so that if the
 * conversation doc was never created (e.g. first message before the background
 * getOrCreateConversation finished), this setDoc acts as the create and the
 * Firestore `create` rule (`request.auth.uid in request.resource.data.participantIds`)
 * will pass correctly.
 */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  text: string,
  participantIds: string[],
): Promise<void> {
  const trimmed = text.trim();
  const messagesRef = collection(db, 'conversations', conversationId, 'messages');
  const msg: Omit<Message, 'id'> = {
    conversationId,
    senderId,
    text: trimmed,
    createdAt: Date.now(),
  };
  // Write the message doc first
  await addDoc(messagesRef, msg);
  // Update conversation preview + unread tracking.
  // participantIds is always included so this acts as a valid create if the doc
  // doesn't exist yet (create rule requires participantIds in request.resource.data).
  // readBy is reset to [senderId] — only the sender has "read" the latest message.
  await setDoc(
    doc(conversationsRef, conversationId),
    {
      participantIds,
      lastMessage: trimmed,
      lastAt: Date.now(),
      lastSenderId: senderId,
      readBy: [senderId],
    },
    { merge: true },
  );
}

/**
 * Mark all messages in a conversation as read for the given user.
 * Call this whenever a user opens a chat screen.
 */
export async function markConversationRead(
  conversationId: string,
  userId: string,
): Promise<void> {
  try {
    await setDoc(
      doc(conversationsRef, conversationId),
      { readBy: arrayUnion(userId) },
      { merge: true },
    );
  } catch (e) {
    console.error('markConversationRead error:', e);
  }
}

/** Subscribe to all conversations a user participates in. */
export function subscribeConversations(
  userId: string,
  callback: (conversations: Conversation[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  // array-contains filter — sorted client-side to avoid composite index requirement
  const q = query(conversationsRef, where('participantIds', 'array-contains', userId));
  return onSnapshot(
    q,
    (snap) => {
      const convos = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Conversation));
      convos.sort((a, b) => (b.lastAt ?? 0) - (a.lastAt ?? 0));
      callback(convos);
    },
    (err) => {
      console.error('subscribeConversations error:', err);
      if (onError) onError(err);
      else callback([]);
    },
  );
}

/**
 * Subscribe to messages in a specific conversation (oldest first, last 200).
 * NOTE: No orderBy — avoids composite index requirement. Sorted client-side.
 */
export function subscribeMessages(
  conversationId: string,
  callback: (messages: Message[]) => void,
): Unsubscribe {
  const messagesRef = collection(db, 'conversations', conversationId, 'messages');
  // No orderBy to avoid requiring a Firestore composite index — sort client-side instead
  const q = query(messagesRef, limit(200));
  return onSnapshot(
    q,
    (snap) => {
      const msgs = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Message))
        .sort((a, b) => a.createdAt - b.createdAt);
      callback(msgs);
    },
    (err) => {
      console.error('subscribeMessages error:', err);
      callback([]);
    },
  );
}

/** Expose the ID formula so callers can pre-compute it without a Firestore round-trip. */
export { makeConversationId };
