import { createHash } from "crypto";
import { FunctionSquare, Hash } from "lucide-react";

import { PhaseShell } from "@/components/app/phase-shell";
import { MathSymbolsOverview } from "@/components/math-symbols/math-symbols-overview";
import { SymbolAudioButton } from "@/components/math-symbols/symbol-audio-button";
import { Badge } from "@/components/ui/badge";
import { requireCurrentLearner } from "@/server/auth/current-learner";
import { resolveLearningDomain } from "@/server/learning-domain";

export const dynamic = "force-dynamic";

type SymbolItem = {
  symbol: string;
  name: string;
  reading: string;
  usage: string;
  example: string;
};

type SymbolCategory = {
  id: string;
  title: string;
  description: string;
  items: SymbolItem[];
};

const symbolCategories: SymbolCategory[] = [
  {
    id: "number-sets",
    title: "数集与常量",
    description: "用于说明变量所在范围、特殊集合和常见数学常量。",
    items: [
      { symbol: "∅", name: "空集", reading: "空集", usage: "表示不含任何元素的集合。", example: "A ∩ B = ∅" },
      { symbol: "ℕ", name: "自然数集", reading: "自然数 N", usage: "表示自然数集合，是否包含 0 取决于上下文。", example: "n ∈ ℕ" },
      { symbol: "ℤ", name: "整数集", reading: "整数 Z", usage: "表示正整数、负整数和 0 的集合。", example: "k ∈ ℤ" },
      { symbol: "ℚ", name: "有理数集", reading: "有理数 Q", usage: "表示可写成两个整数之比的数。", example: "1/3 ∈ ℚ" },
      { symbol: "ℝ", name: "实数集", reading: "实数 R", usage: "表示连续数轴上的全部实数。", example: "x ∈ ℝ" },
      { symbol: "ℂ", name: "复数集", reading: "复数 C", usage: "表示形如 a + bi 的复数集合。", example: "z ∈ ℂ" },
      { symbol: "∞", name: "无穷", reading: "无穷大", usage: "表示无限增长、无界或极限过程。", example: "n → ∞" },
      { symbol: "π", name: "圆周率", reading: "派", usage: "圆周长与直径之比，也可作概率或策略符号。", example: "A = πr²" },
      { symbol: "e", name: "自然常数", reading: "e", usage: "自然指数和连续增长中的基本常数。", example: "eˣ" },
      { symbol: "i", name: "虚数单位", reading: "i", usage: "满足平方为 -1 的复数单位。", example: "i² = -1" },
      { symbol: "NaN", name: "非数值", reading: "not a number", usage: "计算系统中表示无效数值结果。", example: "0/0 → NaN" },
      { symbol: "±", name: "正负号", reading: "正负", usage: "表示两个可能取值：正号和负号。", example: "x = ±2" },
    ],
  },
  {
    id: "greek",
    title: "希腊字母",
    description: "常用作变量、参数、角度、概率、统计量和特征值。",
    items: [
      { symbol: "α", name: "alpha", reading: "阿尔法", usage: "常表示显著性水平、角度或模型参数。", example: "α = 0.05" },
      { symbol: "β", name: "beta", reading: "贝塔", usage: "常表示回归系数、二类错误概率或角度。", example: "y = α + βx" },
      { symbol: "γ", name: "gamma", reading: "伽马", usage: "常表示角度、折扣因子或 Gamma 分布参数。", example: "γ ∈ (0,1)" },
      { symbol: "δ", name: "delta", reading: "德尔塔", usage: "常表示小变化量、误差界或变分。", example: "δ > 0" },
      { symbol: "Δ", name: "大写 delta", reading: "德尔塔", usage: "常表示有限变化量或判别式。", example: "Δx = x₂ - x₁" },
      { symbol: "ε", name: "epsilon", reading: "艾普西龙", usage: "常表示任意小正数、误差或噪声。", example: "ε > 0" },
      { symbol: "θ", name: "theta", reading: "西塔", usage: "常表示角度、未知参数或模型参数集合。", example: "估计参数 θ" },
      { symbol: "λ", name: "lambda", reading: "兰姆达", usage: "常表示特征值、泊松率或正则化系数。", example: "Av = λv" },
      { symbol: "μ", name: "mu", reading: "缪", usage: "常表示总体均值、期望或位置参数。", example: "E(X) = μ" },
      { symbol: "ν", name: "nu", reading: "纽", usage: "常表示自由度、频率或参数。", example: "t 分布自由度 ν" },
      { symbol: "ρ", name: "rho", reading: "柔", usage: "常表示相关系数、密度或比例。", example: "ρ = Corr(X,Y)" },
      { symbol: "σ", name: "sigma", reading: "西格玛", usage: "小写常表示标准差，大写 Σ 常表示求和。", example: "σ² = Var(X)" },
      { symbol: "τ", name: "tau", reading: "陶", usage: "常表示时间常数、秩相关或剪切应力。", example: "Kendall τ" },
      { symbol: "φ", name: "phi", reading: "斐", usage: "常表示角度、特征函数或标准正态密度。", example: "φ(x)" },
      { symbol: "χ", name: "chi", reading: "卡", usage: "常用于卡方分布或卡方统计量。", example: "χ² 检验" },
      { symbol: "ω", name: "omega", reading: "欧米伽", usage: "常表示角速度、频率或渐近下界。", example: "ω = 2πf" },
    ],
  },
  {
    id: "relations",
    title: "关系与比较",
    description: "用于表达相等、大小、近似、比例和数量级关系。",
    items: [
      { symbol: "=", name: "等号", reading: "等于", usage: "表示两边数值、表达式或对象相等。", example: "a + b = c" },
      { symbol: "≠", name: "不等号", reading: "不等于", usage: "表示两边不相等。", example: "x ≠ 0" },
      { symbol: "≈", name: "约等号", reading: "约等于", usage: "表示近似相等，常用于估算或数值计算。", example: "π ≈ 3.14" },
      { symbol: "≡", name: "恒等或同余", reading: "恒等于 / 同余于", usage: "可表示恒等关系，也可表示同余。", example: "a ≡ b (mod n)" },
      { symbol: "<", name: "小于", reading: "小于", usage: "表示左侧严格小于右侧。", example: "x < 1" },
      { symbol: ">", name: "大于", reading: "大于", usage: "表示左侧严格大于右侧。", example: "x > 0" },
      { symbol: "≤", name: "小于等于", reading: "小于或等于", usage: "表示上界约束。", example: "0 ≤ p ≤ 1" },
      { symbol: "≥", name: "大于等于", reading: "大于或等于", usage: "表示下界约束。", example: "n ≥ 30" },
      { symbol: "≪", name: "远小于", reading: "远小于", usage: "表示数量级上明显更小。", example: "a ≪ b" },
      { symbol: "≫", name: "远大于", reading: "远大于", usage: "表示数量级上明显更大。", example: "b ≫ a" },
      { symbol: "∝", name: "正比号", reading: "正比于", usage: "表示一个量随另一个量按比例变化。", example: "y ∝ x" },
      { symbol: "∼", name: "相似或渐近等价", reading: "相似于 / 渐近等价", usage: "表示同分布、相似或渐近比例趋于 1。", example: "f(n) ∼ g(n)" },
    ],
  },
  {
    id: "sets",
    title: "集合",
    description: "用于描述元素归属、子集、并交差补和集合构造。",
    items: [
      { symbol: "∈", name: "属于", reading: "属于", usage: "表示元素属于某个集合。", example: "x ∈ A" },
      { symbol: "∉", name: "不属于", reading: "不属于", usage: "表示元素不在某个集合中。", example: "0 ∉ ℕ⁺" },
      { symbol: "⊂", name: "真子集", reading: "真包含于", usage: "表示一个集合包含在另一个集合中且不相等。", example: "A ⊂ B" },
      { symbol: "⊆", name: "子集", reading: "包含于", usage: "表示左侧集合的元素都在右侧集合中，可相等。", example: "A ⊆ B" },
      { symbol: "⊃", name: "真超集", reading: "真包含", usage: "表示左侧集合严格包含右侧集合。", example: "B ⊃ A" },
      { symbol: "⊇", name: "超集", reading: "包含", usage: "表示左侧集合包含右侧集合，可相等。", example: "B ⊇ A" },
      { symbol: "∪", name: "并集", reading: "并", usage: "表示属于任一集合的元素组成的集合。", example: "A ∪ B" },
      { symbol: "∩", name: "交集", reading: "交", usage: "表示同时属于两个集合的元素组成的集合。", example: "A ∩ B" },
      { symbol: "\\", name: "差集", reading: "差", usage: "表示在左侧集合中但不在右侧集合中的元素。", example: "A \\ B" },
      { symbol: "Aᶜ", name: "补集", reading: "A 的补集", usage: "表示全集中不属于 A 的元素集合。", example: "Aᶜ = Ω \\ A" },
      { symbol: "{x | P(x)}", name: "集合描述法", reading: "满足条件 P 的 x", usage: "用条件描述集合元素。", example: "{x ∈ ℝ | x > 0}" },
      { symbol: "|A|", name: "集合势", reading: "A 的大小", usage: "表示有限集合元素个数或集合基数。", example: "|A| = 5" },
    ],
  },
  {
    id: "logic",
    title: "逻辑与证明",
    description: "用于命题连接、量词、推理、证明结论和定义关系。",
    items: [
      { symbol: "¬", name: "非", reading: "非", usage: "表示命题否定。", example: "¬P" },
      { symbol: "∧", name: "且", reading: "并且", usage: "两个命题同时为真。", example: "P ∧ Q" },
      { symbol: "∨", name: "或", reading: "或者", usage: "至少一个命题为真。", example: "P ∨ Q" },
      { symbol: "⇒", name: "推出", reading: "推出", usage: "表示由前一命题可推出后一命题。", example: "x > 2 ⇒ x² > 4" },
      { symbol: "⇔", name: "当且仅当", reading: "等价于 / 当且仅当", usage: "表示两个命题互相推出。", example: "x² = 1 ⇔ x = ±1" },
      { symbol: "∀", name: "全称量词", reading: "对所有", usage: "表示命题对所有对象成立。", example: "∀x ∈ ℝ" },
      { symbol: "∃", name: "存在量词", reading: "存在", usage: "表示至少存在一个对象满足条件。", example: "∃x，使 x² = 4" },
      { symbol: "∄", name: "不存在", reading: "不存在", usage: "表示没有对象满足条件。", example: "∄x ∈ ℝ, x² < 0" },
      { symbol: "∴", name: "所以", reading: "所以", usage: "证明中引出结论。", example: "P ⇒ Q, P, ∴ Q" },
      { symbol: "∵", name: "因为", reading: "因为", usage: "证明中给出理由。", example: "∵ a=b, ∴ a+c=b+c" },
      { symbol: ":=", name: "定义为", reading: "定义为", usage: "表示左侧由右侧定义。", example: "f(x) := x²" },
      { symbol: "□", name: "证毕", reading: "证毕", usage: "放在证明末尾表示证明完成。", example: "因此命题成立。□" },
    ],
  },
  {
    id: "algebra",
    title: "代数与函数",
    description: "用于表达函数、运算、指数、根式、序列和代数结构。",
    items: [
      { symbol: "+", name: "加号", reading: "加", usage: "表示加法或正号。", example: "a + b" },
      { symbol: "−", name: "减号", reading: "减", usage: "表示减法或负号。", example: "a − b" },
      { symbol: "×", name: "乘号", reading: "乘以", usage: "表示乘法，在线代中也可表示叉积。", example: "3 × 4" },
      { symbol: "÷", name: "除号", reading: "除以", usage: "表示除法。", example: "6 ÷ 2" },
      { symbol: "·", name: "点乘号", reading: "乘 / 点乘", usage: "表示乘法或向量点积。", example: "a · b" },
      { symbol: "/", name: "斜杠除法", reading: "除以", usage: "表示分式或比值。", example: "a/b" },
      { symbol: "^", name: "指数记号", reading: "的几次方", usage: "纯文本中表示幂。", example: "x^2" },
      { symbol: "√", name: "根号", reading: "平方根", usage: "表示开方运算。", example: "√9 = 3" },
      { symbol: "|x|", name: "绝对值", reading: "x 的绝对值", usage: "表示数轴上到 0 的距离，也可表示模长。", example: "|-3| = 3" },
      { symbol: "f(x)", name: "函数记号", reading: "f of x", usage: "表示输入 x 后得到的函数值。", example: "f(x) = x² + 1" },
      { symbol: "f⁻¹", name: "反函数", reading: "f inverse", usage: "表示把函数输出映回输入的函数。", example: "f⁻¹(f(x)) = x" },
      { symbol: "∘", name: "复合", reading: "复合", usage: "表示函数复合。", example: "(f ∘ g)(x) = f(g(x))" },
      { symbol: "∑", name: "求和号", reading: "sigma，求和", usage: "表示一列项的总和。", example: "∑ᵢ xᵢ" },
      { symbol: "∏", name: "连乘号", reading: "pi，连乘", usage: "表示一列项的乘积。", example: "∏ᵢ pᵢ" },
      { symbol: "log", name: "对数", reading: "log，对数", usage: "表示指数运算的反函数。", example: "log₂8 = 3" },
      { symbol: "ln", name: "自然对数", reading: "natural log", usage: "以 e 为底的对数。", example: "ln(e) = 1" },
    ],
  },
  {
    id: "calculus",
    title: "微积分",
    description: "用于极限、导数、偏导、积分、变化率和连续累积。",
    items: [
      { symbol: "lim", name: "极限", reading: "limit，极限", usage: "描述变量趋近某点时函数的趋近值。", example: "lim x→0 sin x / x = 1" },
      { symbol: "→", name: "趋近", reading: "趋近于", usage: "表示变量或序列趋向某个值。", example: "x → 0" },
      { symbol: "Δ", name: "有限变化量", reading: "delta，变化量", usage: "表示前后两个量的差。", example: "Δy/Δx" },
      { symbol: "d", name: "微分符号", reading: "dee，微分", usage: "表示微小变化量或导数记号的一部分。", example: "dy/dx" },
      { symbol: "f′(x)", name: "一阶导数", reading: "f prime of x", usage: "表示函数在 x 处的瞬时变化率。", example: "f′(x) = 2x" },
      { symbol: "f″(x)", name: "二阶导数", reading: "f double prime of x", usage: "表示变化率的变化率，常用于凹凸性。", example: "f″(x) > 0" },
      { symbol: "∂", name: "偏导符号", reading: "partial，偏导", usage: "多元函数中对某一个变量求导。", example: "∂f/∂x" },
      { symbol: "∂²", name: "二阶偏导", reading: "second partial", usage: "表示对变量求二阶偏导。", example: "∂²f/∂x²" },
      { symbol: "∫", name: "不定积分", reading: "integral，积分", usage: "表示求原函数或连续累加。", example: "∫ f(x) dx" },
      { symbol: "∫ₐᵇ", name: "定积分", reading: "从 a 到 b 的积分", usage: "表示区间上的净面积或总量。", example: "∫₀¹ x dx" },
      { symbol: "∇", name: "nabla", reading: "纳布拉", usage: "表示梯度、散度或旋度相关运算。", example: "∇f" },
      { symbol: "∇²", name: "拉普拉斯算子", reading: "laplacian", usage: "表示二阶空间变化，常见于微分方程。", example: "∇²f" },
      { symbol: "dx", name: "积分微元", reading: "dee x", usage: "表示积分变量和微小宽度。", example: "∫ f(x) dx" },
      { symbol: "O(dx²)", name: "高阶小量", reading: "order dx squared", usage: "表示近似展开中二阶及以上小量。", example: "f(x+dx)=f(x)+f′(x)dx+O(dx²)" },
    ],
  },
  {
    id: "trig-geometry",
    title: "三角与几何",
    description: "用于角度、三角函数、平行垂直、几何对象和度量关系。",
    items: [
      { symbol: "sin", name: "正弦", reading: "sine，正弦", usage: "直角三角形中对边比斜边，也用于周期函数。", example: "sin θ" },
      { symbol: "cos", name: "余弦", reading: "cosine，余弦", usage: "直角三角形中邻边比斜边，也用于投影。", example: "cos θ" },
      { symbol: "tan", name: "正切", reading: "tangent，正切", usage: "正弦与余弦之比。", example: "tan θ = sin θ / cos θ" },
      { symbol: "arcsin", name: "反正弦", reading: "arc sine", usage: "由正弦值反求角度。", example: "arcsin(1/2)=π/6" },
      { symbol: "°", name: "度", reading: "度", usage: "角度单位。", example: "90°" },
      { symbol: "rad", name: "弧度", reading: "radian，弧度", usage: "以半径为基准的角度单位。", example: "π rad = 180°" },
      { symbol: "∠", name: "角", reading: "角", usage: "表示几何角。", example: "∠ABC" },
      { symbol: "△", name: "三角形", reading: "三角形", usage: "表示由三点构成的三角形。", example: "△ABC" },
      { symbol: "⊥", name: "垂直", reading: "垂直于", usage: "表示两条线或向量成直角。", example: "AB ⊥ CD" },
      { symbol: "∥", name: "平行", reading: "平行于", usage: "表示两条线方向相同或不相交。", example: "AB ∥ CD" },
      { symbol: "≅", name: "全等", reading: "全等于", usage: "表示几何图形形状和大小都相同。", example: "△ABC ≅ △DEF" },
      { symbol: "∼", name: "相似", reading: "相似于", usage: "表示几何图形形状相同但大小可不同。", example: "△ABC ∼ △DEF" },
    ],
  },
  {
    id: "linear-algebra",
    title: "线性代数",
    description: "用于向量、矩阵、转置、逆、秩、迹、行列式和空间结构。",
    items: [
      { symbol: "v⃗", name: "向量", reading: "向量 v", usage: "表示有方向和大小的量，也可表示特征数组。", example: "v⃗ = (1, 2)" },
      { symbol: "A", name: "矩阵", reading: "矩阵 A", usage: "表示按行列排列的数表或线性变换。", example: "A ∈ ℝᵐˣⁿ" },
      { symbol: "Aᵀ", name: "转置", reading: "A transpose，A 的转置", usage: "将矩阵的行列互换。", example: "(Aᵀ)ᵢⱼ = Aⱼᵢ" },
      { symbol: "A⁻¹", name: "逆矩阵", reading: "A inverse，A 的逆", usage: "满足 AA⁻¹ = I 的矩阵。", example: "x = A⁻¹b" },
      { symbol: "I", name: "单位矩阵", reading: "identity matrix", usage: "对角线为 1、其他为 0 的矩阵。", example: "AI = A" },
      { symbol: "0", name: "零矩阵或零向量", reading: "zero", usage: "所有元素均为 0 的向量或矩阵。", example: "Ax = 0" },
      { symbol: "det(A)", name: "行列式", reading: "determinant", usage: "用于判断矩阵是否可逆，也表示体积缩放。", example: "det(A) ≠ 0" },
      { symbol: "rank(A)", name: "秩", reading: "rank of A", usage: "表示矩阵线性独立行或列的最大数量。", example: "rank(A)=n" },
      { symbol: "tr(A)", name: "迹", reading: "trace of A", usage: "表示方阵主对角线元素之和。", example: "tr(A)=Σaᵢᵢ" },
      { symbol: "span", name: "张成空间", reading: "span", usage: "由一组向量线性组合形成的空间。", example: "span{v₁,v₂}" },
      { symbol: "dim", name: "维数", reading: "dimension", usage: "表示空间的自由方向数量。", example: "dim(V)=n" },
      { symbol: "ker(A)", name: "核空间", reading: "kernel", usage: "被矩阵 A 映到零向量的向量集合。", example: "ker(A)={x|Ax=0}" },
      { symbol: "‖x‖", name: "范数", reading: "x 的范数", usage: "度量向量大小或距离。", example: "‖x‖₂" },
      { symbol: "⟨x,y⟩", name: "内积", reading: "x 和 y 的内积", usage: "度量向量相似度、夹角和投影。", example: "⟨x,y⟩ = xᵀy" },
    ],
  },
  {
    id: "probability",
    title: "概率",
    description: "用于随机事件、条件概率、独立性、随机变量和分布。",
    items: [
      { symbol: "Ω", name: "样本空间", reading: "omega，样本空间", usage: "表示所有可能结果的集合。", example: "A ⊆ Ω" },
      { symbol: "P(A)", name: "概率", reading: "A 的概率", usage: "表示事件 A 发生的可能性。", example: "0 ≤ P(A) ≤ 1" },
      { symbol: "P(A|B)", name: "条件概率", reading: "给定 B 时 A 的概率", usage: "表示 B 已发生条件下 A 发生的概率。", example: "P(A|B)=P(A∩B)/P(B)" },
      { symbol: "A ⟂ B", name: "事件独立", reading: "A 与 B 独立", usage: "表示一个事件发生不改变另一个事件概率。", example: "P(A∩B)=P(A)P(B)" },
      { symbol: "X ⟂ Y", name: "随机变量独立", reading: "X 与 Y 独立", usage: "表示两个随机变量概率结构相互独立。", example: "f(x,y)=fX(x)fY(y)" },
      { symbol: "X ~ F", name: "服从分布", reading: "X 服从 F", usage: "表示随机变量 X 的分布类型。", example: "X ~ N(0,1)" },
      { symbol: "iid", name: "独立同分布", reading: "i i d", usage: "表示样本彼此独立且服从相同分布。", example: "X₁,...,Xₙ iid" },
      { symbol: "pdf", name: "概率密度函数", reading: "p d f", usage: "连续随机变量的密度函数。", example: "fX(x)" },
      { symbol: "pmf", name: "概率质量函数", reading: "p m f", usage: "离散随机变量每个取值的概率。", example: "P(X=k)" },
      { symbol: "cdf", name: "分布函数", reading: "c d f", usage: "表示 P(X≤x) 的累计概率。", example: "F(x)=P(X≤x)" },
      { symbol: "E(X)", name: "期望", reading: "X 的期望", usage: "表示随机变量的长期平均值。", example: "E(X)=μ" },
      { symbol: "Var(X)", name: "方差", reading: "X 的方差", usage: "度量随机变量相对期望的波动大小。", example: "Var(X)=σ²" },
      { symbol: "Cov(X,Y)", name: "协方差", reading: "X 和 Y 的协方差", usage: "度量两个随机变量共同变化的方向和强度。", example: "Cov(X,Y)>0" },
      { symbol: "Corr(X,Y)", name: "相关系数", reading: "X 和 Y 的相关", usage: "标准化后的线性相关强度。", example: "Corr(X,Y)=ρ" },
    ],
  },
  {
    id: "statistics",
    title: "统计推断",
    description: "用于样本统计量、估计、检验、置信区间和误差度量。",
    items: [
      { symbol: "x̄", name: "样本均值", reading: "x bar", usage: "样本观测值的平均数。", example: "x̄ = Σxᵢ/n" },
      { symbol: "s²", name: "样本方差", reading: "s squared", usage: "样本波动程度的估计。", example: "s² = Σ(xᵢ-x̄)²/(n-1)" },
      { symbol: "s", name: "样本标准差", reading: "s", usage: "样本方差的平方根。", example: "s = √s²" },
      { symbol: "SE", name: "标准误", reading: "standard error", usage: "估计量抽样波动的标准差。", example: "SE(x̄)=σ/√n" },
      { symbol: "H₀", name: "原假设", reading: "H naught", usage: "统计检验中默认要检验的假设。", example: "H₀: μ=0" },
      { symbol: "H₁", name: "备择假设", reading: "H one", usage: "与原假设相对的研究假设。", example: "H₁: μ≠0" },
      { symbol: "p-value", name: "p 值", reading: "p value", usage: "在原假设下观察到当前或更极端结果的概率。", example: "p-value < 0.05" },
      { symbol: "CI", name: "置信区间", reading: "confidence interval", usage: "按给定置信水平构造的参数估计区间。", example: "95% CI" },
      { symbol: "df", name: "自由度", reading: "degrees of freedom", usage: "统计量中可自由变化的信息数量。", example: "df = n - 1" },
      { symbol: "z", name: "z 统计量", reading: "z score", usage: "标准正态尺度下的统计量或分数。", example: "z=(x-μ)/σ" },
      { symbol: "t", name: "t 统计量", reading: "t statistic", usage: "总体方差未知时常用的检验统计量。", example: "t=(x̄-μ)/(s/√n)" },
      { symbol: "R²", name: "决定系数", reading: "R squared", usage: "回归模型解释方差的比例。", example: "R²=0.82" },
      { symbol: "MLE", name: "最大似然估计", reading: "M L E", usage: "使观测数据似然最大的参数估计方法。", example: "θ̂MLE" },
      { symbol: "θ̂", name: "估计量", reading: "theta hat", usage: "表示参数 θ 的估计值。", example: "θ̂ = 1.7" },
    ],
  },
  {
    id: "discrete-number-theory",
    title: "离散、组合与数论",
    description: "用于整除、同余、阶乘、排列组合、取整和图论。",
    items: [
      { symbol: "n!", name: "阶乘", reading: "n factorial", usage: "表示从 1 到 n 的所有正整数连乘。", example: "5! = 120" },
      { symbol: "C(n,k)", name: "组合数", reading: "n choose k", usage: "表示从 n 个对象中无序选 k 个的方式数。", example: "C(n,k)=n!/[k!(n-k)!]" },
      { symbol: "P(n,k)", name: "排列数", reading: "n permute k", usage: "表示从 n 个对象中有序选 k 个的方式数。", example: "P(n,k)=n!/(n-k)!" },
      { symbol: "∣", name: "整除", reading: "整除", usage: "a ∣ b 表示 b 能被 a 整除。", example: "3 ∣ 12" },
      { symbol: "∤", name: "不整除", reading: "不整除", usage: "表示不能整除。", example: "5 ∤ 12" },
      { symbol: "mod", name: "模", reading: "modulo，模", usage: "表示除法余数或同余关系中的模数。", example: "17 mod 5 = 2" },
      { symbol: "gcd", name: "最大公约数", reading: "greatest common divisor", usage: "两个或多个整数共有约数中最大的一个。", example: "gcd(12,18)=6" },
      { symbol: "lcm", name: "最小公倍数", reading: "least common multiple", usage: "两个或多个整数共有倍数中最小的正数。", example: "lcm(4,6)=12" },
      { symbol: "⌊x⌋", name: "下取整", reading: "floor x", usage: "不超过 x 的最大整数。", example: "⌊3.8⌋=3" },
      { symbol: "⌈x⌉", name: "上取整", reading: "ceiling x", usage: "不小于 x 的最小整数。", example: "⌈3.2⌉=4" },
      { symbol: "G=(V,E)", name: "图", reading: "graph G", usage: "由顶点集合 V 和边集合 E 构成。", example: "G=(V,E)" },
      { symbol: "deg(v)", name: "顶点度", reading: "degree of v", usage: "图中与顶点 v 相连的边数。", example: "deg(v)=3" },
    ],
  },
  {
    id: "asymptotic",
    title: "渐近与复杂度",
    description: "用于比较函数增长速度、算法复杂度和极限阶。",
    items: [
      { symbol: "O(f)", name: "大 O", reading: "big O", usage: "表示增长速度至多与 f 同阶，常作上界。", example: "T(n)=O(n²)" },
      { symbol: "o(f)", name: "小 o", reading: "little o", usage: "表示相比 f 可忽略，比例趋于 0。", example: "log n = o(n)" },
      { symbol: "Ω(f)", name: "大 Omega", reading: "big omega", usage: "表示增长速度至少与 f 同阶，常作下界。", example: "T(n)=Ω(n)" },
      { symbol: "ω(f)", name: "小 omega", reading: "little omega", usage: "表示相比 f 增长更快，比例趋于无穷。", example: "n² = ω(n)" },
      { symbol: "Θ(f)", name: "Theta", reading: "theta", usage: "表示上下界同阶。", example: "T(n)=Θ(n log n)" },
      { symbol: "~", name: "渐近等价", reading: "tilde，渐近等价", usage: "表示两个函数比值趋于 1。", example: "f(n) ~ g(n)" },
      { symbol: "≲", name: "小于常数倍", reading: "less up to constant", usage: "表示在常数因子内不超过。", example: "f ≲ g" },
      { symbol: "≳", name: "大于常数倍", reading: "greater up to constant", usage: "表示在常数因子内不小于。", example: "f ≳ g" },
      { symbol: "poly(n)", name: "多项式阶", reading: "polynomial", usage: "表示某个 n 的多项式增长。", example: "poly(n)" },
      { symbol: "exp(n)", name: "指数阶", reading: "exponential", usage: "表示指数增长。", example: "exp(n)=eⁿ" },
    ],
  },
];

