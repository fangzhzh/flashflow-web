"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { HelpCircle, BookOpen, Terminal, Sparkles, Timer, Wifi, Layers } from "lucide-react";
import { useCurrentLocale } from "@/lib/i18n/client";

export default function TechnicalFAQDialog() {
  const currentLocale = useCurrentLocale();
  const isZh = currentLocale === "zh";
  const [isOpen, setIsOpen] = useState(false);

  const faqItems = isZh
    ? [
        {
          id: "get-started",
          question: "如何开始使用 FlashFlow？",
          icon: BookOpen,
          answer: (
            <p>
              在卡片工坊中创建一个新的**卡片集 (Deck)**，接着你可以手动添加卡片，或者使用 AI 助手批量将学习资料拆解为记忆卡片。随后可以在首页或卡片管理中点击**开始复习**进行记忆强化。
            </p>
          ),
        },
        {
          id: "ai-assist",
          question: "AI 助手能帮我做什么？",
          icon: Sparkles,
          answer: (
            <p>
              AI 助手主要有两大功能：在**卡片工坊**中，它可以将你粘贴的长篇学习笔记自动拆解并重构为适合记忆的问答卡片；在**GitHub复习**中，它可以读取你的近期代码提交，并自动出题来检验你对最近所写代码的掌握程度。
            </p>
          ),
        },
        {
          id: "pomodoro",
          question: "番茄钟与任务关联是如何工作的？",
          icon: Timer,
          answer: (
            <p>
              在计时器页面，你可以选择一个特定的任务并开启番茄钟。这能帮助你记录完成该任务所花费的专注时间，且在专注结束后系统会自动弹出打卡记分（Check-in）页面，帮助你建立专注的仪式感。
            </p>
          ),
        },
        {
          id: "offline",
          question: "可以在没有网络（离线）时使用吗？",
          icon: Wifi,
          answer: (
            <p>
              可以。FlashFlow 支持 PWA（渐进式 Web 应用）离线运行。番茄钟计时器及卡片的本地复习逻辑拥有离线沙盒，在断网时你的专注计时和基础卡片操作不会中断，并在网络恢复后自动与云端数据建立同步。
            </p>
          ),
        },
      ]
    : [
        {
          id: "get-started",
          question: "How do I get started with FlashFlow?",
          icon: BookOpen,
          answer: (
            <p>
              Create a **Deck** in the Card Workshop, then add flashcards manually or use the AI Assistant to break down your study notes. Once ready, click **Start Review** from the home hub to begin active recall testing.
            </p>
          ),
        },
        {
          id: "ai-assist",
          question: "What does the AI Assistant do?",
          icon: Sparkles,
          answer: (
            <p>
              The AI Assistant provides two core utilities: in the **Card Workshop**, it parses long-form text notes into structured active recall question-answer pairs; in the **GitHub Review** module, it fetches your recent coding commits and generates code-review questions to test your retention.
            </p>
          ),
        },
        {
          id: "pomodoro",
          question: "How does the Pomodoro timer integrate with tasks?",
          icon: Timer,
          answer: (
            <p>
              You can bind a Pomodoro session to a specific task. This records the exact duration spent on that task, and initiates a check-in scoring sheet upon completion, helping you gamify your productivity sessions.
            </p>
          ),
        },
        {
          id: "offline",
          question: "Does FlashFlow work offline?",
          icon: Wifi,
          answer: (
            <p>
              Yes. FlashFlow is a Progressive Web App (PWA) with offline sandbox capabilities. Your Pomodoro timers and local review sessions will keep functioning if you lose internet, and will automatically synchronize back to the server once connection is restored.
            </p>
          ),
        },
      ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="h-8 w-8 md:h-9 md:w-9 relative group" title={isZh ? "常见问题与技术文档" : "FAQ & System Docs"}>
          <HelpCircle className="h-[1.2rem] w-[1.2rem] text-muted-foreground group-hover:text-primary transition-colors" />
          <span className="sr-only">{isZh ? "帮助" : "Help"}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md w-[95vw] rounded-lg">
        <DialogHeader className="text-left pb-2 border-b">
          <DialogTitle className="text-lg font-bold">
            {isZh ? "帮助与常见问题" : "Help & FAQ"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {isZh ? "快速解答您在使用 FlashFlow 时的常见疑问" : "Quick answers for using FlashFlow"}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[50vh] pr-2 my-2">
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item) => (
              <AccordionItem key={item.id} value={item.id} className="border-b">
                <AccordionTrigger className="hover:no-underline hover:text-primary transition-colors text-sm font-semibold py-3 text-left">
                  <div className="flex items-center gap-2">
                    <item.icon className="h-4 w-4 text-primary shrink-0" />
                    <span>{item.question}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed pl-6 pb-3">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollArea>

        {/* Developer Documentation Call-to-action */}
        <div className="bg-muted/60 border rounded-lg p-3.5 mt-2 flex flex-col gap-2.5">
          <div className="flex gap-2">
            <Layers className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="text-left">
              <h4 className="text-xs font-bold">
                {isZh ? "开发者与系统架构文档" : "Developer & Technical Design Docs"}
              </h4>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                {isZh 
                  ? "了解前后端解耦拓扑、SM-2 间隔重复算法公式、Firestore 并发事务和安全沙箱设计细节。"
                  : "Explore details of the decoupled BFF architecture, SM-2 math equations, and database transactional locks."}
              </p>
            </div>
          </div>
          <DialogClose asChild>
            <Link href="/docs" className="w-full">
              <Button size="sm" className="w-full gap-1.5 text-xs font-semibold">
                <Terminal className="h-3.5 w-3.5" />
                {isZh ? "查看系统设计与白皮书" : "Read Engineering Specification"}
              </Button>
            </Link>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
