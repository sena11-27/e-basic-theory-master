import React, { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { BookOpen, GraduationCap, Users, LogOut, KeyRound, CheckCircle2 } from "lucide-react";
import { db } from "./lib/firebase";
import { questions } from "./data/questions";
import { StudentResponse, DiscussionComment, Mode } from "./types";
import CurriculumRoadmap from "./components/CurriculumRoadmap";
import StudentZone from "./components/StudentZone";
import TeacherZone from "./components/TeacherZone";

export default function App() {
  const [mode, setMode] = useState<Mode>("login");
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Real-time Firestore states
  const [allResponses, setAllResponses] = useState<StudentResponse[]>([]);
  const [allComments, setAllComments] = useState<DiscussionComment[]>([]);

  // Local answers cache: questionId -> selectedChoice
  const [myAnswers, setMyAnswers] = useState<Record<number, string>>({});

  // 1. Initial configuration loading (Username, answers from localStorage)
  useEffect(() => {
    const savedName = localStorage.getItem("fe_username");
    if (savedName) {
      setUserName(savedName);
    }

    const savedAnswers = localStorage.getItem("fe_my_answers");
    if (savedAnswers) {
      try {
        setMyAnswers(JSON.parse(savedAnswers));
      } catch (e) {
        console.error("Failed to parse saved answers", e);
      }
    }
  }, []);

  // 2. Real-time Subscription to Firestore collection data (No complex query filters to fulfill security standards)
  useEffect(() => {
    // Subscribe to all responses (aggregated on the client side)
    const unsubResponses = onSnapshot(
      collection(db, "responses"),
      (snapshot) => {
        const list: StudentResponse[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          list.push({
            id: doc.id,
            questionId: Number(data.questionId),
            userName: String(data.userName || "匿名"),
            selectedChoice: String(data.selectedChoice || ""),
            isCorrect: Boolean(data.isCorrect),
            timestamp: data.timestamp,
          });
        });
        setAllResponses(list);
      },
      (err) => {
        console.error("Firestore onSnapshot error on responses:", err);
      }
    );

    // Subscribe to all comment feeds
    const unsubComments = onSnapshot(
      collection(db, "comments"),
      (snapshot) => {
        const list: DiscussionComment[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          list.push({
            id: doc.id,
            questionId: Number(data.questionId),
            userName: String(data.userName || "匿名"),
            text: String(data.text || ""),
            timestamp: data.timestamp,
          });
        });
        // Sort comments chronological
        list.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        setAllComments(list);
      },
      (err) => {
        console.error("Firestore onSnapshot error on comments:", err);
      }
    );

    return () => {
      unsubResponses();
      unsubComments();
    };
  }, []); // Empty dependencies list to prevent repeated hook instantiation

  // Helper when student submits an answer
  const handleAnswerSubmit = (questionId: number, choice: string, isCorrect: boolean) => {
    const nextAnswers = { ...myAnswers, [questionId]: choice };
    setMyAnswers(nextAnswers);
    localStorage.setItem("fe_my_answers", JSON.stringify(nextAnswers));
  };

  // Handle Login Event
  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) return;

    localStorage.setItem("fe_username", userName.trim());
    setMode("student");
  };

  // Handle Teacher Password Authentication
  const handleTeacherLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "sensei123") {
      setMode("teacher");
      setPasswordError("");
    } else {
      setPasswordError("パスワードが正しくありません。(正解: sensei123)");
    }
  };

  const handleLogout = () => {
    setMode("login");
    setPassword("");
  };

  // Filter questions according to active chapter roadmap filter
  const filteredQuestions = activeSection
    ? questions.filter((q) => q.section.startsWith(activeSection))
    : questions;

  return (
    <div className="min-h-screen bg-zinc-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600/30 selection:text-white">
      {/* BACKGROUND GRAPHIC OR GRADIENTS */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-25" />

      {/* HEADER BAR */}
      <header className="border-b border-white/5 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/15 text-white font-bold">
              FE
            </div>
            <div>
              <h1 className="text-sm font-black text-white tracking-tight leading-none uppercase italic">
                FE基礎理論マスター
              </h1>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5 uppercase tracking-widest font-black">
                基本情報第1章対策
              </p>
            </div>
          </div>

          {mode !== "login" && (
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-white/5 rounded-lg text-xs font-mono">
                {mode === "student" ? (
                  <>
                    <Users className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-slate-400">受講生:</span>
                    <span className="text-white font-semibold truncate max-w-28">{userName}</span>
                  </>
                ) : (
                  <>
                    <GraduationCap className="w-4 h-4 text-indigo-400" />
                    <span className="text-indigo-400 font-bold">教師用 指導画面</span>
                  </>
                )}
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-white/5 hover:border-white/10 px-3 py-1.5 rounded-lg transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>退出</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {mode === "login" ? (
          <div className="max-w-4xl mx-auto py-12 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Promo / App Details */}
            <div className="space-y-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full text-[10px] font-mono uppercase tracking-widest font-bold">
                Chapter 1: Basic Theory
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none uppercase italic">
                プロの過去問講義を
                <br />
                ウェブで完全網羅。
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed font-sans font-medium">
                基本情報技術者試験の最難関かつ最重要分野「第1章：基礎理論」の厳選過去問32題にフォーカス。
                受講生の解答傾向、つまずきやすい弱点、そしてプロ教師用の詳細指導ノートを完全内蔵した、双方向型学習webアプレットです。
              </p>

              <div className="space-y-3">
                {[
                  "14つのカリキュラムロードマップで、情報の単位からAIまで網羅的ステップアップ",
                  "他の受講生たちの回答分布・正答率がリアルタイムに変化するインタラクティブ統計",
                  "分からない部分をその場で共有し合えるリアルタイム質問・一言メモ掲示板",
                  "教師向けに「重点指導すべき低正答率問題」の自動抽出と指導用メモを完備",
                ].map((feature, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-300 font-medium font-sans">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Combined Login Form */}
            <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-2xl shadow-2xl backdrop-blur-md space-y-8">
              {/* Student Login Form */}
              <form onSubmit={handleStudentLogin} className="space-y-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  <h3 className="text-sm font-black text-white uppercase">受講生として入室</h3>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-mono uppercase tracking-wider mb-1.5 font-bold">
                    ニックネーム
                  </label>
                  <input
                    type="text"
                    required
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="例：たろう、鈴木"
                    maxLength={20}
                    className="w-full bg-zinc-950/80 border border-white/5 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition shadow-inner font-sans"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!userName.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3 rounded-xl transition text-xs tracking-widest uppercase italic shadow-md shadow-blue-600/10"
                >
                  学習を開始する (Enter Study)
                </button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/5" />
                </div>
                <div className="relative flex justify-center text-[10px] font-mono text-slate-500 uppercase tracking-widest font-black">
                  <span className="bg-zinc-950/40 px-3 backdrop-blur-md">OR</span>
                </div>
              </div>

              {/* Teacher Login Form */}
              <form onSubmit={handleTeacherLogin} className="space-y-4">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4.5 h-4.5 text-indigo-400" />
                  <h3 className="text-sm font-black text-white uppercase">教師用 管理ダッシュボード</h3>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-mono uppercase tracking-wider mb-1.5 font-bold">
                    アクセスパスワード
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="※ sensei123"
                    className="w-full bg-zinc-950/80 border border-white/5 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition shadow-inner font-sans"
                  />
                  {passwordError && (
                    <p className="text-[10px] text-rose-400 mt-1.5 font-sans font-semibold">{passwordError}</p>
                  )}
                </div>
                <button
                  type="submit"
                  className="w-full bg-zinc-800 hover:bg-zinc-700 text-slate-200 border border-white/5 font-black py-3 rounded-xl transition text-xs tracking-widest uppercase italic"
                >
                  指導ダッシュボードを開く
                </button>
              </form>
            </div>
          </div>
        ) : mode === "student" ? (
          <div className="space-y-8">
            {/* Student grid: Roadmap filter + active questions */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column (Main study panel) - 8cols */}
              <div className="lg:col-span-8">
                <StudentZone
                  userName={userName}
                  questions={filteredQuestions}
                  myAnswers={myAnswers}
                  onAnswerSubmit={handleAnswerSubmit}
                  allResponses={allResponses}
                  allComments={allComments}
                />
              </div>

              {/* Right Column (Timeline Curriculum Progress) - 4cols */}
              <div className="lg:col-span-4">
                <CurriculumRoadmap
                  questions={questions}
                  myAnswers={myAnswers}
                  activeSection={activeSection}
                  onSelectSection={setActiveSection}
                />
              </div>
            </div>
          </div>
        ) : (
          /* TEACHER DASHBOARD VIEW */
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full text-[10px] font-mono uppercase tracking-widest font-black">
                  Instructor Control Board
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase italic mt-1">
                  第1章 基礎理論：リアルタイム指導コンソール
                </h2>
              </div>
            </div>

            <TeacherZone
              questions={questions}
              allResponses={allResponses}
              allComments={allComments}
            />
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-6 bg-zinc-950 mt-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:flex sm:items-center sm:justify-between text-[11px] font-mono text-slate-600 gap-4">
          <p>
            FE基礎理論マスター (基本情報技術者試験 対策アプレット)
          </p>
          <p className="mt-2 sm:mt-0">
            © 2026 FE Master Learning. Powered by Google Cloud Run.
          </p>
        </div>
      </footer>
    </div>
  );
}
