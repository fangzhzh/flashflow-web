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
import { HelpCircle, Code, Layers, RefreshCw, Cpu, Database, Award } from "lucide-react";
import { useCurrentLocale } from "@/lib/i18n/client";

export default function TechnicalFAQDialog() {
  const currentLocale = useCurrentLocale();
  const isZh = currentLocale === "zh";

  const faqItems = isZh
    ? [
        {
          id: "arch",
          question: "项目整体技术架构是什么？",
          icon: Layers,
          answer: (
            <div className="space-y-2 text-muted-foreground">
              <p>
                FlashFlow 采用<strong>前后端完全分离</strong>的现代云原生架构：
              </p>
              <ul className="list-disc list-inside pl-2 space-y-1">
                <li><strong>前端 (flashflow-web)</strong>：基于 Next.js 15 (React 18) 与 Tailwind CSS v3 构建。移除了直接操作数据库的 SDK，所有数据消费统一经过后端 API。</li>
                <li><strong>后端 (flashflow-server)</strong>：基于 NestJS (Node.js) 框架构建，使用 TypeScript 编写。</li>
                <li><strong>安全层</strong>：通过 Firebase Client Auth 产生 JWT ID Token，NestJS 后端通过拦截器验证 Token 并解析出用户信息，安全可控。</li>
                <li><strong>部署</strong>：两端作为独立的 Serverless 服务分别部署托管在 Vercel 上。</li>
              </ul>
            </div>
          ),
        },
        {
          id: "pomodoro",
          question: "番茄钟的离线可用与服务器同步是如何实现的？",
          icon: RefreshCw,
          answer: (
            <div className="space-y-2 text-muted-foreground">
              <p>
                为了保证在专注过程中网络不稳定时计时不中断，我们设计了<strong>混合状态计时器</strong>：
              </p>
              <ul className="list-disc list-inside pl-2 space-y-1">
                <li><strong>离线沙盒</strong>：本地通过 React Context 结合高精度 Web APIs 进行每秒倒计时渲染，完全不依赖网络，彻底解决卡顿问题。</li>
                <li><strong>心跳轮询</strong>：系统每隔 5 秒向 NestJS 后端发送一次轻量级心跳请求（HTTP Polling），在联网时自动更新云端专注状态并同步进度。</li>
                <li><strong>容错机制</strong>：若轮询失败（处于离线状态），本地计时器照常工作，并在网络恢复后重新同步，提供顺滑的用户体验。</li>
              </ul>
            </div>
          ),
        },
        {
          id: "db",
          question: "删除卡片集 (Deck) 时，如何保证数据一致性？",
          icon: Database,
          answer: (
            <div className="space-y-2 text-muted-foreground">
              <p>
                在老版本中，删除 Deck 可能会留下失去关联的“孤儿卡片”（Orphaned Flashcards）。
              </p>
              <p>
                新 NestJS 后端引入了 <strong>Firestore 数据库事务（Transactions）级联删除</strong>：
              </p>
              <p className="pl-2 border-l-2 border-primary/30 italic">
                当用户请求删除某个 Deck 时，后端会在单个原子事务中，自动拉取并一并删除所有关联了该 <code>deckId</code> 的卡片。整个过程要么全部成功，要么全部回滚，完美确保了数据库的一致性。
              </p>
            </div>
          ),
        },
        {
          id: "ai",
          question: "AI 拆解知识卡片是如何工作的？",
          icon: Cpu,
          answer: (
            <div className="space-y-2 text-muted-foreground">
              <p>
                当你在卡片工坊输入长文本或复杂概念时，系统会通过 AI 协助你将其拆解成小颗粒度的知识卡片：
              </p>
              <ul className="list-disc list-inside pl-2 space-y-1">
                <li>前端通过 API 客户端安全发起请求，将长文本和自定义配置传递给后端。</li>
                <li>NestJS 后端调用 <strong>Google Gemini Pro API</strong>，使用结构化 Prompt 引导其提取核心要点。</li>
                <li>通过 Gemini API 的 JSON Schema 强制约束输出格式，使生成的卡片完美符合我们的 <code>front</code> (正面)、<code>back</code> (背面) 结构，避免解析出错。</li>
              </ul>
            </div>
          ),
        },
        {
          id: "spaced-rep",
          question: "卡片复习使用的是什么间隔重复算法？",
          icon: Award,
          answer: (
            <div className="space-y-2 text-muted-foreground">
              <p>
                FlashFlow 采用了经典的 <strong>SM-2 (SuperMemo-2) 间隔重复算法</strong>来安排下一次复习时间：
              </p>
              <ul className="list-disc list-inside pl-2 space-y-1">
                <li>用户在复习时对卡片评分（1分“完全忘记” 到 5分“完美记住”）。</li>
                <li>算法依据评分动态调整卡片的<strong>简易度因子（Ease Factor，EF）</strong>和复习间隔天数。</li>
                <li>评分越高，下一次复习的间隔时间越长；一旦忘记（评分 &lt; 3），复习天数重置为 1，确保在遗忘临界点精准强化记忆。</li>
              </ul>
            </div>
          ),
        },
      ]
    : [
        {
          id: "arch",
          question: "What is the overall system architecture?",
          icon: Layers,
          answer: (
            <div className="space-y-2 text-muted-foreground">
              <p>
                FlashFlow utilizes a modern, <strong>fully decoupled frontend/backend</strong> architecture:
              </p>
              <ul className="list-disc list-inside pl-2 space-y-1">
                <li><strong>Frontend (flashflow-web)</strong>: Built on Next.js 15 (React 18) and Tailwind CSS v3. Direct client-side database connections are completely removed; all data operations route through the API.</li>
                <li><strong>Backend (flashflow-server)</strong>: Built using NestJS (Node.js) framework with full TypeScript support.</li>
                <li><strong>Security</strong>: Authenticated via Firebase Client SDK to produce JWT ID tokens, verified on the NestJS backend via middleware.</li>
                <li><strong>Deployment</strong>: Both are hosted independently as Serverless functions on Vercel.</li>
              </ul>
            </div>
          ),
        },
        {
          id: "pomodoro",
          question: "How does the Pomodoro Timer achieve offline-first synchronization?",
          icon: RefreshCw,
          answer: (
            <div className="space-y-2 text-muted-foreground">
              <p>
                To prevent focus timer interruptions during network dropouts, we designed a <strong>hybrid timer model</strong>:
              </p>
              <ul className="list-disc list-inside pl-2 space-y-1">
                <li><strong>Offline Sandbox</strong>: Ticks locally using high-precision React Context and Web APIs without relying on network connection.</li>
                <li><strong>Heartbeat Polling</strong>: Polls the NestJS API every 5 seconds to sync focus history to the cloud.</li>
                <li><strong>Graceful Degradation</strong>: If polling fails offline, the timer keeps working locally and re-syncs automatically once connection is restored.</li>
              </ul>
            </div>
          ),
        },
        {
          id: "db",
          question: "How is database consistency maintained during Deck deletion?",
          icon: Database,
          answer: (
            <div className="space-y-2 text-muted-foreground">
              <p>
                In legacy versions, deleting a deck could lead to orphan cards.
              </p>
              <p>
                The new NestJS backend introduces **Firestore transactions** for cascade deletion:
              </p>
              <p className="pl-2 border-l-2 border-primary/30 italic">
                When a deck deletion is requested, all cards sharing the corresponding <code>deckId</code> are queried and deleted within a single, atomic database transaction. The operation either succeeds completely or rolls back entirely.
              </p>
            </div>
          ),
        },
        {
          id: "ai",
          question: "How does the AI decomposition of cards work?",
          icon: Cpu,
          answer: (
            <div className="space-y-2 text-muted-foreground">
              <p>
                When you input text in the Card Workshop, the system assists in breaking it down into flashcards:
              </p>
              <ul className="list-disc list-inside pl-2 space-y-1">
                <li>The client safely makes a request to the backend with the text and configuration.</li>
                <li>The NestJS backend calls the <strong>Google Gemini Pro API</strong> with structured prompts.</li>
                <li>Using Gemini API's JSON Schema constraints, the generated output matches our <code>front</code> and <code>back</code> structure perfectly.</li>
              </ul>
            </div>
          ),
        },
        {
          id: "spaced-rep",
          question: "What spaced repetition algorithm is used?",
          icon: Award,
          answer: (
            <div className="space-y-2 text-muted-foreground">
              <p>
                FlashFlow implements the classic <strong>SM-2 (SuperMemo-2) algorithm</strong> to schedule next reviews:
              </p>
              <ul className="list-disc list-inside pl-2 space-y-1">
                <li>Users rate cards from 1 (forgot completely) to 5 (remembered perfectly).</li>
                <li>The algorithm dynamically updates the card's <strong>Ease Factor (EF)</strong> and review intervals.</li>
                <li>Higher scores increase the interval exponentially; scores &lt; 3 reset the interval to 1 day to reinforce memory immediately.</li>
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
              {isZh ? "技术细节 & FAQ" : "Technical Details & FAQ"}
            </DialogTitle>
            <DialogDescription className="text-xs mt-0.5">
              {isZh
                ? "深入了解 FlashFlow 的架构设计与核心算法实现"
                : "Deep dive into FlashFlow's architectural design and core algorithms"}
            </DialogDescription>
          </div>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4 mt-2">
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item) => (
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