const originalPronunciationByReading: Record<string, string> = {
  "A 与 B 独立": "A is independent of B",
  "A 的大小": "cardinality of A",
  "A 的概率": "probability of A",
  "A 的补集": "complement of A",
  "X 与 Y 独立": "X is independent of Y",
  "X 和 Y 的协方差": "covariance of X and Y",
  "X 和 Y 的相关": "correlation of X and Y",
  "X 服从 F": "X is distributed as F",
  "X 的方差": "variance of X",
  "X 的期望": "expected value of X",
  "x 和 y 的内积": "inner product of x and y",
  "x 的绝对值": "absolute value of x",
  "x 的范数": "norm of x",
  "三角形": "triangle",
  "不存在": "there does not exist",
  "不属于": "not an element of",
  "不整除": "does not divide",
  "不等于": "not equal to",
  "乘 / 点乘": "times, or dot product",
  "乘以": "times",
  "交": "intersection",
  "从 a 到 b 的积分": "integral from a to b",
  "伽马": "gamma",
  "全等于": "congruent to",
  "兰姆达": "lambda",
  "减": "minus",
  "加": "plus",
  "包含": "superset of",
  "包含于": "subset of",
  "卡": "chi",
  "向量 v": "vector v",
  "因为": "because",
  "垂直于": "perpendicular to",
  "复合": "composed with",
  "复数 C": "complex numbers",
  "大于": "greater than",
  "大于或等于": "greater than or equal to",
  "存在": "there exists",
  "定义为": "defined as",
  "实数 R": "real numbers",
  "对所有": "for all",
  "小于": "less than",
  "小于或等于": "less than or equal to",
  "属于": "element of",
  "差": "set difference",
  "平方根": "square root",
  "平行于": "parallel to",
  "并": "union",
  "并且": "and",
  "度": "degrees",
  "德尔塔": "delta",
  "恒等于 / 同余于": "identical to, or congruent to",
  "或者": "or",
  "所以": "therefore",
  "推出": "implies",
  "整数 Z": "integers",
  "整除": "divides",
  "斐": "phi",
  "无穷大": "infinity",
  "有理数 Q": "rational numbers",
  "柔": "rho",
  "欧米伽": "omega",
  "正比于": "proportional to",
  "正负": "plus or minus",
  "派": "pi",
  "满足条件 P 的 x": "the set of x such that P of x",
  "的几次方": "to the power of",
  "相似于": "similar to",
  "相似于 / 渐近等价": "similar to, or asymptotic to",
  "真包含": "proper superset of",
  "真包含于": "proper subset of",
  "矩阵 A": "matrix A",
  "空集": "empty set",
  "等于": "equals",
  "等价于 / 当且仅当": "if and only if",
  "约等于": "approximately equal to",
  "纳布拉": "nabla",
  "纽": "nu",
  "给定 B 时 A 的概率": "probability of A given B",
  "缪": "mu",
  "自然数 N": "natural numbers",
  "艾普西龙": "epsilon",
  "西塔": "theta",
  "西格玛": "sigma",
  "角": "angle",
  "证毕": "Q E D",
  "贝塔": "beta",
  "趋近于": "approaches",
  "远大于": "much greater than",
  "远小于": "much less than",
  "阿尔法": "alpha",
  "除以": "divided by",
  "陶": "tau",
  "非": "not",
};

