"use client";

import { useState } from "react";
import Link from "next/link";
import { useCurrentLocale } from "@/lib/i18n/client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Layers,
  Code,
  Terminal,
  ShieldCheck,
  Award,
  Database,
  Cpu,
  RefreshCw,
  BookOpen,
  ArrowLeft,
  ChevronRight
} from "lucide-react";

// ==========================================
// STRING CONSTANTS FOR SYSTEM SPECIFICATIONS
// ==========================================

const SYSTEM_OVERVIEW_FLOW = `[Browser (Next.js Client)] 
       │
       │ (CORS Preflight + HTTPS REST Request)
       │ (Authorization: Bearer <Firebase_JWT_ID_Token>)
       ▼
[NestJS API Gateway / Backend Service]
       │
       ├─► [AuthGuard] (Verify Token Signature via Firebase Admin SDK)
       ├─► [ValidationPipe] (DTO Validation & Type Cast)
       ▼
 [Controller] ──► [Service] ──► [Firestore DB] (Scoped by Verified User UID)
                                 ▲
                                 └─► [AI Service] ──► [Gemini Pro API]`;

const OPTIMISTIC_UPDATE_FLOW = `1. 用户操作触发事件（如删除卡片）。
2. UI 线程保存当前状态镜像 const prevCards = [...cards]。
3. 立即触发本地渲染状态 setCards(cards.filter(c => c.id !== targetId))。
4. 后台执行 API 请求 await apiClient.delete(...）。
5. 若请求失败，在 catch 块中回滚：setCards(prevCards) 并弹出 Toast。`;

const OPTIMISTIC_UPDATE_FLOW_EN = `1. User triggers an action (e.g., deletes a card).
2. UI thread captures state snapshot: const prevCards = [...cards].
3. Local UI state updates instantly: setCards(cards.filter(c => c.id !== targetId)) (0ms delay).
4. Asynchronous API request is sent in background.
5. Upon failure, the catch block restores state: setCards(prevCards) and shows toast.`;

const DELETE_FLASHCARD_CODE = `// src/contexts/FlashcardsContext.tsx 中删除卡片的真实工程实现
const deleteFlashcard = async (cardId: string): Promise<boolean> => {
  // 1. 获取当前状态的深拷贝镜像，作为回滚断点
  const rollbackBackup = [...flashcards];

  // 2. 乐观更新：同步修改本地 State，驱动 UI 重新渲染（0ms 响应）
  setFlashcards((prev) => prev.filter((card) => card.id !== cardId));

  try {
    // 3. 异步向 BFF 发起物理删除请求
    const response = await apiClient.delete(\`/flashcards/\${cardId}\`);
    if (!response.success) {
      throw new Error("API responded with failure status");
    }
    return true;
  } catch (error) {
    // 4. 出现网络超时、CORS 拦截或 500 异常时，将状态退回到备份镜像
    setFlashcards(rollbackBackup);
    
    // 5. 将系统级错误格式化并弹出友好提示
    console.error("Optimistic Update failed. Rolling back...", error);
    showToast(
      isZh ? "删除卡片失败，网络连接异常" : "Failed to delete card due to network issues",
      "destructive"
    );
    return false;
  }
};`;

const NESTJS_PIPELINE_FLOW = `Request ──► Middleware (Logger) ──► Guards (AuthGuard JWT) ──► Interceptors (Timing) ──► Pipes (DTO Validation) ──► Controller (Routing) ──► Service (Business/TX) ──► Response`;

const DTO_VALIDATION_CODE = `// src/tasks/dto/create-task.dto.ts
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  readonly title: string;

  @IsOptional()
  @IsString()
  readonly notes?: string;
}`;

const AUTH_GUARD_CODE = `// src/auth/auth.guard.ts 核心签名解密与验证实现
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly firebaseService: FirebaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or malformed Authorization header');
    }

    const token = authHeader.split(' ')[1];
    try {
      // 1. 调用 Admin SDK 验签：包含非对称签名解密、证书缓存与失效检查
      const decodedToken = await this.firebaseService.auth.verifyIdToken(token);
      
      // 2. 将可信 UID 注入 request 上下文
      request.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
      };
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired credential');
    }
  }
}`;

