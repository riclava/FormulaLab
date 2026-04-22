import React, { useState } from 'react';
import { 
  Brain, Lightbulb, ChevronRight, CheckCircle, 
  XCircle, AlertTriangle, BookOpen, Clock,
  ArrowRight, Search, Plus, Sparkles, Activity,
  Target, Zap, Network
} from 'lucide-react';

// --- Mock Data ---
const MOCK_FORMULAS = {
  'f1': {
    id: 'f1',
    title: '贝叶斯定理 (Bayes\' Theorem)',
    latex: 'P(A|B) = \\frac{P(B|A)P(A)}{P(B)}',
    domain: '概率统计',
    oneLineUse: '已知结果发生，反推导致该结果的某个原因的概率。',
    variables: [
      { symbol: 'P(A|B)', desc: '后验概率 (Posterior)：已知 B 发生后，A 发生的概率。' },
      { symbol: 'P(A)', desc: '先验概率 (Prior)：在没有任何条件限制下 A 发生的概率。' },
      { symbol: 'P(B|A)', desc: '似然度 (Likelihood)：假设 A 发生，B 发生的概率。' },
      { symbol: 'P(B)', desc: '标准化常量 (Evidence)：B 发生的总概率。' }
    ],
    whenToUse: [
      '看到“已知某现象发生，求是某原因导致的概率”这种逆向推断问题。',
      '题目给出了正向的条件概率 P(B|A)，但要求逆向的 P(A|B)。'
    ],
    whenNotToUse: [
      '事件 A 和 B 相互独立时（此时 P(A|B) = P(A)，无需复杂计算）。'
    ],
    antiPatterns: [
      '混淆 P(A|B) 和 P(B|A)，比如把“感冒的人打喷嚏的概率”和“打喷嚏的人感冒的概率”当成一样。',
      '分母 P(B) 忘记使用全概率公式展开计算。'
    ],
    examples: [
      '【医疗检测】一种疾病的发病率为1% (P(A))。检测仪器的准确率为99% (P(B|A))。如果某人检测呈阳性 (B)，求他真正得病的概率 P(A|B)。'
    ],
    relations: [
      { type: 'prerequisite', name: '全概率公式', desc: '用于展开分母 P(B)' },
      { type: 'confusable', name: '条件概率定义公式', desc: '贝叶斯是其推论' }
    ],
    aiHooks: [
      { id: 'h1', type: '口诀联想', content: '先验乘似然，再除总证据。' },
      { id: 'h2', type: '结构联想', content: '执果索因：果在竖线后，因在竖线前。' },
      { id: 'h3', type: '场景联想', content: '去医院体检阳性（结果），反推真正得病（原因）的概率。' }
    ]
  }
};

const MOCK_REVIEW_QUEUE = [
  {
    id: 'r1',
    formulaId: 'f1',
    type: 'recall',
    prompt: '写出贝叶斯公式的核心表达式。',
    answer: 'P(A|B) = [ P(B|A) * P(A) ] / P(B)',
    userHook: '去医院体检阳性反推得病的概率模型'
  },
  {
    id: 'r2',
    formulaId: 'f1',
    type: 'recognition',
    prompt: '判断题：当需要从“结果”反推“原因”的概率时，通常使用全概率公式而不是贝叶斯公式。',
    answer: '错误。反推原因使用的是贝叶斯公式。全概率公式用于计算某个结果发生的总概率（即执因求果）。',
    userHook: null
  },
  {
    id: 'r3',
    formulaId: 'f1',
    type: 'application',
    prompt: '应用题：工厂有 A, B 两条流水线，A 生产 60% 的零件，B 生产 40%。A 的次品率是 1%，B 是 2%。现抽到一个次品，求它是 A 生产的概率。',
    answer: '解答：\nP(A)=0.6, P(B)=0.4\nP(次|A)=0.01, P(次|B)=0.02\nP(A|次) = [P(次|A)*P(A)] / [P(次|A)*P(A) + P(次|B)*P(B)]\n= (0.01 * 0.6) / (0.01 * 0.6 + 0.02 * 0.4)\n= 0.006 / (0.006 + 0.008) = 3/7',
    userHook: '执果索因：果在竖线后，因在竖线前。'
  }
];