function getOriginalPronunciation(reading: string) {
  const mapped = originalPronunciationByReading[reading];

  if (mapped) {
    return mapped;
  }

  const englishPrefix = reading.split("，")[0]?.trim();

  return englishPrefix || reading;
}

const chineseTeacherPronunciationByReading: Record<string, string> = {
  "空集": "空集",
  "自然数 N": "自然数集",
  "整数 Z": "整数集",
  "有理数 Q": "有理数集",
  "实数 R": "实数集",
  "复数 C": "复数集",
  "无穷大": "无穷",
  "派": "派",
  "正负": "正负",
  "阿尔法": "阿尔法",
  "贝塔": "贝塔",
  "伽马": "伽马",
  "德尔塔": "德尔塔",
  "艾普西龙": "艾普西龙",
  "西塔": "西塔",
  "兰姆达": "兰姆达",
  "缪": "缪",
  "纽": "纽",
  "柔": "柔",
  "西格玛": "西格玛",
  "陶": "陶",
  "斐": "斐",
  "卡": "卡",
  "欧米伽": "欧米伽",
  "等于": "等于",
  "不等于": "不等于",
  "约等于": "约等于",
  "恒等于 / 同余于": "恒等于",
  "小于": "小于",
  "大于": "大于",
  "小于或等于": "小于等于",
  "大于或等于": "大于等于",
  "远小于": "远小于",
  "远大于": "远大于",
  "正比于": "正比于",
  "相似于 / 渐近等价": "相似于",
  "属于": "属于",
  "不属于": "不属于",
  "真包含于": "真包含于",
  "包含于": "包含于",
  "真包含": "真包含",
  "包含": "包含",
  "并": "并",
  "交": "交",
  "差": "差",
  "满足条件 P 的 x": "所有满足 P 的 x",
  "非": "非",
  "并且": "且",
  "或者": "或",
  "推出": "推出",
  "等价于 / 当且仅当": "当且仅当",
  "对所有": "任意",
  "存在": "存在",
  "不存在": "不存在",
  "所以": "所以",
  "因为": "因为",
  "定义为": "定义为",
  "证毕": "证毕",
  "加": "加",
  "减": "减",
  "乘以": "乘",
  "除以": "除以",
  "乘 / 点乘": "点乘",
  "的几次方": "次方",
  "平方根": "根号",
  "复合": "复合",
  "趋近于": "趋于",
  "从 a 到 b 的积分": "从 a 到 b 的积分",
  "纳布拉": "纳布拉",
  "度": "度",
  "角": "角",
  "三角形": "三角形",
  "垂直于": "垂直于",
  "平行于": "平行于",
  "全等于": "全等于",
  "相似于": "相似于",
  "向量 v": "向量 v",
  "矩阵 A": "矩阵 A",
  "给定 B 时 A 的概率": "B 条件下 A 的概率",
  "整除": "整除",
  "不整除": "不整除",
  "A inverse，A 的逆": "A 逆",
  "A transpose，A 的转置": "A 转置",
  "A 与 B 独立": "A 与 B 独立",
  "A 的大小": "A 的势",
  "A 的概率": "P A",
  "A 的补集": "A 补",
  "H naught": "H 零",
  "H one": "H 一",
  "M L E": "M L E",
  "R squared": "R 方",
  "X 与 Y 独立": "X 与 Y 独立",
  "X 和 Y 的协方差": "X Y 的协方差",
  "X 和 Y 的相关": "X Y 的相关系数",
  "X 服从 F": "X 服从 F",
  "X 的方差": "D X",
  "X 的期望": "E X",
  "arc sine": "反正弦",
  "big O": "大 O",
  "big omega": "大欧米伽",
  "c d f": "C D F",
  "ceiling x": "x 上取整",
  "confidence interval": "置信区间",
  "cosine，余弦": "余弦",
  "dee x": "d x",
  "dee，微分": "d",
  "degree of v": "v 的度",
  "degrees of freedom": "自由度",
  "delta，变化量": "德尔塔",
  "determinant": "行列式",
  "dimension": "维数",
  "e": "e",
  "exponential": "指数",
  "f double prime of x": "f 二撇 x",
  "f inverse": "f 逆",
  "f of x": "f x",
  "f prime of x": "f 撇 x",
  "floor x": "x 下取整",
  "graph G": "图 G",
  "greater up to constant": "大于常数倍",
  "greatest common divisor": "最大公约数",
  "i": "i",
  "i i d": "独立同分布",
  "identity matrix": "单位矩阵",
  "integral，积分": "积分",
  "kernel": "核",
  "laplacian": "拉普拉斯",
  "least common multiple": "最小公倍数",
  "less up to constant": "小于常数倍",
  "limit，极限": "极限",
  "little o": "小 o",
  "little omega": "小欧米伽",
  "log，对数": "log",
  "modulo，模": "模",
  "n choose k": "C n k",
  "n factorial": "n 的阶乘",
  "n permute k": "P n k",
  "natural log": "ln",
  "not a number": "非数",
  "omega，样本空间": "欧米伽",
  "order dx squared": "d x 平方阶",
  "p d f": "P D F",
  "p m f": "P M F",
  "p value": "P 值",
  "partial，偏导": "偏",
  "pi，连乘": "连乘",
  "polynomial": "多项式阶",
  "radian，弧度": "弧度",
  "rank of A": "A 的秩",
  "s": "s",
  "s squared": "s 方",
  "second partial": "二阶偏导",
  "sigma，求和": "求和",
  "sine，正弦": "正弦",
  "span": "张成",
  "standard error": "标准误",
  "t statistic": "t 统计量",
  "tangent": "正切",
  "tangent，正切": "正切",
  "theta": "西塔",
  "theta hat": "西塔帽",
  "tilde，渐近等价": "波浪号",
  "trace of A": "A 的迹",
  "x bar": "x 拔",
  "x 和 y 的内积": "x y 内积",
  "x 的绝对值": "x 的绝对值",
  "x 的范数": "x 的范数",
  "z score": "z 分数",
  "zero": "零",
};

