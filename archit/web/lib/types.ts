export interface Book {
  id: string;
  title: string;
  thumbnail: string;
  tags: string[];
  index:string
}

export type MessageRole = "user" | "assistant";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  selectedBookIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatRequest {
  messages: { role: MessageRole; content: string }[];
  selectedBookIds: string[];
}
