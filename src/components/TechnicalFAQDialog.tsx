"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { HelpCircle, Code, Layers, RefreshCw, Cpu, Database, Award, ShieldCheck, Terminal } from "lucide-react";
import { useCurrentLocale } from "@/lib/i18n/client";

export default function TechnicalFAQDialog() {
  const currentLocale = useCurrentLocale();
  const isZh = currentLocale === "zh";

  const analysisItems = isZh
    ? [
        {
          id: "system-overview",
          question: "整体架构：FlashFlow 从单体前端演进为 FE + BE + Firebase 的三层系统",
          icon: Layers,
          answer: (
            <div className="space-y-3 text-muted-foreground text-xs sm:text-sm">
              <p>
                当前架构可以理解为 <strong>Next.js 前端 + NestJS 后端 + Firebase 基础设施</strong>。前端负责交互体验和页面组织，后端负责认证校验、业务 API、AI 调用和 Firestore 访问，Firebase 则承担 Auth 与数据库能力。
              </p>
              <ul className="list-disc list-inside pl-2 space-y-1">
                <li><strong>Browser / FE</strong>：Next.js 15 App Router、React 18、TypeScript、Tailwind、Radix UI、PWA、i18n。用户登录、页面交互、番茄钟倒计时、复习游戏都在这里发生。</li>
                <li><strong>API / BE</strong>：NestJS 11 暴露 <code>/api</code> REST 接口，按 <code>flashcards</code>、<code>decks</code>、<code>tasks</code>、<code>overviews</code>、<code>pomodoro</code>、<code>ai</code> 拆模块。</li>
                <li><strong>Infra</strong>：Firebase Client SDK 只在前端做登录和拿 ID token；Firebase Admin SDK 只在后端验证 token 与读写 Firestore；Gemini API key 只保留在后端环境变量。</li>
              </ul>
              <p>
                这个拆分的核心价值是：前端不再直接拥有数据库访问逻辑，敏感能力后移到服务端，系统更接近生产环境里常见的 BFF/API Gateway 架构。
              </p>
            </div>
          ),
        },
        {
          id: "frontend",
          question: "前端架构：App Router + Client Providers + 统一 API Client",
          icon: Code,
          answer: (
            <div className="space-y-3 text-muted-foreground text-xs sm:text-sm">
              <p>
                前端不是传统纯 SPA，也不是纯 Server Component 应用，而是 <strong>App Router 外壳 + Client Component 业务核心</strong>。原因很实际：Firebase Auth、localStorage、Notification、Audio、计时器、PWA 这些都依赖浏览器环境。
              </p>
              <ul className="list-disc list-inside pl-2 space-y-1">
                <li><strong>路由与布局</strong>：<code>src/app/[locale]/layout.tsx</code> 注入 i18n、Auth、Flashcards、Pomodoro providers；<code>middleware.ts</code> 负责中英文 locale rewrite。</li>
                <li><strong>状态聚合</strong>：<code>FlashcardsContext</code> 聚合 flashcards、decks、tasks、overviews；<code>PomodoroContext</code> 聚合计时器状态；<code>AuthContext</code> 封装 Firebase 登录与 <code>getIdToken()</code>。</li>
                <li><strong>API 边界</strong>：<code>ApiClient</code> 统一拼接 <code>NEXT_PUBLIC_API_URL</code>，自动把 Firebase ID token 放进 <code>Authorization: Bearer</code>，并把 HTTP 错误转换成前端可处理的异常。</li>
                <li><strong>RSC 取舍</strong>：当前业务页面大量依赖 client state，所以 Server Component 主要承担布局、metadata 和路由组织。未来可把任务列表、卡片列表的首屏数据迁移到 Server Component 预取，再把交互部分下放给 Client Component。</li>
              </ul>
            </div>
          ),
        },
        {
          id: "backend",
          question: "后端架构：NestJS 模块化服务层封装 Firebase Admin SDK",
          icon: Terminal,
          answer: (
            <div className="space-y-3 text-muted-foreground text-xs sm:text-sm">
              <p>
                后端采用 <strong>NestJS + TypeScript</strong>，它比 Express 更结构化：Controller 负责 HTTP 边界，Service 负责业务逻辑，Module 负责依赖组织。这对面试很有价值，因为它能解释“代码如何随着业务增长仍然可维护”。
              </p>
              <ul className="list-disc list-inside pl-2 space-y-1">
                <li><strong>模块边界</strong>：<code>FlashcardsModule</code>、<code>DecksModule</code>、<code>TasksModule</code>、<code>OverviewsModule</code>、<code>PomodoroModule</code>、<code>AiModule</code> 分别对应业务域。</li>
                <li><strong>全局配置</strong>：<code>ConfigModule</code> 读取环境变量；<code>FirebaseModule</code> 初始化 Admin SDK，支持 service account JSON、文件路径和 application default credentials。</li>
                <li><strong>请求管道</strong>：<code>main.ts</code> 设置 <code>/api</code> 全局前缀、CORS、<code>ValidationPipe</code>。DTO 通过 <code>class-validator</code> 做运行时校验，TypeScript 则负责编译期类型约束。</li>
                <li><strong>数据格式归一</strong>：后端把 Firestore <code>Timestamp</code> 转成 ISO string，避免前端直接处理数据库专有类型。</li>
              </ul>
            </div>
          ),
        },
        {
          id: "auth-security",
          question: "认证与安全：前端签发 token，后端验证 token，数据按 uid 隔离",
          icon: ShieldCheck,
          answer: (
            <div className="space-y-3 text-muted-foreground text-xs sm:text-sm">
              <p>
                安全链路的关键点是：<strong>前端可以拿到 Firebase ID token，但不能直接绕过后端写数据库</strong>。后端用 Firebase Admin SDK 验证 token 后，再把用户身份转换成服务端可信的 <code>uid</code>。
              </p>
              <ul className="list-disc list-inside pl-2 space-y-1">
                <li><strong>前端登录</strong>：<code>AuthContext</code> 支持 Google、邮箱密码、email link，并通过 <code>auth.currentUser.getIdToken()</code> 为 API 请求取 token。</li>
                <li><strong>后端守卫</strong>：<code>AuthGuard</code> 读取 <code>Authorization</code> header，调用 <code>firebaseService.auth.verifyIdToken()</code> 验证签名、过期时间和项目归属。</li>
                <li><strong>用户上下文</strong>：验证成功后，后端把 <code>{`{ uid, email }`}</code> 注入 request；Controller 通过 <code>@CurrentUser()</code> 获取当前用户。</li>
                <li><strong>数据隔离</strong>：所有集合路径都在 <code>users/{"{uid}"}/...</code> 下，Service 不信任客户端传来的 userId，而是使用 token 中解析出的 uid。</li>
              </ul>
            </div>
          ),
        },
        {
          id: "data-model",
          question: "数据模型：Firestore 子集合、服务端时间戳与级联删除",
          icon: Database,
          answer: (
            <div className="space-y-3 text-muted-foreground text-xs sm:text-sm">
              <p>
                Firestore 采用按用户分区的文档模型，天然适合个人学习数据：每个用户的数据在自己的 namespace 下，不需要复杂 join，读取路径也很清晰。
              </p>
              <ul className="list-disc list-inside pl-2 space-y-1">
                <li><strong>集合结构</strong>：<code>users/{`{uid}`}/flashcards</code>、<code>decks</code>、<code>tasks</code>、<code>overviews</code>、<code>pomodoro/state</code>。</li>
                <li><strong>时间字段</strong>：创建和更新使用 <code>FieldValue.serverTimestamp()</code>，避免客户端时间不可信；返回前统一转成 ISO string。</li>
                <li><strong>查询方式</strong>：列表通常按 <code>createdAt desc</code> 排序；卡片可按 <code>deckId</code> 过滤；任务可按 <code>overviewId</code> 查询。</li>
                <li><strong>级联删除</strong>：删除 Deck 时，后端调用 <code>FlashcardsService.deleteByDeckId()</code>，用 Firestore batch 删除该 deck 下的卡片，再删除 deck 本身。这里是 batch cascade，不是数据库外键级联。</li>
              </ul>
              <p>
                取舍是：Firestore 开发快、实时能力强、按用户分区简单；但复杂统计、跨集合 join、强事务关系和分页查询需要服务层额外设计。
              </p>
            </div>
          ),
        },
        {
          id: "state-sync",
          question: "状态同步：Context 是客户端缓存层，API 成功后更新本地状态",
          icon: RefreshCw,
          answer: (
            <div className="space-y-3 text-muted-foreground text-xs sm:text-sm">
              <p>
                前端的 Context 不是“数据库”，而是一个轻量的 <strong>client-side cache / view model</strong>。首次进入登录态后，<code>FlashcardsContext</code> 并发拉取四类资源，再把数据分发给页面组件。
              </p>
              <ul className="list-disc list-inside pl-2 space-y-1">
                <li><strong>初始化</strong>：登录后通过 <code>Promise.all</code> 同时请求 flashcards、decks、tasks、overviews，减少首屏等待。</li>
                <li><strong>写操作</strong>：创建、更新、删除先调用 NestJS API，成功后再更新本地 state。这是保守的一致性策略，不是激进 optimistic rollback。</li>
                <li><strong>派生数据</strong>：复习队列和统计数据由本地 flashcards 派生，避免每次切换页面都重新请求后端。</li>
                <li><strong>番茄钟</strong>：倒计时每秒在浏览器本地计算；云端只保存 <code>targetEndTime</code>、暂停剩余时间、当前任务等状态，并每 5 秒轮询同步一次。</li>
              </ul>
            </div>
          ),
        },
        {
          id: "ai-pipeline",
          question: "AI 管线：Gemini 调用后移到后端，前端做缓存与降级",
          icon: Cpu,
          answer: (
            <div className="space-y-3 text-muted-foreground text-xs sm:text-sm">
              <p>
                AI 功能分两类：把长卡片拆成更适合主动回忆的子问题，以及根据 GitHub commit 生成算法复习题。两者都通过 NestJS 的 <code>AiService</code> 调用 Gemini，避免把 <code>GOOGLE_GENAI_API_KEY</code> 暴露给浏览器。
              </p>
              <ul className="list-disc list-inside pl-2 space-y-1">
                <li><strong>提示词策略</strong>：decompose prompt 明确要求同语言输出、避免“要点1/步骤2”这种低质量问题、只返回 JSON。</li>
                <li><strong>解析策略</strong>：后端会清理可能出现的 markdown code fence，再 <code>JSON.parse</code>；这是实用方案，但生产级可继续加 Zod/class-validator 二次校验。</li>
                <li><strong>缓存策略</strong>：前端对 AI decomposition 做 30 天 localStorage 缓存，并用卡片正文作为失效条件；GitHub review 第一轮缓存 24 小时，后续轮次强制生成不同问题。</li>
                <li><strong>批处理</strong>：长卡片按批量提交，避免单次请求过大，也减少 Gemini 调用次数。</li>
              </ul>
            </div>
          ),
        },
        {
          id: "tradeoffs",
          question: "技术选型与可演进方向：为什么是 NestJS，而不是只用 Next.js 或 Python",
          icon: Award,
          answer: (
            <div className="space-y-3 text-muted-foreground text-xs sm:text-sm">
              <p>
                这个项目现在选择 <strong>NestJS</strong> 很合理：前后端都使用 TypeScript，接口类型、DTO、模块结构更容易统一；同时它比 Next.js Route Handler 更适合作为长期后端服务。
              </p>
              <ul className="list-disc list-inside pl-2 space-y-1">
                <li><strong>相比只用 Next.js</strong>：Route Handler 适合 BFF 和轻量 API，但业务变多后，认证、DTO、模块边界、服务层复用会变散。NestJS 在结构化后端上更稳。</li>
                <li><strong>相比 Python/FastAPI</strong>：FastAPI 很适合 AI/数据科学，但当前团队如果主栈是 TypeScript，NestJS 能减少语言切换和类型割裂。</li>
                <li><strong>当前风险</strong>：前端 Context 会随业务变大而膨胀；API Client 仍有不少 <code>any</code>；CORS 生产环境应更严格；AI JSON 输出需要更强 schema 校验。</li>
                <li><strong>下一步演进</strong>：引入 OpenAPI 生成前端类型、拆分 Context 为更小的 domain hooks、增加 E2E 与 service 单测、把部分首屏数据迁移到 Server Component 获取。</li>
              </ul>
            </div>
          ),
        },
      ]
    : [
        {
          id: "system-overview",
          question: "System Architecture: FE + BE + Firebase",
          icon: Layers,
          answer: (
            <div className="space-y-3 text-muted-foreground text-xs sm:text-sm">
              <p>
                FlashFlow is structured as a <strong>Next.js frontend, NestJS backend, and Firebase infrastructure</strong>. The frontend owns interaction and presentation, the backend owns trusted API logic, and Firebase provides Auth and Firestore.
              </p>
              <ul className="list-disc list-inside pl-2 space-y-1">
                <li><strong>Frontend</strong>: Next.js 15 App Router, React 18, TypeScript, Tailwind, Radix UI, PWA, and i18n.</li>
                <li><strong>Backend</strong>: NestJS 11 REST API under <code>/api</code>, split by domains such as flashcards, decks, tasks, pomodoro, and AI.</li>
                <li><strong>Infrastructure</strong>: Firebase Client SDK signs users in, Firebase Admin SDK verifies tokens and accesses Firestore, and Gemini API calls stay server-side.</li>
              </ul>
            </div>
          ),
        },
        {
          id: "frontend",
          question: "Frontend: App Router, Client Providers, and API Client",
          icon: Code,
          answer: (
            <div className="space-y-3 text-muted-foreground text-xs sm:text-sm">
              <p>
                The frontend is not a pure SPA and not a pure Server Component app. It uses App Router for routing/layouts, while most business screens are Client Components because auth, timers, notifications, audio, localStorage, and PWA behaviors need browser APIs.
              </p>
              <ul className="list-disc list-inside pl-2 space-y-1">
                <li><strong>Layouts</strong>: <code>[locale]/layout.tsx</code> wires i18n, auth, flashcards, and pomodoro providers.</li>
                <li><strong>Client state</strong>: React Contexts act as domain-level view models for flashcards, tasks, overviews, auth, and timer state.</li>
                <li><strong>API boundary</strong>: <code>ApiClient</code> centralizes the backend URL, Bearer token injection, and HTTP error handling.</li>
                <li><strong>RSC tradeoff</strong>: Server Components are currently used mostly for app structure. Future versions can fetch initial data in RSC and pass it into smaller Client Components.</li>
              </ul>
            </div>
          ),
        },
        {
          id: "backend",
          question: "Backend: NestJS Modules over Firebase Admin SDK",
          icon: Terminal,
          answer: (
            <div className="space-y-3 text-muted-foreground text-xs sm:text-sm">
              <p>
                The backend uses <strong>NestJS + TypeScript</strong> to keep the API structured as the product grows. Controllers own HTTP concerns, services own business logic, and modules define dependency boundaries.
              </p>
              <ul className="list-disc list-inside pl-2 space-y-1">
                <li><strong>Domain modules</strong>: flashcards, decks, tasks, overviews, pomodoro, auth, firebase, and AI are separated.</li>
                <li><strong>Global pipeline</strong>: <code>main.ts</code> sets CORS, global <code>/api</code> prefix, and <code>ValidationPipe</code>.</li>
                <li><strong>Runtime validation</strong>: DTOs use <code>class-validator</code> while TypeScript handles compile-time safety.</li>
                <li><strong>Serialization</strong>: Firestore timestamps are normalized to ISO strings before being returned to the frontend.</li>
              </ul>
            </div>
          ),
        },
        {
          id: "auth-security",
          question: "Auth and Security: Firebase Token Verification on the Server",
          icon: ShieldCheck,
          answer: (
            <div className="space-y-3 text-muted-foreground text-xs sm:text-sm">
              <p>
                The frontend obtains Firebase ID tokens, but the backend is the trusted boundary. The NestJS <code>AuthGuard</code> verifies every Bearer token with Firebase Admin before any user-scoped data is read or written.
              </p>
              <ul className="list-disc list-inside pl-2 space-y-1">
                <li><strong>Client</strong>: Firebase Client SDK signs in users and provides <code>getIdToken()</code>.</li>
                <li><strong>API</strong>: <code>ApiClient</code> sends <code>Authorization: Bearer &lt;token&gt;</code>.</li>
                <li><strong>Server</strong>: <code>verifyIdToken()</code> validates the token and injects <code>uid</code> into the request.</li>
                <li><strong>Data isolation</strong>: services use <code>users/{`{uid}`}/...</code> paths derived from the verified token, not from client-supplied user IDs.</li>
              </ul>
            </div>
          ),
        },
        {
          id: "data-model",
          question: "Data Model: User-Scoped Firestore Collections",
          icon: Database,
          answer: (
            <div className="space-y-3 text-muted-foreground text-xs sm:text-sm">
              <p>
                Firestore is modeled around user-owned subcollections. This keeps authorization and access paths simple for a personal learning app.
              </p>
              <ul className="list-disc list-inside pl-2 space-y-1">
                <li><strong>Paths</strong>: <code>users/{`{uid}`}/flashcards</code>, <code>decks</code>, <code>tasks</code>, <code>overviews</code>, and <code>pomodoro/state</code>.</li>
                <li><strong>Timestamps</strong>: writes use server timestamps and responses are serialized to ISO strings.</li>
                <li><strong>Queries</strong>: lists are ordered by <code>createdAt</code>; flashcards filter by <code>deckId</code>; tasks can filter by <code>overviewId</code>.</li>
                <li><strong>Cascade delete</strong>: deleting a deck triggers a backend batch delete for flashcards under that deck before deleting the deck itself.</li>
              </ul>
            </div>
          ),
        },
        {
          id: "state-sync",
          question: "State Sync: Context as Client Cache",
          icon: RefreshCw,
          answer: (
            <div className="space-y-3 text-muted-foreground text-xs sm:text-sm">
              <p>
                React Context works as a lightweight client-side cache. It loads domain data after auth, updates state after successful API mutations, and derives review queues/statistics locally.
              </p>
              <ul className="list-disc list-inside pl-2 space-y-1">
                <li><strong>Initial load</strong>: flashcards, decks, tasks, and overviews are fetched concurrently with <code>Promise.all</code>.</li>
                <li><strong>Mutations</strong>: state is updated after API success, favoring correctness over aggressive optimistic UI.</li>
                <li><strong>Derived state</strong>: review queue and dashboard statistics are computed from cached flashcards/tasks.</li>
                <li><strong>Timer sync</strong>: the timer ticks locally every second while cloud state is fetched/persisted through the backend and polled every 5 seconds.</li>
              </ul>
            </div>
          ),
        },
        {
          id: "ai-pipeline",
          question: "AI Pipeline: Server-Side Gemini with Client Caching",
          icon: Cpu,
          answer: (
            <div className="space-y-3 text-muted-foreground text-xs sm:text-sm">
              <p>
                AI calls are moved behind the NestJS backend so the Gemini API key stays server-side. The frontend only sends authenticated requests and caches safe results locally.
              </p>
              <ul className="list-disc list-inside pl-2 space-y-1">
                <li><strong>Decomposition</strong>: long flashcards are split into named active-recall subquestions.</li>
                <li><strong>GitHub review</strong>: recent commits are summarized and transformed into interview-style review cards.</li>
                <li><strong>Parsing</strong>: backend strips code fences and parses JSON; production hardening can add schema validation.</li>
                <li><strong>Client cache</strong>: decomposition results cache for 30 days; first-round GitHub review caches for 24 hours.</li>
              </ul>
            </div>
          ),
        },
        {
          id: "tradeoffs",
          question: "Technical Choices and Evolution Path",
          icon: Award,
          answer: (
            <div className="space-y-3 text-muted-foreground text-xs sm:text-sm">
              <p>
                NestJS is a good fit here because the project already uses TypeScript heavily, and the backend benefits from modules, DTOs, guards, and dependency injection.
              </p>
              <ul className="list-disc list-inside pl-2 space-y-1">
                <li><strong>Compared with Next.js-only</strong>: Route Handlers are great for BFF logic, but a growing domain benefits from a dedicated backend service.</li>
                <li><strong>Compared with FastAPI</strong>: Python is excellent for AI/data workloads, but NestJS keeps this codebase in one language family.</li>
                <li><strong>Known gaps</strong>: context size, <code>any</code> in the API client, permissive CORS, and AI JSON validation can all be improved.</li>
                <li><strong>Next steps</strong>: generate FE types from OpenAPI, split domain hooks, add service tests/E2E tests, and move some initial data fetching into Server Components.</li>
              </ul>
            </div>
          ),
        },
      ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="h-8 w-8 md:h-9 md:w-9 relative group" title={isZh ? "技术细节与常见问题" : "Technical Details & FAQ"}>
          <HelpCircle className="h-[1.2rem] w-[1.2rem] text-muted-foreground group-hover:text-primary transition-colors" />
          <span className="sr-only">{isZh ? "技术 FAQ" : "Tech FAQ"}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl w-[95vw] rounded-lg">
        <DialogHeader className="flex flex-row items-center gap-2.5 pb-2 border-b">
          <Code className="h-6 w-6 text-primary" />
          <div className="text-left">
            <DialogTitle className="text-xl font-bold">
              {isZh ? "技术架构深入分析" : "Technical Architecture Deep Dive"}
            </DialogTitle>
            <DialogDescription className="text-xs mt-0.5">
              {isZh
                ? "从前端、后端、认证、数据模型、AI 管线和技术取舍拆解 FlashFlow"
                : "A layered breakdown of FlashFlow's frontend, backend, auth, data model, AI pipeline, and tradeoffs"}
            </DialogDescription>
          </div>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4 mt-2">
          <Accordion type="single" collapsible className="w-full">
            {analysisItems.map((item) => (
              <AccordionItem key={item.id} value={item.id} className="border-b py-1">
                <AccordionTrigger className="hover:no-underline hover:text-primary transition-colors text-sm sm:text-base font-semibold py-3 text-left">
                  <div className="flex items-center gap-2.5">
                    <item.icon className="h-4 w-4 text-primary/80 shrink-0" />
                    <span>{item.question}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-xs sm:text-sm leading-relaxed pl-6 pb-4 pt-1">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