function getChineseTeacherPronunciation(item: SymbolItem) {
  return normalizeChineseTeacherLetters(
    chineseTeacherPronunciationByReading[item.reading] ?? item.reading,
  );
}

const chineseLetterPronunciations: Record<string, string> = {
  A: "诶",
  B: "比",
  C: "西",
  D: "迪",
  E: "伊",
  F: "艾弗",
  G: "基",
  H: "艾尺",
  I: "爱",
  J: "杰",
  K: "开",
  L: "艾勒",
  M: "艾姆",
  N: "恩",
  O: "欧",
  P: "批",
  Q: "扣",
  R: "阿尔",
  S: "艾丝",
  T: "踢",
  U: "优",
  V: "维",
  W: "达不溜",
  X: "艾克斯",
  Y: "歪",
  Z: "贼德",
  a: "诶",
  b: "比",
  c: "西",
  d: "迪",
  e: "伊",
  f: "艾弗",
  g: "基",
  h: "艾尺",
  i: "爱",
  j: "杰",
  k: "开",
  l: "艾勒",
  m: "艾姆",
  n: "恩",
  o: "欧",
  p: "批",
  q: "扣",
  r: "阿尔",
  s: "艾丝",
  t: "踢",
  u: "优",
  v: "维",
  w: "达不溜",
  x: "艾克斯",
  y: "歪",
  z: "贼德",
};

