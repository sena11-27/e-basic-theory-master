import React, { useState } from "react";
import { Award, BookOpen, GraduationCap, RefreshCw, Star, Users, MessageCircle, AlertTriangle, Check, ArrowUpDown } from "lucide-react";
import { Question } from "../data/questions";
import { StudentResponse, DiscussionComment } from "../types";

interface TeacherZoneProps {
  questions: Question[];
  allResponses: StudentResponse[];
  allComments: DiscussionComment[];
}

export default function TeacherZone({
  questions,
  allResponses,
  allComments,
}: TeacherZoneProps) {
  const [selectedQuestionId, setSelectedQuestionId] = useState<number>(1);
  const [studentSortBy, setStudentSortBy] = useState<"done" | "accuracy">("done");
  const [studentSortOrder, setStudentSortSortOrder] = useState<"asc" | "desc">("desc");

  // --- Aggregate Student-level Stats ---
  const studentMap: Record<string, { done: number; correct: number }> = {};
  allResponses.forEach((res) => {
    if (!studentMap[res.userName]) {
      studentMap[res.userName] = { done: 0, correct: 0 };
    }
    studentMap[res.userName].done += 1;
    if (res.isCorrect) {
      studentMap[res.userName].correct += 1;
    }
  });

  const studentsList = Object.entries(studentMap).map(([name, stats]) => {
    const accuracy = stats.done > 0 ? Math.round((stats.correct / stats.done) * 100) : 0;
    return { name, ...stats, accuracy };
  });

  // Sort students list
  studentsList.sort((a, b) => {
    let factor = 1;
    if (studentSortBy === "done") {
      factor = a.done - b.done;
    } else {
      factor = a.accuracy - b.accuracy;
    }
    return studentSortOrder === "asc" ? factor : -factor;
  });

  const toggleStudentSort = (field: "done" | "accuracy") => {
    if (studentSortBy === field) {
      setStudentSortSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setStudentSortBy(field);
      setStudentSortSortOrder("desc");
    }
  };

  // --- Aggregate Question-level Stats ---
  const questionStatsMap: Record<number, { total: number; correct: number; choiceDistribution: Record<string, number> }> = {};
  
  questions.forEach((q) => {
    questionStatsMap[q.id] = {
      total: 0,
      correct: 0,
      choiceDistribution: { ア: 0, イ: 0, ウ: 0, エ: 0 },
    };
  });

  allResponses.forEach((res) => {
    const stats = questionStatsMap[res.questionId];
    if (stats) {
      stats.total += 1;
      if (res.isCorrect) {
        stats.correct += 1;
      }
      if (stats.choiceDistribution[res.selectedChoice] !== undefined) {
        stats.choiceDistribution[res.selectedChoice] += 1;
      }
    }
  });

  const activeQuestion = questions.find((q) => q.id === selectedQuestionId) || questions[0];
  const activeStats = questionStatsMap[activeQuestion.id] || { total: 0, correct: 0, choiceDistribution: { ア: 0, イ: 0, ウ: 0, エ: 0 } };
  const activeCorrectRate = activeStats.total > 0 ? Math.round((activeStats.correct / activeStats.total) * 100) : 0;
  const activeComments = allComments.filter((c) => c.questionId === activeQuestion.id);

  // Identify weak questions (total answers > 0, accuracy < 60%)
  const weakQuestions = questions
    .map((q) => {
      const stats = questionStatsMap[q.id];
      const rate = stats && stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : null;
      return { q, rate, total: stats ? stats.total : 0 };
    })
    .filter((item) => item.rate !== null && item.rate < 60)
    .sort((a, b) => (a.rate || 0) - (b.rate || 0));

  return (
    <div id="teacher-zone-container" className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
      {/* LEFT COLUMN: STUDENTS STATUS & INSIGHTS (COL SPAN 4) */}
      <div className="xl:col-span-4 space-y-6">
        {/* Class Overview Board */}
        <div className="bg-zinc-900/40 p-6 rounded-2xl border border-white/5 shadow-xl backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-bold text-white tracking-tight uppercase">クラス全体の状況</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-black/30 p-4 rounded-xl border border-white/5 text-center">
              <span className="block text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider mb-1">受講生人数</span>
              <span className="text-2xl font-black text-indigo-400 font-mono">{studentsList.length}</span>
              <span className="text-[10px] text-slate-500 mt-1 block">アクティブ接続</span>
            </div>
            <div className="bg-black/30 p-4 rounded-xl border border-white/5 text-center">
              <span className="block text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider mb-1">総回答数</span>
              <span className="text-2xl font-black text-blue-400 font-mono">{allResponses.length}</span>
              <span className="text-[10px] text-slate-500 mt-1 block">累積送信</span>
            </div>
          </div>
        </div>

        {/* Students list */}
        <div className="bg-zinc-900/40 p-6 rounded-2xl border border-white/5 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              <h2 className="text-sm font-bold text-white tracking-tight uppercase">受講生の個別進捗</h2>
            </div>
            <span className="text-[10px] text-slate-500 font-mono font-bold">全員: {studentsList.length} 名</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-white/5 text-slate-500 font-bold uppercase tracking-wider text-[10px] font-mono">
                  <th className="py-2.5 pb-2 text-slate-400 font-bold">受講生名</th>
                  <th className="py-2.5 pb-2 text-right cursor-pointer text-slate-400 font-bold" onClick={() => toggleStudentSort("done")}>
                    <span className="flex items-center justify-end gap-1 select-none">
                      進捗 {studentSortBy === "done" && <ArrowUpDown className="w-3 h-3" />}
                    </span>
                  </th>
                  <th className="py-2.5 pb-2 text-right cursor-pointer text-slate-400 font-bold" onClick={() => toggleStudentSort("accuracy")}>
                    <span className="flex items-center justify-end gap-1 select-none">
                      正解率 {studentSortBy === "accuracy" && <ArrowUpDown className="w-3 h-3" />}
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {studentsList.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-slate-500 font-mono">
                      受講生の回答データはまだありません。
                    </td>
                  </tr>
                ) : (
                  studentsList.map((stu) => (
                    <tr key={stu.name} className="hover:bg-white/5 transition">
                      <td className="py-3 font-semibold text-slate-200 truncate max-w-28">{stu.name}</td>
                      <td className="py-3 text-right font-mono text-slate-300 font-bold">
                        {stu.done} / {questions.length}問
                      </td>
                      <td className="py-3 text-right font-mono font-bold">
                        <span className={`px-2 py-0.5 rounded ${
                          stu.accuracy >= 80 
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                            : stu.accuracy >= 50 
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" 
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}>
                          {stu.accuracy}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Priority Focus Warning (正答率の低い弱点問題の通知) */}
        <div className="bg-zinc-900/40 p-6 rounded-2xl border border-white/5 shadow-xl backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            <h2 className="text-sm font-bold text-white tracking-tight uppercase">要指導・重点解説問題</h2>
          </div>
          <p className="text-[10px] text-slate-400 mb-4 leading-relaxed font-sans font-medium">
            クラス正答率が60%未満の要注意問題です。明日または授業の最後に、教える時のポイントに従って詳しく講義してください。
          </p>

          <div className="space-y-2.5 max-h-[180px] overflow-y-auto custom-scrollbar">
            {weakQuestions.length === 0 ? (
              <div className="p-4 bg-zinc-950/40 rounded-xl border border-white/5 text-center text-[11px] text-slate-500 font-sans font-semibold">
                現在、正答率の低い要注意問題はありません。全員が良好に進んでいます！🏆
              </div>
            ) : (
              weakQuestions.map((item) => (
                <div
                  key={item.q.id}
                  onClick={() => setSelectedQuestionId(item.q.id)}
                  className={`p-3 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/20 rounded-xl transition cursor-pointer flex items-center justify-between gap-4`}
                >
                  <div class="truncate">
                    <div class="flex items-center gap-2">
                      <span class="text-[10px] font-mono font-black text-rose-400">問{item.q.id}</span>
                      <h4 class="text-xs font-bold text-slate-200 truncate">{item.q.section}</h4>
                    </div>
                    <span class="text-[9px] text-slate-500 mt-0.5 block">{item.q.category}</span>
                  </div>
                  <div class="text-right flex-shrink-0">
                    <span class="text-xs font-mono font-black text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                      正解率: {item.rate}%
                    </span>
                    <span class="text-[8px] font-mono text-slate-500 block mt-1">{item.total}名回答</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: DETAILED VIEW, TEACHING MEMO, QUESTION STATS (COL SPAN 8) */}
      <div className="xl:col-span-8 space-y-6">
        {/* Question Selector Toolbar */}
        <div className="bg-zinc-900/40 p-4 rounded-xl border border-white/5 flex flex-wrap gap-1.5 shadow-md">
          {questions.map((q) => {
            const stats = questionStatsMap[q.id];
            const isSelected = selectedQuestionId === q.id;
            const rate = stats && stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : null;

            let dotColor = "bg-zinc-600";
            if (rate !== null) {
              dotColor = rate >= 70 ? "bg-emerald-500" : rate >= 45 ? "bg-amber-500" : "bg-rose-500";
            }

            return (
              <button
                key={q.id}
                onClick={() => setSelectedQuestionId(q.id)}
                className={`w-9 h-9 rounded-lg border font-mono font-bold text-xs flex flex-col items-center justify-center relative transition ${
                  isSelected
                    ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20"
                    : "bg-white/5 hover:bg-white/10 border-white/5 text-slate-300"
                }`}
              >
                <span>{q.id}</span>
                <span className={`w-1.5 h-1.5 rounded-full absolute bottom-1 ${dotColor}`} />
              </button>
            );
          })}
        </div>

        {/* Detailed Question Card */}
        <div className="bg-zinc-900/60 rounded-2xl border border-white/5 overflow-hidden shadow-2xl backdrop-blur-sm">
          {/* Header info */}
          <div className="bg-gradient-to-r from-blue-600/10 to-indigo-600/10 p-5 border-b border-white/5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest font-black block mb-1">
                {activeQuestion.category}
              </span>
              <h3 className="text-sm font-black text-white tracking-tight flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-500" />
                第{activeQuestion.id}問: {activeQuestion.section}
              </h3>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-mono text-slate-300 bg-zinc-800 border border-white/5 px-2.5 py-1 rounded-md">
                {activeQuestion.page}
              </span>
              <span class="flex items-center gap-0.5 text-xs text-amber-400 bg-zinc-800 border border-white/5 px-2.5 py-1 rounded-md">
                {Array.from({ length: activeQuestion.difficulty }).map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-current" />
                ))}
              </span>
            </div>
          </div>

          <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left side inside card: Question details and correct answers */}
            <div className="lg:col-span-8 space-y-6">
              <div className="text-slate-100 text-sm leading-relaxed whitespace-pre-wrap font-sans font-medium">
                {activeQuestion.question}
              </div>

              {/* Options display indicating correct choice */}
              <div className="space-y-2.5">
                {activeQuestion.choices.map((choice, i) => {
                  const choiceLetter = choice.trim().charAt(0);
                  const isCorrect = choiceLetter === activeQuestion.correctChoice;

                  return (
                    <div
                      key={i}
                      className={`p-3.5 rounded-xl border text-xs font-semibold leading-relaxed transition ${
                        isCorrect
                          ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                          : "bg-white/5 border-white/5 text-slate-400"
                      }`}
                    >
                      <span className="flex items-center justify-between gap-4">
                        <span>{choice}</span>
                        {isCorrect && (
                          <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-mono uppercase tracking-widest font-black">
                            Correct
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right side inside card: Real-time Stats & distribution chart */}
            <div className="lg:col-span-4 space-y-5">
              <div className="p-4 bg-black/30 rounded-xl border border-white/5 space-y-4">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-black">リアルタイム回答統計</div>
                
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-xs text-slate-400 font-sans">総回答者数</span>
                  <span className="text-base font-black font-mono text-white">{activeStats.total} 名</span>
                </div>

                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-xs text-slate-400 font-sans">正答率</span>
                  <span className={`text-base font-black font-mono ${activeCorrectRate >= 70 ? "text-emerald-400" : "text-amber-400"}`}>
                    {activeCorrectRate}%
                  </span>
                </div>

                <div className="space-y-3 pt-1">
                  {(["ア", "イ", "ウ", "エ"] as const).map((choice) => {
                    const count = activeStats.choiceDistribution[choice];
                    const percent = activeStats.total > 0 ? Math.round((count / activeStats.total) * 100) : 0;
                    const isCorrect = choice === activeQuestion.correctChoice;

                    return (
                      <div key={choice} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className={`font-bold ${isCorrect ? "text-emerald-400" : "text-slate-400"}`}>
                            {choice} {isCorrect && "✔"}
                          </span>
                          <span className="text-slate-400 font-bold">{percent}% ({count}人)</span>
                        </div>
                        <div className="w-full bg-zinc-800 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-700 ${isCorrect ? "bg-emerald-500/80" : "bg-zinc-600"}`}
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Teacher Instruction Memo (教えるときのポイント) */}
        <div className="bg-zinc-900/60 rounded-2xl border border-indigo-500/20 overflow-hidden shadow-2xl backdrop-blur-md">
          <div className="bg-indigo-500/5 p-4 border-b border-indigo-500/10 flex items-center gap-3">
            <Award className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400">教えるときの指導ポイント (Teacher's Instruction Note)</h2>
          </div>
          <div className="p-6 sm:p-8 space-y-6">
            <div className="space-y-1.5">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-black">指導メモ</div>
              <div className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-sans font-medium bg-zinc-950/40 p-4 rounded-xl border border-white/5 border-dashed">
                {activeQuestion.teachingPoints}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-black">模範解答の全詳細</div>
              <div className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-sans bg-zinc-950/40 p-4 rounded-xl border border-white/5">
                {activeQuestion.explanation}
              </div>
            </div>
          </div>
        </div>

        {/* Discussion Watch Board relative to chosen question */}
        <div className="bg-zinc-900/40 p-6 rounded-2xl border border-white/5 shadow-xl flex flex-col h-[280px]">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-bold text-white tracking-tight uppercase">この問題に関する受講生のコメント ({activeComments.length})</h2>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar p-3 bg-black/10 rounded-xl border border-white/5">
            {activeComments.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs font-semibold">
                この問題に対する受講生のコメントはまだありません。
              </div>
            ) : (
              activeComments.map((comment) => (
                <div key={comment.id} className="p-3 bg-zinc-900/60 rounded-xl border border-white/5 space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-indigo-400">{comment.userName}</span>
                    <span className="text-slate-500 font-mono">{new Date(comment.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{comment.text}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
