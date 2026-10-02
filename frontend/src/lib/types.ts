export interface User {
  id: string;
  email?: string;
  handle: string;
  displayName: string;
  avatarColor: string;
  bio?: string;
  pronouns?: string;
  status?: string;
  isOnline: boolean;
  theme?: string;
  createdAt?: string;
  role?: string;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  sender: { id: string; displayName: string; avatarColor: string };
  directChannelId?: string;
  channelId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DirectChannel {
  id: string;
  otherUser: User;
  lastMessage: Message | null;
}

export interface Channel {
  id: string;
  name: string;
}

export interface Space {
  id: string;
  name: string;
  description: string;
  emoji: string;
  role: string;
  ownerId: string;
  channels: Channel[];
  members: (User & { role: string })[];
}

export interface DiscoverSpace {
  id: string;
  name: string;
  description: string;
  emoji: string;
  _count: { members: number };
}