function normalizeChineseTeacherLetters(text: string) {
  return text.replace(/\b[A-Za-z]\b/g, (letter) => {
    return chineseLetterPronunciations[letter] ?? letter;
  });
}

function getSymbolAudioPath(categoryId: string, item: SymbolItem) {
  return getSymbolAudioPathForKind("math-symbols", categoryId, item);
}

function getChineseTeacherAudioPath(categoryId: string, item: SymbolItem) {
  return getSymbolAudioPathForKind("math-symbols-cn", categoryId, item);
}

function getSymbolAudioPathForKind(
  kind: "math-symbols" | "math-symbols-cn",
  categoryId: string,
  item: SymbolItem,
) {
  const hash = createHash("sha1")
    .update(`${categoryId}:${item.symbol}:${item.name}`)
    .digest("hex")
    .slice(0, 12);

  return `/audio/${kind}/${hash}.m4a`;
}

export default async function MathSymbolsPage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string }>;
}) {
  const current = await requireCurrentLearner();
  const params = await searchParams;
  const learningDomain = await resolveLearningDomain(params.domain, current.learner.id);
  const symbolCount = symbolCategories.reduce(
    (total, category) => total + category.items.length,
    0,
  );

  return (
    <PhaseShell
      activePath="/math-symbols"
      eyebrow="更多工具"
      title="数学符号速查"
      description="按类别整理常见数学符号的读音、用途和典型写法，帮助你把公式里的符号读顺、用准。"
      learningDomain={learningDomain}
    >
      <MathSymbolsOverview
        symbolCount={symbolCount}
        categoryCount={symbolCategories.length}
        categories={symbolCategories.map((category) => ({
          id: category.id,
          title: category.title,
        }))}
      />

      <div className="grid gap-5">
        {symbolCategories.map((category) => (
          <section
            key={category.id}
            id={category.id}
            className="scroll-mt-72 rounded-lg border bg-background p-5 shadow-sm lg:scroll-mt-44"
          >
            <div className="mb-4 flex flex-col gap-3 border-b pb-4 md:flex-row md:items-start md:justify-between">
              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <FunctionSquare data-icon="inline-start" className="text-muted-foreground" />
                  <h2 className="text-xl font-semibold">{category.title}</h2>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">
                  {category.description}
                </p>
              </div>
              <Badge variant="outline">
                <Hash data-icon="inline-start" />
                {category.items.length} 个
              </Badge>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {category.items.map((item) => (
                <article
                  key={`${category.id}:${item.symbol}:${item.name}`}
                  className="grid gap-3 rounded-lg border p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-4xl font-semibold leading-none">
                        {item.symbol}
                      </p>
                      <h3 className="mt-3 font-semibold">{item.name}</h3>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      {item.reading}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <SymbolAudioButton
                      text={getOriginalPronunciation(item.reading)}
                      audioSrc={getSymbolAudioPath(category.id, item)}
                      label={`播放${item.name}的原始读音`}
                    >
                      原音
                    </SymbolAudioButton>
                    <SymbolAudioButton
                      text={getChineseTeacherPronunciation(item)}
                      audioSrc={getChineseTeacherAudioPath(category.id, item)}
                      label={`播放${item.name}的中国老师读音`}
                      lang="zh-CN"
                    >
                      中式
                    </SymbolAudioButton>
                  </div>

                  <div className="grid gap-2 text-sm leading-6">
                    <p>
                      <span className="font-medium text-foreground">用法：</span>
                      <span className="text-muted-foreground">{item.usage}</span>
                    </p>
                    <p>
                      <span className="font-medium text-foreground">例子：</span>
                      <span className="text-muted-foreground">{item.example}</span>
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </PhaseShell>
  );
}