const CASCADE_DELETE_CODE = `// src/decks/decks.service.ts 中的级联删除事务实现
async function deleteDeckCascading(userId: string, deckId: string): Promise<void> {
  const deckRef = this.db.collection(\`users/\${userId}/decks\`).doc(deckId);
  const cardsCollectionRef = this.db.collection(\`users/\${userId}/flashcards\`);

  await this.db.runTransaction(async (transaction) => {
    // 1. 首先在隔离事务块中执行读取操作
    const cardsSnapshot = await transaction.get(
      cardsCollectionRef.where('deckId', '==', deckId)
    );

    const deckDoc = await transaction.get(deckRef);
    if (!deckDoc.exists) {
      throw new NotFoundException('Target deck not found');
    }

    // 2. 依次登记删除指令
    cardsSnapshot.docs.forEach((doc) => {
      transaction.delete(doc.ref);
    });

    transaction.delete(deckRef);
  });
}`;

const GEMINI_CONFIG_CODE = `// src/ai/ai.service.ts
import { GoogleGenAI } from '@google/genai';

async function generateCardsFromText(prompt: string): Promise<CardDto[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY });

  const response = await ai.models.generateContent({
    model: 'gemini-1.5-pro',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'ARRAY',
        description: 'List of generated active recall flashcards.',
        items: {
          type: 'OBJECT',
          properties: {
            front: { type: 'STRING' },
            back: { type: 'STRING' }
          },
          required: ['front', 'back']
        }
      }
    }
  });

  return JSON.parse(response.text);
}`;

// ==========================================
// REACT COMPONENT COMPILING ROUTE
// ==========================================

