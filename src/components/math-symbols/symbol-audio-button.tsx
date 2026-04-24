"use client";

import { useState } from "react";
import { Volume2 } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SymbolAudioButton({
  text,
  label,
  audioSrc,
  children = "读音",
  lang = "en-US",
}: {
  text: string;
  label: string;
  audioSrc?: string;
  children?: React.ReactNode;
  lang?: string;
}) {
  const [speaking, setSpeaking] = useState(false);

  function handlePlay() {
    if (audioSrc) {
      const audio = new Audio(audioSrc);
      audio.onended = () => setSpeaking(false);
      audio.onerror = () => {
        setSpeaking(false);
        speakWithBrowserVoice();
      };

      setSpeaking(true);
      void audio.play().catch(() => {
        setSpeaking(false);
        speakWithBrowserVoice();
      });
      return;
    }

    speakWithBrowserVoice();
  }

  function speakWithBrowserVoice() {
    if (
      !("speechSynthesis" in window) ||
      !("SpeechSynthesisUtterance" in window)
    ) {
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.88;
    utterance.pitch = 1;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find((voice) =>
      voice.lang.toLowerCase().startsWith(lang.toLowerCase().split("-")[0]),
    );

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        buttonVariants({ size: "sm", variant: "outline" }),
        "h-7 gap-1.5 px-2 text-xs",
        speaking && "bg-muted text-foreground",
      )}
      onClick={handlePlay}
    >
      <Volume2 data-icon="inline-start" />
      {children}
    </button>
  );
}
