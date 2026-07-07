export type Mode = "login" | "student" | "teacher";

export interface StudentProfile {
  userName: string;
}

export interface StudentResponse {
  id?: string;
  questionId: number;
  userName: string;
  selectedChoice: string;
  isCorrect: boolean;
  timestamp: any;
}

export interface DiscussionComment {
  id?: string;
  questionId: number;
  userName: string;
  text: string;
  timestamp: any;
}
