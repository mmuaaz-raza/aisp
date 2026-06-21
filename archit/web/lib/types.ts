export interface Book {
  id: string;
  title: string;
  thumbnail: string;
  tags: string[];
  index: string;
}

/** Matches backend Literal["system","user","assistant"] */
export type MessageRole = "system" | "user" | "assistant";

/** Matches backend Message (BaseModel) */
export interface Message {
  role: MessageRole;
  content: string;
  timestamp: string; // ISO string from backend
  isNew?: boolean;   // Frontend only: flag to animate typing effect
}

/** Matches backend Chat (Document) */
export interface ChatSession {
  id: string;           // MongoDB ObjectId as string
  title: string;
  messages: Message[];
  summary: string;
  token_limit: number;
  tokens_used: number;
  is_exhausted: boolean;
  created_at: string;   // ISO datetime
  updated_at: string;   // ISO datetime
  /** IDs of books selected for this chat (frontend-only, stored in session) */
  selectedBookIds: string[];
}

/** POST /api/v1/query/c */
export interface SearchRequest {
  ids: string[];        // PydanticObjectId[] — sent as strings
  query: string;
  chat_id: string;      // PydanticObjectId
  is_entire_corpus?: boolean;
  is_history?: boolean;
  tags?: string[];      // Tag-based book selection (sent instead of individual ids)
}

/** Response from /api/v1/query/c */
export interface QueryResponse {
  response: string;
}
