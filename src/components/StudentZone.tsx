import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, Check, X, Users, Milestone, Award, ChevronLeft, ChevronRight, HelpCircle } from "lucide-react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Question } from "../data/questions";
import { StudentResponse, DiscussionComment } from "../types";

// Setup schema-compliant logger for Firebase failures
const handleFirestoreError = (error: any, action: string, path: string) => {
  console.error(`Firebase error during ${action} at ${path}:`, error);
  // Optional detailed custom logging can go here
};

interface StudentZoneProps {
  userName: string;
  questions: Question[];
  myAnswers: Record<number, string>;
  onAnswerSubmit: (questionId: number, choice: string, isCorrect: boolean) => void;
  allResponses: StudentResponse[];
  allComments: DiscussionComment[];
}

export default function StudentZone({
  userName,
  questions,
  myAnswers,
  onAnswerSubmit,
  allResponses,
  allComments,
}: StudentZoneProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const commentEndRef = useRef<HTMLDivElement>(null);

  const currentQuestion = questions[currentIdx];
  const hasAnswered = myAnswers[currentQuestion?.id] !== undefined;
  const mySelectedChoice = myAnswers[currentQuestion?.id];

  // Keep scroll focused on chat rooms
  useEffect(() => {
    commentEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allComments, currentIdx]);

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400 font-mono">
        表示できる問題がありません。フィルター条件を解除してください。
      </div>
    );
  }

  // Handle student clicking on a multiple choice answer
  const handleSelectChoice = async (choiceKey: string) => {
    if (hasAnswered) return; // Locked after answering

    const choiceLetter = choiceKey.trim().charAt(0); // 'ア', 'イ', 'ウ', 'エ'
    const isCorrect = choiceLetter === currentQuestion.correctChoice;

    // First notify local state to glow up the UI
    onAnswerSubmit(currentQuestion.id, choiceLetter, isCorrect);

    // Write to Firestore responses (immutably audited by security rules)
    const payload = {
      questionId: currentQuestion.id,
      userName,
      selectedChoice: choiceLetter,
      isCorrect,
      timestamp: new Date().toISOString(),
    };

    try {
      await addDoc(collection(db, "responses"), payload);
    } catch (err) {
      handleFirestoreError(err, "create", "responses");
    }
  };

  // Submit questions/comments to Discussion board
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || commentSubmitting) return;

    setCommentSubmitting(true);
    const payload = {
      questionId: currentQuestion.id,
      userName,
      text: commentText.trim(),
      timestamp: new Date().toISOString(),
    };

    try {
      await addDoc(collection(db, "comments"), payload);
      setCommentText("");
    } catch (err) {
      handleFirestoreError(err, "create", "comments");
    } finally {
      setCommentSubmitting(false);
    }
  };

  // Filter Firestore caches relative to current Question ID (In-Memory rule)
  const questionResponses = allResponses.filter((r) => r.questionId === currentQuestion.id);
  const questionComments = allComments.filter((c) => c.questionId === currentQuestion.id);

  // Math counts for choices
  const totalResponses = questionResponses.length;
  const choiceStats = { ア: 0, イ: 0, ウ: 0, エ: 0 };
  let correctCount = 0;

  questionResponses.forEach((r) => {
    const choice = r.selectedChoice as keyof typeof choiceStats;
    if (choiceStats[choice] !== undefined) {
      choiceStats[choice] += 1;
    }
    if (r.isCorrect) {
      correctCount += 1;
    }
  });

  const correctRate = totalResponses > 0 ? Math.round((correctCount / totalResponses) * 100) : 0;

  return (
    <div id="student-zone-container" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* LEFT COLUMN: QUIZ AND EXPLANATION */}
      <div className="lg:col-span-7 space-y-6">
        {/* Progress and Nav Header */}
        <div className="bg-zinc-900/40 p-4 rounded-xl border border-white/5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono px-2 py-1 rounded-md font-bold uppercase tracking-wider">
              Question {currentIdx + 1}/{questions.length}
            </span>
            <span className="text-xs text-slate-500 font-mono hidden sm:inline">
              ID: Q{currentQuestion.id}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
              disabled={currentIdx === 0}
              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-slate-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-xs font-mono font-bold text-slate-300 min-w-16 text-center">
              {currentIdx + 1} / {questions.length}
            </span>
            <button
              onClick={() => setCurrentIdx((prev) => Math.min(questions.length - 1, prev + 1))}
              disabled={currentIdx === questions.length - 1}
              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-slate-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* The Question Card */}
        <div className="bg-zinc-900/60 rounded-2xl border border-white/5 overflow-hidden shadow-2xl backdrop-blur-sm">
          {/* Section banner */}
          <div className="bg-gradient-to-r from-blue-600/10 to-indigo-600/10 p-5 border-b border-white/5 flex items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest font-bold block mb-1">
                {currentQuestion.category}
              </span>
              <h1 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <Milestone className="w-4 h-4 text-blue-500 flex-shrink-0" />
                {currentQuestion.section}
              </h1>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-[10px] font-mono text-slate-400 bg-zinc-800 border border-white/5 px-2.5 py-1 rounded-md block">
                {currentQuestion.page}
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Question Text */}
            <div className="text-slate-100 text-sm leading-relaxed whitespace-pre-wrap font-sans font-medium">
              {currentQuestion.question}
            </div>

            {/* Answer Options */}
            <div className="space-y-3">
              {currentQuestion.choices.map((choice, i) => {
                const choiceLetter = choice.trim().charAt(0); // 'ア', 'イ', 'ウ', 'エ'
                const isSelected = mySelectedChoice === choiceLetter;
                const isCorrectOption = choiceLetter === currentQuestion.correctChoice;

                let borderStyle = "border-white/5 bg-white/5 hover:bg-white/10 text-slate-300";
                let badge = null;

                if (hasAnswered) {
                  if (isCorrectOption) {
                    borderStyle = "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
                    badge = <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />;
                  } else if (isSelected) {
                    borderStyle = "border-rose-500/40 bg-rose-500/10 text-rose-300";
                    badge = <X className="w-4 h-4 text-rose-400 flex-shrink-0" />;
                  } else {
                    borderStyle = "border-white/5 bg-white/5 opacity-55 text-slate-400";
                  }
                }

                return (
                  <button
                    key={i}
                    onClick={() => handleSelectChoice(choiceLetter)}
                    disabled={hasAnswered}
                    className={`w-full text-left p-4 rounded-xl border text-xs font-semibold leading-relaxed transition flex items-center justify-between gap-4 ${borderStyle}`}
                  >
                    <span className="flex-1">{choice}</span>
                    {badge}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Real-time self action feedback / Explanations */}
        {hasAnswered && (
          <div className="bg-zinc-900/60 rounded-2xl border border-emerald-500/20 overflow-hidden shadow-2xl backdrop-blur-md">
            <div className="bg-emerald-500/5 p-4 border-b border-emerald-500/10 flex items-center gap-3">
              <Award className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400">解説・解答のポイント</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-3 bg-zinc-950/60 rounded-xl border border-white/5 flex items-center gap-3">
                <span className="text-xs text-slate-500 font-mono">正解の選択肢：</span>
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold font-mono text-sm">
                  {currentQuestion.correctChoice}
                </span>
                <span className="text-xs font-semibold text-slate-200">
                  {mySelectedChoice === currentQuestion.correctChoice ? (
                    <span className="text-emerald-400">正解です！お見事！🎉</span>
                  ) : (
                    <span className="text-rose-400">不正解でした。解説を読んで理解を深めましょう。📖</span>
                  )}
                </span>
              </div>
              <div className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
                {currentQuestion.explanation}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: SHARED REAL-TIME STATS & CHAT DISCUSSIONS */}
      <div className="lg:col-span-5 space-y-6">
        {/* Other students responses chart */}
        <div className="bg-zinc-900/40 p-6 rounded-2xl border border-white/5 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              <h2 className="text-sm font-bold text-white tracking-tight uppercase">受講生の回答分布</h2>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              総回答数: <strong className="text-slate-300 font-bold">{totalResponses}</strong> 件
            </span>
          </div>

          {!hasAnswered ? (
            <div className="p-8 bg-black/20 rounded-xl border border-dashed border-white/5 text-center space-y-3">
              <HelpCircle className="w-8 h-8 text-slate-600 mx-auto animate-pulse" />
              <p className="text-xs text-slate-500 leading-relaxed font-sans">
                他の受講生たちの回答分布や正答率は、あなたが解答を送信するとロックが解除され、ここにリアルタイムに表示されます。
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Acc summary */}
              <div className="flex items-center justify-between p-3 bg-zinc-950/40 rounded-xl border border-white/5">
                <span className="text-xs text-slate-400 font-sans">全体の正答率 (Class Average)</span>
                <span className={`text-sm font-black font-mono ${correctRate >= 70 ? "text-emerald-400" : "text-amber-400"}`}>
                  {correctRate}%
                </span>
              </div>

              {/* Progress Bars custom mapped */}
              <div className="space-y-3.5">
                {(["ア", "イ", "ウ", "エ"] as const).map((choice) => {
                  const count = choiceStats[choice];
                  const percent = totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0;
                  const isCorrect = choice === currentQuestion.correctChoice;
                  const selectedByMe = mySelectedChoice === choice;

                  let barColor = "bg-zinc-700";
                  if (isCorrect) {
                    barColor = "bg-emerald-500/80";
                  } else if (selectedByMe) {
                    barColor = "bg-rose-500/80";
                  }

                  return (
                    <div key={choice} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="flex items-center gap-2 text-slate-300 font-mono">
                          <span className={`w-5 h-5 rounded-md flex items-center justify-center border text-[10px] ${
                            isCorrect 
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                              : "bg-zinc-800 text-slate-400 border-white/5"
                          }`}>
                            {choice}
                          </span>
                          {selectedByMe && <span className="text-[9px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-1 py-0.2 rounded font-bold uppercase tracking-wider font-mono">My Choice</span>}
                        </span>
                        <span className="text-slate-400 font-mono text-[11px]">
                          {percent}% <span className="text-[10px] text-slate-500">({count}票)</span>
                        </span>
                      </div>
                      <div className="w-full bg-zinc-800/80 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-700 ${barColor}`}
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Discussion / Comments Board */}
        <div className="bg-zinc-900/40 p-6 rounded-2xl border border-white/5 shadow-xl flex flex-col h-[400px] backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-bold text-white tracking-tight uppercase">質問・議論・一言メモ</h2>
          </div>

          {/* Comment Scroller */}
          <div className="flex-1 overflow-y-auto space-y-3.5 pr-2 pr-1 custom-scrollbar mb-4 bg-black/10 p-3 rounded-xl border border-white/5">
            {questionComments.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center p-6">
                <p className="text-xs text-slate-500 leading-relaxed font-sans font-medium">
                  まだコメントはありません。疑問点、分かりやすかった解説のコツ、自分流の解法テクニックなどを投稿してみましょう！💡
                </p>
              </div>
            ) : (
              questionComments.map((comment) => (
                <div key={comment.id} className="p-3 bg-zinc-900/60 rounded-xl border border-white/5 space-y-1 shadow-sm">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-indigo-400 truncate max-w-32">{comment.userName}</span>
                    <span className="text-slate-500 font-mono">
                      {comment.timestamp ? new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed break-words font-medium">{comment.text}</p>
                </div>
              ))
            )}
            <div ref={commentEndRef} />
          </div>

          {/* Form write comment */}
          <form onSubmit={handleCommentSubmit} className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="一言書き込む..."
              maxLength={200}
              className="flex-1 bg-zinc-950/80 border border-white/5 text-white placeholder-slate-500 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition shadow-inner font-sans"
            />
            <button
              type="submit"
              disabled={!commentText.trim() || commentSubmitting}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition shadow-md flex items-center justify-center flex-shrink-0"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