// --- Components ---

// 1. Math Renderer (Dynamic Mock for V1)
const MathDisplay = ({ latex, inline }) => {
  return (
    <div className={`font-mono text-slate-800 ${inline ? 'inline text-sm' : 'text-center my-6 py-6 bg-slate-800 text-white rounded-xl border border-slate-700 shadow-inner'}`}>
      {latex}
    </div>
  );
};

// 2. Diagnostic View (冷启动诊断)
const DiagnosticPhase = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-sm border border-slate-200 p-8 animate-in fade-in zoom-in-95">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
            <Target className="w-8 h-8" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center text-slate-900 mb-2">快速诊断薄弱点</h1>
        <p className="text-center text-slate-500 mb-8">我们将通过 3 个小问题，为你生成专属的【今日复习任务】。</p>

        <div className="space-y-4 mb-8">
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="text-sm font-bold text-indigo-600 mb-2">问题 {step + 1} / 3</div>
            <p className="text-slate-800 font-medium">
              {step === 0 && "在遇到『已知抽取的零件是次品，求它是甲厂生产的概率』这类题时，你第一反应应该用什么公式？"}
              {step === 1 && "你能默写出『全概率公式』的完整表达式吗？"}
              {step === 2 && "在假设检验中，『第一类错误 (Type I Error)』的概率通常用哪个符号表示？"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => step < 2 ? setStep(step + 1) : onComplete()}
              className="py-3 px-4 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700 rounded-xl font-medium transition-all"
            >
              完全没头绪
            </button>
            <button 
              onClick={() => step < 2 ? setStep(step + 1) : onComplete()}
              className="py-3 px-4 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700 rounded-xl font-medium transition-all"
            >
              有点印象
            </button>
            <button 
              onClick={() => step < 2 ? setStep(step + 1) : onComplete()}
              className="py-3 px-4 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700 rounded-xl font-medium transition-all col-span-2"
            >
              很清楚，能写出来
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 3. Formula Detail View (补弱页面)
const FormulaDetail = ({ formula, onClose, initialFocus }) => {
  const [savedHooks, setSavedHooks] = useState([]);
  const [customHook, setCustomHook] = useState('');

  const handleSaveAIHook = (hook) => {
    if (!savedHooks.includes(hook.id)) setSavedHooks([...savedHooks, hook.id]);
  };

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto pb-20 animate-in slide-in-from-bottom-4">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <button onClick={onClose} className="flex items-center text-slate-500 hover:text-slate-800 mb-6">
          <ChevronRight className="rotate-180 w-5 h-5 mr-1" /> 返回复习
        </button>

        <div className="flex items-center space-x-3 mb-2">
          <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-md">{formula.domain}</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">{formula.title}</h1>
        <p className="text-lg text-slate-600 mb-8">{formula.oneLineUse}</p>

        <MathDisplay latex={formula.latex} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <div className="space-y-6">
            {/* 什么时候用 */}
            <section>
              <h3 className="flex items-center text-lg font-bold text-slate-800 mb-3">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" /> 什么时候用
              </h3>
              <ul className="space-y-2">
                {formula.whenToUse.map((item, idx) => (
                  <li key={idx} className="flex items-start text-slate-700 bg-green-50/50 p-3 rounded-lg">
                    <span className="mr-2 text-green-600">•</span> {item}
                  </li>
                ))}
              </ul>
            </section>
            
            {/* 常见误用 */}
            <section>
              <h3 className="flex items-center text-lg font-bold text-slate-800 mb-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 mr-2" /> 常见误用
              </h3>
              <ul className="space-y-2">
                {formula.antiPatterns.map((item, idx) => (
                  <li key={idx} className="flex items-start text-slate-700 bg-amber-50/50 p-3 rounded-lg">
                    <span className="mr-2 text-amber-600">•</span> {item}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className="space-y-6">
            {/* 变量说明 */}
            <section>
              <h3 className="flex items-center text-lg font-bold text-slate-800 mb-3">
                <BookOpen className="w-5 h-5 text-blue-500 mr-2" /> 变量说明
              </h3>
              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                {formula.variables.map((v, idx) => (
                  <div key={idx} className="text-sm">
                    <span className="font-serif font-bold text-slate-900 bg-white px-2 py-0.5 rounded shadow-sm mr-2">{v.symbol}</span>
                    <span className="text-slate-600">{v.desc}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* 经典例题 & 关联公式 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <section>
            <h3 className="flex items-center text-lg font-bold text-slate-800 mb-3">
              <Zap className="w-5 h-5 text-yellow-500 mr-2" /> 经典例题
            </h3>
            <div className="bg-slate-50 rounded-xl p-4 text-slate-700 text-sm leading-relaxed">
              {formula.examples[0]}
            </div>
          </section>

          <section>
            <h3 className="flex items-center text-lg font-bold text-slate-800 mb-3">
              <Network className="w-5 h-5 text-purple-500 mr-2" /> 关联公式
            </h3>
            <div className="space-y-3">
              {formula.relations.map((rel, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl">
                  <div>
                    <div className="text-sm font-bold text-slate-800">{rel.name}</div>
                    <div className="text-xs text-slate-500">{rel.desc}</div>
                  </div>
                  <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${rel.type === 'prerequisite' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                    {rel.type === 'prerequisite' ? '前置' : '易混淆'}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* 记忆钩子 Memory Hooks */}
        <section id="memory-hooks" className={`bg-indigo-50/50 rounded-2xl p-6 border transition-all ${initialFocus === 'hooks' ? 'border-indigo-300 ring-4 ring-indigo-50 shadow-lg scale-[1.01]' : 'border-indigo-100'}`}>
          <h3 className="flex items-center text-lg font-bold text-indigo-900 mb-1">
            <Sparkles className="w-5 h-5 text-indigo-500 mr-2" /> 建立记忆钩子 (Memory Hooks)
          </h3>
          <p className="text-sm text-indigo-600/80 mb-5">把公式挂到你已有的经验或画面上，下次更容易想起。</p>
          
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm focus-within:ring-2 ring-indigo-200">
              <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-wider">我的个人联想</label>
              <div className="flex space-x-2">
                <input 
                  type="text" 
                  placeholder="这个公式让你想到了什么？比如一个画面、一句口诀..." 
                  className="flex-1 outline-none text-slate-700 bg-transparent text-sm"
                  value={customHook}
                  onChange={(e) => setCustomHook(e.target.value)}
                />
                <button className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
                  保存
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 mb-3 block uppercase tracking-wider">AI 推荐联想 (点击保存)</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {formula.aiHooks.map(hook => (
                  <button 
                    key={hook.id}
                    onClick={() => handleSaveAIHook(hook)}
                    className={`text-left p-3 rounded-xl border transition-all ${
                      savedHooks.includes(hook.id) 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md transform scale-[1.02]' 
                        : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-bold ${savedHooks.includes(hook.id) ? 'text-indigo-200' : 'text-indigo-500'}`}>{hook.type}</span>
                      {savedHooks.includes(hook.id) && <CheckCircle className="w-4 h-4" />}
                    </div>
                    <p className="text-sm leading-snug">{hook.content}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

// 4. Main Application
export default function App() {
  const [view, setView] = useState('diagnostic'); // 'diagnostic', 'review', 'summary'
  const [queueIndex, setQueueIndex] = useState(0);
  const [cardState, setCardState] = useState('prompt'); // 'prompt', 'hinted', 'answered'
  const [showDetail, setShowDetail] = useState(false);
  const [detailFocus, setDetailFocus] = useState(null); // 'hooks' or null
  
  const [stats, setStats] = useState({ again: 0, hard: 0, good: 0, easy: 0 });

  const currentItem = MOCK_REVIEW_QUEUE[queueIndex];
  const currentFormula = currentItem ? MOCK_FORMULAS[currentItem.formulaId] : null;

  const handleDiagnosticComplete = () => {
    setView('review');
  };

  const handleShowHint = () => setCardState('hinted');
  const handleShowAnswer = () => setCardState('answered');

  const handleAssessment = (grade) => {
    setStats(prev => ({ ...prev, [grade]: prev[grade] + 1 }));
    
    if (grade === 'again' || grade === 'hard') {
      setDetailFocus('hooks');
      setShowDetail(true);
    } else {
      nextCard();
    }
  };

  const nextCard = () => {
    if (queueIndex < MOCK_REVIEW_QUEUE.length - 1) {
      setQueueIndex(queueIndex + 1);
      setCardState('prompt');
      setShowDetail(false);
    } else {
      setView('summary');
      setShowDetail(false);
    }
  };

  const getCardTypeTag = (type) => {
    const styles = {
      recall: "bg-purple-100 text-purple-700",
      recognition: "bg-blue-100 text-blue-700",
      application: "bg-emerald-100 text-emerald-700"
    };
    const labels = {
      recall: "主动回忆",
      recognition: "判断识别",
      application: "场景应用"
    };
    return <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${styles[type]}`}>{labels[type]}</span>;
  };

  if (view === 'diagnostic') {
    return <DiagnosticPhase onComplete={handleDiagnosticComplete} />;
  }

  if (view === 'summary') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-xl w-full bg-white rounded-3xl shadow-sm border border-slate-100 p-8 text-center animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">今日复习完成！</h2>
          <p className="text-slate-500 mb-8">你今天复习了 {MOCK_REVIEW_QUEUE.length} 个知识点，做得很好。</p>
          
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-red-50 rounded-2xl p-4">
              <div className="text-2xl font-bold text-red-600 mb-1">{stats.again}</div>
              <div className="text-xs font-medium text-red-800 uppercase tracking-wider">重来</div>
            </div>
            <div className="bg-orange-50 rounded-2xl p-4">
              <div className="text-2xl font-bold text-orange-600 mb-1">{stats.hard}</div>
              <div className="text-xs font-medium text-orange-800 uppercase tracking-wider">困难</div>
            </div>
            <div className="bg-blue-50 rounded-2xl p-4">
              <div className="text-2xl font-bold text-blue-600 mb-1">{stats.good}</div>
              <div className="text-xs font-medium text-blue-800 uppercase tracking-wider">良好</div>
            </div>
            <div className="bg-green-50 rounded-2xl p-4">
              <div className="text-2xl font-bold text-green-600 mb-1">{stats.easy}</div>
              <div className="text-xs font-medium text-green-800 uppercase tracking-wider">简单</div>
            </div>
          </div>

          {(stats.again > 0 || stats.hard > 0) && (
            <div className="bg-slate-50 rounded-2xl p-5 mb-8 text-left border border-slate-100">
              <h3 className="font-bold text-slate-800 flex items-center mb-3">
                <Activity className="w-4 h-4 mr-2 text-indigo-500"/> 建议稍后继续补弱
              </h3>
              <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 cursor-pointer hover:border-indigo-300">
                <span className="font-medium text-slate-700">贝叶斯定理</span>
                <span className="text-sm text-indigo-600 font-medium flex items-center">
                  打开详情 <ChevronRight className="w-4 h-4 ml-1" />
                </span>
              </div>
            </div>
          )}

          <button 
            onClick={() => window.location.reload()}
            className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl transition-colors"
          >
            结束今日学习
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-slate-900 text-lg tracking-tight">FormulaLab</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-slate-500">今日复习 ({queueIndex + 1}/{MOCK_REVIEW_QUEUE.length})</span>
          <div className="flex space-x-1">
            {MOCK_REVIEW_QUEUE.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-2 w-8 rounded-full transition-all duration-300 ${idx < queueIndex ? 'bg-indigo-500' : idx === queueIndex ? 'bg-indigo-500 animate-pulse scale-105' : 'bg-slate-200'}`} 
              />
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6 relative">
        <div className="max-w-2xl w-full">
          
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden transition-all duration-300 relative z-20">
            
            <div className="p-8 md:p-10 pb-6">
              <div className="flex items-center justify-between mb-6">
                {getCardTypeTag(currentItem.type)}
                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">Domain: {currentFormula.domain}</span>
              </div>
              <h2 className="text-xl md:text-2xl font-medium text-slate-800 leading-snug">
                {currentItem.prompt}
              </h2>
            </div>

            {cardState === 'hinted' && (
              <div className="px-8 md:px-10 pb-6 animate-in slide-in-from-top-2 opacity-0 fade-in duration-300 fill-mode-forwards">
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex items-start space-x-3">
                  <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1 block">你的记忆提示</span>
                    <p className="text-amber-900 font-medium">{currentItem.userHook || "没有任何提示，努力回忆一下结构！"}</p>
                  </div>
                </div>
              </div>
            )}

            {cardState === 'answered' && (
              <div className="px-8 md:px-10 pb-10 border-t border-slate-100 bg-slate-50/50 pt-8 animate-in slide-in-from-top-4 opacity-0 fade-in duration-300 fill-mode-forwards">
                <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">参考答案</div>
                
                {currentItem.type === 'recall' ? (
                  <MathDisplay latex={currentItem.answer} />
                ) : (
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm whitespace-pre-line text-slate-700 leading-relaxed font-medium">
                    {currentItem.answer}
                  </div>
                )}
                
                <div className="mt-6 flex justify-end">
                   <button 
                     onClick={() => { setDetailFocus(null); setShowDetail(true); }}
                     className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl transition-colors"
                   >
                     查看公式完整解析 <ArrowRight className="w-4 h-4 ml-1" />
                   </button>
                </div>
              </div>
            )}

            <div className="p-6 bg-white border-t border-slate-100 flex justify-center">
              {cardState !== 'answered' ? (
                <div className="flex space-x-4 w-full">
                  {cardState === 'prompt' && currentItem.userHook !== null && (
                    <button 
                      onClick={handleShowHint}
                      className="flex-1 py-4 flex items-center justify-center font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-2xl transition-colors"
                    >
                      <Lightbulb className="w-5 h-5 mr-2" /> 给我一点提示
                    </button>
                  )}
                  <button 
                    onClick={handleShowAnswer}
                    className="flex-[2] py-4 flex items-center justify-center font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-2xl shadow-sm transition-transform active:scale-[0.98]"
                  >
                    显示答案
                  </button>
                </div>
              ) : (
                <div className="w-full">
                  <div className="text-center text-sm font-bold text-slate-400 mb-4 uppercase tracking-wider">自评记忆程度</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <button onClick={() => handleAssessment('again')} className="py-4 rounded-2xl font-bold bg-red-50 text-red-600 hover:bg-red-100 hover:shadow-sm transition-all flex flex-col items-center">
                      <span className="text-lg mb-1">重来</span>
                      <span className="text-xs opacity-70">&lt; 10分钟</span>
                    </button>
                    <button onClick={() => handleAssessment('hard')} className="py-4 rounded-2xl font-bold bg-orange-50 text-orange-600 hover:bg-orange-100 hover:shadow-sm transition-all flex flex-col items-center">
                      <span className="text-lg mb-1">困难</span>
                      <span className="text-xs opacity-70">1 天后</span>
                    </button>
                    <button onClick={() => handleAssessment('good')} className="py-4 rounded-2xl font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 hover:shadow-sm transition-all flex flex-col items-center">
                      <span className="text-lg mb-1">良好</span>
                      <span className="text-xs opacity-70">3 天后</span>
                    </button>
                    <button onClick={() => handleAssessment('easy')} className="py-4 rounded-2xl font-bold bg-green-50 text-green-600 hover:bg-green-100 hover:shadow-sm transition-all flex flex-col items-center">
                      <span className="text-lg mb-1">简单</span>
                      <span className="text-xs opacity-70">7 天后</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {showDetail && (
        <FormulaDetail 
          formula={currentFormula} 
          initialFocus={detailFocus}
          onClose={() => {
            setShowDetail(false);
            if (detailFocus === 'hooks') {
              nextCard();
            }
          }} 
        />
      )}
    </div>
  );
}
