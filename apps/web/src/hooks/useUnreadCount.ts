import { useEffect, useState } from 'react';
import type { Conversation } from '@servivo/types';
import { subscribeConversations } from '@servivo/firebase';

/**
 * Returns the number of conversations where the current user has unread messages.
 * A conversation is "unread" when someone else sent the last message and the
 * current user hasn't opened the chat since (i.e. their uid isn't in `readBy`).
 */
export function useUnreadCount(userId: string | null): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!userId) return;
    return subscribeConversations(userId, (conversations: Conversation[]) => {
      const unread = conversations.filter(
        (c: Conversation) =>
          c.lastSenderId &&
          c.lastSenderId !== userId &&
          !(c.readBy ?? []).includes(userId),
      ).length;
      setCount(unread);
    });
  }, [userId]);

  return count;
}