export default function DocsPage() {
  const currentLocale = useCurrentLocale();
  const isZh = currentLocale === "zh";
  const [activeSection, setActiveSection] = useState("system-overview");

  const sections = isZh
    ? [
        {
          id: "system-overview",
          title: "1. 整体架构与拓扑设计",
          icon: Layers,
          subtitle: "前后端物理分离与 BFF 架构演进",
        },
        {
          id: "frontend",
          title: "2. 前端架构与乐观状态回滚",
          icon: Code,
          subtitle: "Client Contexts 与乐观 UI 更新机制",
        },
        {
          id: "backend",
          title: "3. 后端管线与 DTO 运行时校验",
          icon: Terminal,
          subtitle: "NestJS 请求生命周期与拦截器",
        },
        {
          id: "security",
          title: "4. 安全体系与数据物理隔离",
          icon: ShieldCheck,
          subtitle: "Firebase JWT 签名解密与防越权设计",
        },
        {
          id: "spaced-rep",
          title: "5. 记忆模型算法与数学建模",
          icon: Award,
          subtitle: "SuperMemo SM-2 间隔重复的核心算法",
        },
        {
          id: "db-tx",
          title: "6. 数据一致性与原子事务",
          icon: Database,
          subtitle: "Firestore Transactions 乐观锁级联删除",
        },
        {
          id: "ai-pipeline",
          title: "7. AI 管道与强 Schema 约束",
          icon: Cpu,
          subtitle: "Gemini Pro 格式化输出与客户端缓存",
        },
        {
          id: "pwa-sync",
          title: "8. 状态同步与离线高可用",
          icon: RefreshCw,
          subtitle: "Workbox 缓存策略与心跳轮询设计",
        },
      ]
    : [
        {
          id: "system-overview",
          title: "1. Overall Decoupled Architecture",
          icon: Layers,
          subtitle: "Two-Tier Decoupled Design via REST & Bearer Tokens",
        },
        {
          id: "frontend",
          title: "2. Frontend & Optimistic UI State",
          icon: Code,
          subtitle: "Client Contexts & Optimistic UI Updates",
        },
        {
          id: "backend",
          title: "3. Backend Lifecycles & DTO Validation",
          icon: Terminal,
          subtitle: "NestJS Request Pipeline & Interceptors",
        },
        {
          id: "security",
          title: "4. Cryptographic Security & Scoping",
          icon: ShieldCheck,
          subtitle: "Firebase JWT Verification & Data Isolation",
        },
        {
          id: "spaced-rep",
          title: "5. Memory Model & Math Equations",
          icon: Award,
          subtitle: "SuperMemo SM-2 Algorithm Implementation",
        },
        {
          id: "db-tx",
          title: "6. Transactional Consistency",
          icon: Database,
          subtitle: "Firestore Optimistic Lock Cascade Deletion",
        },
        {
          id: "ai-pipeline",
          title: "7. Structured AI Generation Pipeline",
          icon: Cpu,
          subtitle: "Gemini Pro JSON Schema & Client-Side Caching",
        },
        {
          id: "pwa-sync",
          title: "8. Synchronization & Offline Resilience",
          icon: RefreshCw,
          subtitle: "Workbox Caching Strategy & Heartbeat Polling",
        },
      ];

  const handleScrollTo = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background flex flex-col">
      <div className="border-b bg-muted/40 py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-1">
                <ArrowLeft className="h-4 w-4" />
                {isZh ? "返回应用" : "Back to Application"}
              </Button>
            </Link>
            <Separator orientation="vertical" className="h-5" />
            <div className="flex items-center gap-1.5 font-semibold text-sm sm:text-base">
              <BookOpen className="h-4 w-4 text-primary" />
              <span>{isZh ? "系统设计与架构文档" : "Engineering & System Design Docs"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row gap-6 p-4 sm:p-6 min-h-0">
        {/* Left Sidebar - Navigation */}
        <aside className="w-full md:w-80 flex-shrink-0 md:sticky md:top-20 md:h-[calc(100vh-9rem)] flex flex-col gap-2">
          <div className="px-3 py-1 text-xs font-bold text-muted-foreground uppercase tracking-widest">
            {isZh ? "文档目录" : "Table of Contents"}
          </div>
          <ScrollArea className="flex-1 pr-2">
            <nav className="flex flex-col gap-1.5">
              {sections.map((sec) => {
                const Icon = sec.icon;
                const isActive = activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => handleScrollTo(sec.id)}
                    className={`w-full text-left flex items-center gap-3 px-3.5 py-3 rounded-lg text-xs sm:text-sm font-medium transition-all border ${
                      isActive
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground border-transparent"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{sec.title}</p>
                      <p className={`text-[10px] truncate ${isActive ? "text-primary-foreground/85" : "text-muted-foreground/70"}`}>
                        {sec.subtitle}
                      </p>
                    </div>
                    <ChevronRight className={`h-3 w-3 shrink-0 opacity-60 ${isActive ? "block" : "hidden md:block"}`} />
                  </button>
                );
              })}
            </nav>
          </ScrollArea>
        </aside>

        {/* Right Content Area */}
        <main className="flex-1 min-w-0 bg-card border rounded-xl shadow-sm p-4 sm:p-8">
          <ScrollArea className="h-full md:h-[calc(100vh-11rem)] pr-2 sm:pr-4">
            <div className="space-y-12 pb-20">
              {/* Introduction */}
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {isZh ? "系统设计白皮书与技术规范" : "System Architecture & Engineering Specification"}
                </h1>
                <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {isZh
                    ? "本文档阐述了 FlashFlow 应用程序的技术规范。系统采用前后端解耦的多层服务拓扑设计，旨在满足高数据一致性、弹性离线高可用支持以及可扩展的结构化人工智能服务集成。"
                    : "This document outlines the technical specifications of the FlashFlow application. The system implements a decoupled, multi-tier service topology designed to achieve rigorous data consistency, resilient offline capability, and structured artificial intelligence services."}
                </p>
                <Separator className="mt-6" />
              </div>

              {/* 1. Overall Architecture */}
              <section id="system-overview" className="scroll-mt-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Layers className="h-6 w-6 text-primary" />
                  <h2 className="text-xl sm:text-2xl font-bold">{isZh ? "1. 整体架构与服务拓扑" : "1. Overall Decoupled Architecture & Service Topology"}</h2>
                </div>
                <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
                  <p>
                    {isZh
                      ? "系统采用基于表示层（Presentation Layer）与应用服务层（Application Layer）解耦的双层云原生架构。前端主要承载人机交互与状态同步分发，后端（BFF 模式）提供安全沙箱、业务 API 网关以及基础设施连接。"
                      : "The system implements a decoupled two-tier cloud-native architecture separating the presentation layer from the application service layer. The frontend hosts user interactions and state synchronization, while the backend acts as a secure BFF (Backend-for-Frontend) gateway."}
                  </p>
                  <pre className="bg-muted p-3.5 rounded-lg font-mono text-[10px] sm:text-xs leading-relaxed overflow-x-auto border whitespace-pre">
                    {SYSTEM_OVERVIEW_FLOW}
                  </pre>
                  <ul className="list-disc list-inside pl-2 space-y-1">
                    <li><strong>{isZh ? "服务松耦合" : "Service Decoupling"}</strong>：{isZh ? "前端（flashflow-web）与后端（flashflow-server）作为独立的无服务器（Serverless）实例在云端独立部署运行，规避了单一技术栈部署导致的整体不可用风险。" : "Frontend (flashflow-web) and backend (flashflow-server) operate as independent Serverless execution units, mitigating deployment-related system downtime."}</li>
                    <li><strong>{isZh ? "数据安全屏障" : "Encapsulated Access"}</strong>：{isZh ? "完全禁用了客户端直接读写 Firestore 数据库的底层权限。所有数据存取请求均通过受信任的后端服务管道进行路由与审计。" : "Direct database operations by client SDKs are disabled. All database mutations are fully routed and audited via trusted NestJS services."}</li>
                  </ul>
                </div>
              </section>

              <Separator />

              {/* 2. Frontend */}
              <section id="frontend" className="scroll-mt-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Code className="h-6 w-6 text-primary" />
                  <h2 className="text-xl sm:text-2xl font-bold">{isZh ? "2. 前端架构与乐观状态回滚机制" : "2. Frontend Architecture & Optimistic UI State Management"}</h2>
                </div>
                <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
                  <p>
                    {isZh
                      ? "前端基于 Next.js 15 混合渲染架构与 React 18 构建。为消除网络延迟对用户操作带来的阻塞感，系统在 FlashcardsContext 状态调度中实现了基于乐观并发的 UI 更新机制（Optimistic Updates）："
                      : "The frontend is built on Next.js 15 and React 18. To eliminate network latency overhead during mutations, the application layer implements Optimistic UI state updates within domain-level contexts:"}
                  </p>
                  <pre className="bg-muted p-3.5 rounded-lg font-mono text-[10px] sm:text-xs leading-relaxed overflow-x-auto border whitespace-pre">
                    {isZh ? OPTIMISTIC_UPDATE_FLOW : OPTIMISTIC_UPDATE_FLOW_EN}
                  </pre>
                  
                  <div className="space-y-2">
                    <h3 className="text-foreground font-semibold text-sm">{isZh ? "乐观更新与异常回滚机制 TypeScript 代码分析" : "TypeScript Implementation of Optimistic State Mutation & Rollback"}</h3>
                    <pre className="bg-muted p-4 rounded-lg font-mono text-[11px] sm:text-xs overflow-x-auto border whitespace-pre">
                      {DELETE_FLASHCARD_CODE}
                    </pre>
                  </div>
                  <p>
                    {isZh
                      ? "在离线缓存支持方面，借助于 PWA 规范，静态资源采用 CacheFirst 策略存储于浏览器本地；而动态 API 请求采用 NetworkFirst 策略，从而兼顾强一致性与断网高可用。"
                      : "For offline compatibility, the application registers a Service Worker that applies a CacheFirst policy for static assets and a NetworkFirst policy for API transactions, balancing performance and strong eventual consistency."}
                  </p>
                </div>
              </section>

              <Separator />

              {/* 3. Backend */}
              <section id="backend" className="scroll-mt-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Terminal className="h-6 w-6 text-primary" />
                  <h2 className="text-xl sm:text-2xl font-bold">{isZh ? "3. 后端处理管线与 DTO 运行时校验" : "3. Backend Request Pipelines & DTO Schema Validation"}</h2>
                </div>
                <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
                  <p>
                    {isZh
                      ? "后端 NestJS 系统遵循依赖注入（Dependency Injection）原则，将通信逻辑、鉴权安全与领域业务完全隔离。在服务端接收到客户端请求后，处理管线将执行如下生命周期："
                      : "The NestJS backend applies Inversion of Control (IoC) to separate transport layers from core domain logic. The request pipeline executes along a strict architectural flow:"}
                  </p>
                  <pre className="bg-muted p-3.5 rounded-lg font-mono text-[10px] sm:text-xs leading-relaxed overflow-x-auto border whitespace-pre">
                    {NESTJS_PIPELINE_FLOW}
                  </pre>
                  <div className="space-y-2">
                    <h3 className="text-foreground font-semibold text-sm">{isZh ? "运行时 DTO 约束（class-validator）" : "Runtime DTO Schema Protection"}</h3>
                    <pre className="bg-muted p-4 rounded-lg font-mono text-[11px] sm:text-xs overflow-x-auto border whitespace-pre">
                      {DTO_VALIDATION_CODE}
                    </pre>
                  </div>
                </div>
              </section>

              <Separator />

              {/* 4. Security */}
              <section id="security" className="scroll-mt-6 space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                  <h2 className="text-xl sm:text-2xl font-bold">{isZh ? "4. 鉴权体系：JWT 签名校验与 UID 级物理路径隔离" : "4. Security: JWT Cryptographic Verification & Path Scoping"}</h2>
                </div>
                <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
                  <p>
                    {isZh
                      ? "鉴权层采用基于 JWT 数字签名的非对称解密校验，确保用户会话的真实性并防止越权行为："
                      : "The authentication layer utilizes JWT asymmetric signature verification to validate user identity and prevent unauthorized access:"}
                  </p>
                  <pre className="bg-muted p-4 rounded-lg font-mono text-[11px] sm:text-xs overflow-x-auto border whitespace-pre">
                    {AUTH_GUARD_CODE}
                  </pre>
                  <ul className="list-disc list-inside pl-2 space-y-1">
                    <li><strong>{isZh ? "非对称解密验签" : "Asymmetric Decryption"}</strong>：{isZh ? "客户端登录获取的 Firebase JWT ID 令牌随 Authorization 头部发送至后端。NestJS AuthGuard 动态抓取 Google 公开的数字证书，验证签名算法、Audience、过期时间以及 Issuer 标识符。" : "Short-lived ID tokens are validated by NestJS AuthGuard using dynamically fetched certificates. The guard verifies signature legitimacy, audience claims, and expiration bounds."}</li>
                    <li><strong>{isZh ? "防止水平越权设计" : "Prevention of Privilege Escalation"}</strong>：{isZh ? "令牌解密成功后，系统强制使用从 Token 中提取并经验证的 uid 构建数据操作路径，如 `users/{verified_uid}/collections/...`。系统完全废弃前端传入的任何 userId 参数，实现物理级的数据存储隔离。" : "The verified uid is attached to the session context. All database storage endpoints are scoped directly to `users/{verified_uid}/...`. Client-supplied user identifiers are completely ignored to mitigate injection risks."}</li>
                  </ul>
                </div>
              </section>

              <Separator />

              {/* 5. Spaced Repetition */}
              <section id="spaced-rep" className="scroll-mt-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Award className="h-6 w-6 text-primary" />
                  <h2 className="text-xl sm:text-2xl font-bold">{isZh ? "5. 记忆模型：SuperMemo SM-2 算法公式与建模" : "5. Spaced Repetition: SuperMemo SM-2 Algorithmic Modeling"}</h2>
                </div>
                <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
                  <p>
                    {isZh
                      ? "记忆卡片复习周期的调度使用 SuperMemo-2 (SM-2) 算法。系统根据用户反馈的卡片掌握程度打分 $q \\in [1, 5]$，来计算新的简易度因子 $EF$ 与下一次复习的时间间隔 $I$（天数）："
                      : "Flashcard review cycles are determined by the SM-2 algorithm. Each user rating $q \\in [1, 5]$ updates the Ease Factor ($EF$) and repetition interval $I$ (in days):"}
                  </p>
                  <div className="bg-muted p-4 rounded-lg space-y-3 font-mono text-[11px] sm:text-xs border">
                    <div>
                      <span className="text-primary font-bold">{isZh ? "1. 简易度因子 (EF) 修正公式:" : "1. Ease Factor (EF) Adjustment:"}</span>
                      <p className="mt-1 pl-2 text-foreground font-semibold">
                        EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
                      </p>
                      <p className="mt-0.5 text-muted-foreground text-[10px]">
                        {isZh ? "* 保护界限：新因子 EF' 不得低于 1.3。若计算值低于 1.3 则强制限制为 1.3。" : "* Safe Clamp: EF' = max(EF', 1.3)"}
                      </p>
                    </div>
                    <hr className="border-border/60" />
                    <div>
                      <span className="text-primary font-bold">{isZh ? "2. 复习时间间隔 I(n) 推导规则:" : "2. Review Interval I(n) Formula:"}</span>
                      <ul className="list-disc list-inside pl-2 mt-1 space-y-0.5">
                        <li>n = 1 (首次复习): I(1) = 1 day</li>
                        <li>n = 2 (二次复习): I(2) = 6 days</li>
                        <li>n &gt; 2 (多次复习): I(n) = I(n - 1) * EF</li>
                      </ul>
                    </div>
                    <hr className="border-border/60" />
                    <div>
                      <span className="text-primary font-bold">{isZh ? "3. 遗忘重置惩罚 (q < 3):" : "3. Forget Reset Mechanics (q < 3):"}</span>
                      <p className="mt-1 pl-2 text-foreground">
                        {isZh ? "若用户评分 q < 3（表示遗忘或记忆失败），复习次数 n 重置为 0，下一次复习时间间隔 I(n) 强制重置为 1 天，以高频率重新开始记忆唤醒周期。" : "If quality rating is less than 3 (forgot or struggled), repetition count n is reset to 0, and the review interval I is forced back to 1 day."}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <Separator />

              {/* 6. Database Transactions */}
              <section id="db-tx" className="scroll-mt-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Database className="h-6 w-6 text-primary" />
                  <h2 className="text-xl sm:text-2xl font-bold">{isZh ? "6. 数据一致性：Firestore 数据库原子事务与级联删除" : "6. Data Consistency: Firestore Atomic Transactions"}</h2>
                </div>
                <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
                  <p>
                    {isZh
                      ? "对于无模式（NoSQL）文档数据库，不存在底层的数据库级联约束。删除一个主实体文档（如 Deck）时，如果不清理关联的数据，会留下无关联的孤立节点并导致逻辑混乱。"
                      : "For schema-less document databases, cascade constraints are not enforced by the storage layer. Deleting a parent document (like a Deck) without removing sub-entities leaves orphaned references."}
                  </p>
                  <pre className="bg-muted p-4 rounded-lg font-mono text-[11px] sm:text-xs overflow-x-auto border whitespace-pre">
                    {CASCADE_DELETE_CODE}
                  </pre>
                  <ul className="list-disc list-inside pl-2 space-y-1">
                    <li><strong>{isZh ? "先读后写原子性" : "Read-before-Write Constraint"}</strong>：{isZh ? "Firestore 事务要求必须在读取阶段结束后才能执行任何写入。事务初始化后，首先在隔离块中查询目标 Deck 下的全部 Card 文档引用。" : "Transactions enforce that all reads are completed before any write operations. The database transaction first queries all card document references associated with the deck."}</li>
                    <li><strong>{isZh ? "并发冲突自动回滚" : "Conflict Resolution"}</strong>：{isZh ? "如果在读取阶段与最后的写入修改提交之间，这些文档的锁定状态被其他请求修改，事务会自动进行重试和完全回滚，避免部分删除状态导致的一致性问题。" : "If the locked records are altered by a concurrent process before the transaction commits, the transaction automatically rolls back and retries, preventing partial deletions."}</li>
                  </ul>
                </div>
              </section>

              <Separator />

              {/* 7. AI Pipeline */}
              <section id="ai-pipeline" className="scroll-mt-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Cpu className="h-6 w-6 text-primary" />
                  <h2 className="text-xl sm:text-2xl font-bold">{isZh ? "7. AI 管道：Gemini 结构化 JSON Schema 约束与缓存策略" : "7. AI Pipeline: Structured Gemini Outputs & Caching"}</h2>
                </div>
                <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
                  <p>
                    {isZh
                      ? "为了支持智能的卡片拆解与算法复习题目生成，AI 管道在稳定性和调用开销上进行了优化设计："
                      : "The AI card generation pipeline is optimized to improve prompt engineering, API costs, and performance:"}
                  </p>
                  <pre className="bg-muted p-4 rounded-lg font-mono text-[11px] sm:text-xs overflow-x-auto border whitespace-pre">
                    {GEMINI_CONFIG_CODE}
                  </pre>
                  <ul className="list-disc list-inside pl-2 space-y-1">
                    <li><strong>{isZh ? "JSON Schema 结构化输出" : "Structured Output Schema"}</strong>：{isZh ? "后端调用 Gemini API 时设置 responseMimeType: 'application/json' 并指定 Schema，确保输出精确匹配 { front, back }[] 结构，消除了反序列化错误。" : "The backend configures Gemini API with responseMimeType: 'application/json' and specifies a responseSchema constraint matching the card schema, avoiding formatting errors."}</li>
                    <li><strong>{isZh ? "少样本提示词设计" : "Few-Shot Examples"}</strong>：{isZh ? "在系统级 Prompt 中注入了多组主动召回对比范式，训练模型剔除多余格式，专注于提取小颗粒度的主问题和答案。" : "The system prompt provides contrasted input-output pairs to train the AI model to output atomic, active-recall structures."}</li>
                  </ul>
                </div>
              </section>

              <Separator />

              {/* 8. PWA & Sync */}
              <section id="pwa-sync" className="scroll-mt-6 space-y-4">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-6 w-6 text-primary" />
                  <h2 className="text-xl sm:text-2xl font-bold">{isZh ? "8. 状态同步：本地高精倒计时与云端心跳轮询" : "8. Synchronization: Local Sandbox & 5s Heartbeat Polling"}</h2>
                </div>
                <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
                  <p>
                    {isZh
                      ? "频繁的上报番茄钟计时器状态会给服务器和数据库带来过高的读写负担，且易受客户端弱网波动干扰。因此系统设计了混合同步方案："
                      : "Frequent API requests to sync active timers degrade backend efficiency. We implemented a hybrid timer synchronization mechanism:"}
                  </p>
                  <ul className="list-disc list-inside pl-2 space-y-1">
                    <li><strong>{isZh ? "本地运行沙箱" : "Local Execution Sandbox"}</strong>：{isZh ? "倒计时完全由客户端 React Context 驱动，断网、休眠或切后台均由本地沙箱平滑推进，提供了优秀的容错表现。" : "Countdowns run inside React Context using high-precision web APIs. Switch tabs, lock screens, or offline states do not interfere with ticking, ensuring low-power stability."}</li>
                    <li><strong>{isZh ? "5秒轻量级心跳轮询" : "5-Second Heartbeat Polling"}</strong>：{isZh ? "计时激活期间，前端定时异步将本地状态上报给 NestJS 接口。即使单次轮询失败，本地倒计时依旧正常运行，并在网络恢复后自动恢复同步。" : "When online, the client initiates background requests every 5 seconds to synchronize active session states to the NestJS API."}</li>
                  </ul>
                </div>
              </section>
            </div>
          </ScrollArea>
        </main>
      </div>
    </div>
  );
}
