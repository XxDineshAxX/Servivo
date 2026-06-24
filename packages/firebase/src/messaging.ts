import {
  getFirestore,
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
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

/** Get or create a conversation between a consumer and a pro. Returns the conversationId. */
export async function getOrCreateConversation(
  consumerId: string,
  proId: string,
  consumerName: string,
  proName: string,
): Promise<string> {
  const id = makeConversationId(consumerId, proId);
  const ref = doc(conversationsRef, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    const convo: Omit<Conversation, 'id'> = {
      consumerId,
      proId,
      consumerName,
      proName,
      lastMessage: '',
      lastAt: Date.now(),
      participantIds: [consumerId, proId],
    };
    await setDoc(ref, { id, ...convo });
  }
  return id;
}

/** Send a message to a conversation. */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  text: string,
): Promise<void> {
  const trimmed = text.trim();
  const messagesRef = collection(db, 'conversations', conversationId, 'messages');
  const msg: Omit<Message, 'id'> = {
    conversationId,
    senderId,
    text: trimmed,
    createdAt: Date.now(),
  };
  // Add the message first
  await addDoc(messagesRef, msg);
  // Update conversation preview — use setDoc with merge so it works even if the
  // conversation doc was not yet created (race condition on first message)
  await setDoc(
    doc(conversationsRef, conversationId),
    { lastMessage: trimmed, lastAt: Date.now() },
    { merge: true },
  );
}

/** Subscribe to all conversations a user participates in. */
export function subscribeConversations(
  userId: string,
  callback: (conversations: Conversation[]) => void,
): Unsubscribe {
  // array-contains filter, sorted client-side to avoid composite index
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
      callback([]);
    },
  );
}

/** Subscribe to messages in a specific conversation (oldest first, last 200). */
export function subscribeMessages(
  conversationId: string,
  callback: (messages: Message[]) => void,
): Unsubscribe {
  const messagesRef = collection(db, 'conversations', conversationId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'asc'), limit(200));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Message))),
    (err) => {
      console.error('subscribeMessages error:', err);
      callback([]);
    },
  );
}

/** Expose the ID formula so callers can pre-compute it without a Firestore round-trip. */
export { makeConversationId };
