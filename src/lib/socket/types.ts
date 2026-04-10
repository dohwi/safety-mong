export type SessionPhase = "waiting" | "active" | "intermission" | "completed" | "analysis" | "closed";

export interface QuestionBroadcast {
  index: number;
  text: string;
  options: string[];
  startedAt: number;
  durationMs: number;
}

export interface QuestionHostBroadcast {
  index: number;
  startedAt: number;
  durationMs: number;
}

export interface AnswerFeedback {
  isCorrect: boolean;
  correctIndex: number;
  explanation: string;
}

export interface QuestionStats {
  questionIndex: number;
  totalParticipants: number;
  responseCount: number;
  correctCount: number;
  optionDistribution: number[];
}

export interface LiveParticipant {
  id: number;
  nickname: string;
  hasAnswered: boolean;
}

export interface ClientToServerEvents {
  "session:join": (data: { sessionId: number; nickname: string; reconnectToken?: string }) => void;
  "session:host": (data: { sessionId: number }) => void;
  "answer:submit": (data: { sessionId: number; questionIndex: number; selectedIndex: number; submittedAt: number }) => void;
  "session:start": (data: { sessionId: number }) => void;
  "session:skip": (data: { sessionId: number }) => void;
  "session:end": (data: { sessionId: number }) => void;
}

export interface ServerToClientEvents {
  "session:joined": (data: { participantId: number; nickname: string; reconnectToken: string }) => void;
  "session:error": (data: { message: string }) => void;
  "participant:joined": (data: { nickname: string; participantCount: number }) => void;
  "question:start": (data: QuestionBroadcast) => void;
  "answer:feedback": (data: AnswerFeedback) => void;
  "answer:count": (data: { questionIndex: number; responseCount: number }) => void;
  "question:end": (data: { questionIndex: number; correctIndex: number; explanation: string }) => void;
  "question:stats": (data: QuestionStats) => void;
  "session:complete": (data: { sessionId: number }) => void;
  "session:state": (data: { phase: SessionPhase; currentQuestionIndex: number; participants: LiveParticipant[] }) => void;
}
