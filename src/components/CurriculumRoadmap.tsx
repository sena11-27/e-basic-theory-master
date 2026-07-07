import React from "react";
import { CheckCircle2, PlayCircle, BookOpen } from "lucide-react";
import { Question } from "../data/questions";

export interface SectionProgress {
  id: string; // "1-1" など
  title: string;
  questionsCount: number;
  completedCount: number;
  correctCount: number;
}

interface CurriculumRoadmapProps {
  questions: Question[];
  myAnswers: Record<number, string>; // questionId -> selectedChoice
  activeSection: string | null;
  onSelectSection: (section: string | null) => void;
}

export const sectionsList = [
  { id: "1-1", title: "情報の単位", desc: "情報の表し方・補助単位の計算" },
  { id: "1-2", title: "基数", desc: "10進数、2進数、16進数の基数変換" },
  { id: "1-3", title: "数値表現", desc: "補数表現、固定・浮動小数点表示" },
  { id: "1-4", title: "算術演算", desc: "シフト演算と乗除算の工夫" },
  { id: "1-5", title: "演算誤差", desc: "桁落ち、情報落ち、丸め誤差など" },
  { id: "1-6", title: "論理演算", desc: "真理値表、ド・モルガンの法則、ビット操作" },
  { id: "1-7", title: "論理回路", desc: "各種ゲート、半加算器・全加算器の仕組み" },
  { id: "1-8", title: "確率", desc: "順列・組合せ、単純マルコフ過程" },
  { id: "1-9", title: "統計", desc: "期待値の計算、正規分布・標準化" },
  { id: "1-10", title: "符号理論", desc: "パリティ検査、ハフマン符号、圧縮法" },
  { id: "1-11", title: "オートマトン", desc: "状態遷移図とビット列の受理判定" },
  { id: "1-12", title: "形式言語", desc: "正規表現と記述構文(BNF)" },
  { id: "1-13", title: "数式記法", desc: "逆ポーランド記法とスタック計算" },
  { id: "1-14", title: "人工知能 (AI)", desc: "機械学習（教師あり・なし、強化）、深層学習" },
];

export default function CurriculumRoadmap({
  questions,
  myAnswers,
  activeSection,
  onSelectSection,
}: CurriculumRoadmapProps) {
  // Calculate progress for each section
  const progressMap: Record<string, { total: number; done: number; correct: number }> = {};

  sectionsList.forEach((sec) => {
    progressMap[sec.id] = { total: 0, done: 0, correct: 0 };
  });

  questions.forEach((q) => {
    // extract section code like "1-1" from "1-1 情報の単位"
    const match = q.section.match(/^(\d+-\d+)/);
    if (match) {
      const secId = match[1];
      if (progressMap[secId]) {
        progressMap[secId].total += 1;
        if (myAnswers[q.id] !== undefined) {
          progressMap[secId].done += 1;
          const isCorrect = myAnswers[q.id] === q.correctChoice;
          if (isCorrect) {
            progressMap[secId].correct += 1;
          }
        }
      }
    }
  });

  const overallTotal = questions.length;
  const overallDone = Object.keys(myAnswers).length;
  const overallCorrect = Object.values(
    questions.reduce((acc, q) => {
      if (myAnswers[q.id] === q.correctChoice) acc[q.id] = true;
      return acc;
    }, {} as Record<number, boolean>)
  ).length;

  const overallRate = overallTotal > 0 ? Math.round((overallDone / overallTotal) * 100) : 0;
  const overallAccuracy = overallDone > 0 ? Math.round((overallCorrect / overallDone) * 100) : 0;

  return (
    <div id="curriculum-roadmap-card" className="bg-zinc-900/40 p-6 rounded-2xl border border-white/5 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center text-blue-500">
            <BookOpen size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight uppercase italic">Curriculum Timeline</h2>
            <p className="text-xs text-slate-500 font-mono">Chapter 1: 基礎理論 (P.25 ~ P.80)</p>
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">Total Progress</div>
          <div className="text-xl font-black text-blue-500 font-mono">
            {overallDone}/{overallTotal} <span className="text-xs text-slate-400 font-normal">({overallRate}%)</span>
          </div>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-black/30 rounded-xl border border-white/5">
        <div>
          <span className="block text-[9px] font-mono text-slate-400 uppercase tracking-wider mb-1">達成度 (Progress)</span>
          <div className="w-full bg-zinc-800 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${overallRate}%` }}
            ></div>
          </div>
          <span className="text-[10px] font-mono text-slate-400 mt-1 block text-right">{overallRate}% 完成</span>
        </div>
        <div>
          <span className="block text-[9px] font-mono text-slate-400 uppercase tracking-wider mb-1">正解率 (Accuracy)</span>
          <div className="w-full bg-zinc-800 rounded-full h-2">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${overallAccuracy}%` }}
            ></div>
          </div>
          <span className="text-[10px] font-mono text-slate-400 mt-1 block text-right">
            {overallAccuracy}% 正解 ({overallCorrect}問)
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">学習カリキュラム一覧</span>
        {activeSection && (
          <button
            onClick={() => onSelectSection(null)}
            className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-1 px-2.5 rounded-lg transition"
          >
            フィルター解除
          </button>
        )}
      </div>

      {/* Roadmap List */}
      <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-2 custom-scrollbar">
        {sectionsList.map((sec) => {
          const stats = progressMap[sec.id] || { total: 0, done: 0, correct: 0 };
          const isSelected = activeSection === sec.id;
          const isCompleted = stats.total > 0 && stats.done === stats.total;
          const isStarted = stats.done > 0 && stats.done < stats.total;

          let badgeColor = "bg-zinc-800 text-slate-400 border-zinc-700";
          if (isCompleted) {
            badgeColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
          } else if (isStarted) {
            badgeColor = "bg-amber-500/10 text-amber-400 border-amber-500/20";
          }

          return (
            <div
              key={sec.id}
              onClick={() => onSelectSection(isSelected ? null : sec.id)}
              className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-4 ${
                isSelected
                  ? "bg-blue-600/10 border-blue-500/40 shadow-md"
                  : "bg-white/5 border-slate-200/5 hover:bg-white/10 hover:border-slate-200/10"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 flex items-center justify-center">
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : isStarted ? (
                    <PlayCircle className="w-5 h-5 text-amber-500 animate-pulse" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-slate-500/40 flex items-center justify-center text-[10px] font-mono text-slate-400">
                      {sec.id.split("-")[1]}
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400">{sec.id}</span>
                    <h3 className="text-xs font-bold text-white">{sec.title}</h3>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{sec.desc}</p>
                </div>
              </div>

              <div className="text-right flex-shrink-0 flex items-center gap-2">
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${badgeColor}`}>
                  {stats.done}/{stats.total}問
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
