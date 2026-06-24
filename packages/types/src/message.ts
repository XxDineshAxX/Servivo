export interface Conversation {
  id: string;
  consumerId: string;
  proId: string;
  consumerName: string;
  proName: string;
  lastMessage?: string;
  lastAt?: number;
  participantIds: string[];
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: number;
}
