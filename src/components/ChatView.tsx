"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  type?: "text" | "image" | "audio";
  uploadId?: string | null;
};

type SpeechRecognitionAlternativeLike = {
  transcript?: string;
};

type SpeechRecognitionResultLike = {
  0?: SpeechRecognitionAlternativeLike;
};

type SpeechRecognitionEventLike = {
  results?: SpeechRecognitionResultLike[];
};

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructorLike = new () => SpeechRecognitionLike;

export default function ChatView({
  chatId,
  initialMessages,
  hasApiKey,
  sharedKeyAvailable,
  freeModel,
  proModelDefault,
}: {
  chatId: string;
  initialMessages: ChatMessage[];
  hasApiKey: boolean;
  sharedKeyAvailable: boolean;
  freeModel: string;
  proModelDefault: string;
}) {
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [model, setModel] = useState(proModelDefault);
  const [uploading, setUploading] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [recording, setRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaChunksRef = useRef<Blob[]>([]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setMounted(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setMessages(initialMessages);
    setInput("");
    setError(null);
    setLoading(false);
    setUploading(false);
    setRecording(false);
    setTranscribing(false);
    recognitionRef.current?.stop();
    mediaRecorderRef.current?.stop();
  }, [chatId, initialMessages]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      ((window as unknown as { SpeechRecognition?: SpeechRecognitionConstructorLike })
        .SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionConstructorLike })
          .webkitSpeechRecognition) ??
      null;
    const hasMediaRecorder =
      typeof window.MediaRecorder !== "undefined" &&
      typeof navigator !== "undefined" &&
      Boolean(navigator.mediaDevices?.getUserMedia);

    if (!SpeechRecognition && !hasMediaRecorder) {
      setSpeechSupported(false);
      return;
    }

    setSpeechSupported(true);

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = navigator.language || "en-US";
      recognition.interimResults = false;
      recognition.onresult = (event) => {
        const transcript = event?.results?.[0]?.[0]?.transcript || "";
        if (transcript) {
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };
      recognition.onend = () => {
        setRecording(false);
      };
      recognitionRef.current = recognition;
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  async function sendMessage() {
    if (!input.trim() || loading) return;
    setError(null);
    const content = input.trim();
    setInput("");
    const optimisticId = `local-${Date.now()}`;
    setMessages((prev) => [...prev, { id: optimisticId, role: "user", content }]);
    setLoading(true);

    const response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chatId,
        message: content,
        model: hasApiKey ? model : undefined,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(data?.error || "Antwort fehlgeschlagen.");
      setLoading(false);
      return;
    }

    setMessages((prev) => [
      ...prev,
      {
        id: data?.assistant?.id || `assistant-${Date.now()}`,
        role: "assistant",
        content: data?.assistant?.content || "",
      },
    ]);
    setLoading(false);
  }

  async function uploadImage(file: File) {
    setError(null);
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("chatId", chatId);
    const response = await fetch("/api/uploads", {
      method: "POST",
      body: formData,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(data?.error || "Bild-Upload fehlgeschlagen.");
      setUploading(false);
      return;
    }
    const message = data?.message;
    if (message?.id) {
      setMessages((prev) => [
        ...prev,
        {
          id: message.id,
          role: "user",
          type: "image",
          uploadId: message.uploadId,
          content: "",
        },
      ]);
    }
    setUploading(false);
  }

  async function uploadAudio(file: File) {
    setError(null);
    setUploadingAudio(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("chatId", chatId);
    const response = await fetch("/api/uploads", {
      method: "POST",
      body: formData,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(data?.error || "Audio-Upload fehlgeschlagen.");
      setUploadingAudio(false);
      return;
    }
    const message = data?.message;
    if (message?.id) {
      setMessages((prev) => [
        ...prev,
        {
          id: message.id,
          role: "user",
          type: "audio",
          uploadId: message.uploadId,
          content: "",
        },
      ]);
      await analyzeAudio(message.uploadId);
    }
    setUploadingAudio(false);
  }

  async function analyzeAudio(uploadId?: string | null) {
    if (!uploadId) return;
    setError(null);
    setLoading(true);
    const response = await fetch("/api/ai/analyze-audio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId, uploadId }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(data?.error || "Audio-Analyse fehlgeschlagen.");
      setLoading(false);
      return;
    }
    if (data?.assistant?.id) {
      setMessages((prev) => [
        ...prev,
        {
          id: data.assistant.id,
          role: "assistant",
          content: data.assistant.content || "",
        },
      ]);
    }
    setLoading(false);
  }

  async function transcribeAudio(blob: Blob) {
    setError(null);
    setTranscribing(true);
    const formData = new FormData();
    formData.append("file", blob, `speech-${Date.now()}.webm`);
    formData.append("language", navigator.language || "en");

    const response = await fetch("/api/ai/transcribe", {
      method: "POST",
      body: formData,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(data?.error || "Transkription fehlgeschlagen.");
      setTranscribing(false);
      return;
    }
    const text = data?.text?.toString().trim();
    if (text) {
      setInput((prev) => (prev ? `${prev} ${text}` : text));
    }
    setTranscribing(false);
  }

  async function toggleRecording() {
    setError(null);

    if (recording) {
      recognitionRef.current?.stop();
      mediaRecorderRef.current?.stop();
      return;
    }

    if (recognitionRef.current) {
      setRecording(true);
      recognitionRef.current.start();
      return;
    }

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      setError("Speech-to-Text wird in diesem Browser nicht unterstützt.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      mediaChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          mediaChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        setRecording(false);
        const blob = new Blob(mediaChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        if (blob.size > 0) {
          await transcribeAudio(blob);
        }
      };

      recorder.start();
      setRecording(true);
    } catch {
      setError("Mikrofonzugriff fehlgeschlagen.");
    }
  }

  if (!mounted) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-[color:var(--muted)]">
        Lade Chat…
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="rounded-3xl border border-[color:var(--border)] bg-white/70 p-6 shadow-[var(--shadow)]">
        <h1 className="text-2xl font-semibold">ZackAI Chat</h1>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          {hasApiKey
            ? "Pro-Modus aktiv: dein eigener Groq-Key wird genutzt."
            : sharedKeyAvailable
            ? `Free-Modus aktiv: begrenzter Kontext, Modell ${freeModel}.`
            : "Kein API-Key konfiguriert. Ohne Key sind keine Antworten möglich."}
        </p>
        {!hasApiKey && (
          <p className="mt-3 text-sm text-[color:var(--muted)]">
            Für volle Power deinen Groq-Key in{" "}
            <Link
              className="font-semibold text-[color:var(--accent)]"
              href="/settings"
            >
              Einstellungen
            </Link>{" "}
            hinterlegen.
          </p>
        )}
      </div>

      <div className="flex-1 space-y-4 rounded-3xl border border-[color:var(--border)] bg-white/80 p-6 shadow-[var(--shadow)]">
        {messages.length === 0 && (
          <p className="text-sm text-[color:var(--muted)]">
            Starte mit einer Frage oder Idee. ZackAI antwortet ausführlich und
            strukturiert.
          </p>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-3xl whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              message.role === "user"
                ? "ml-auto bg-[color:var(--accent)] text-white"
                : "bg-[rgba(31,122,118,0.08)] text-[color:var(--fg)]"
            }`}
          >
            {message.type === "image" &&
            typeof message.uploadId === "string" &&
            message.uploadId.length > 0 ? (
              <img
                src={`/api/uploads/${message.uploadId}`}
                alt="Upload"
                className="h-auto w-full rounded-xl object-contain"
                loading="lazy"
              />
            ) : message.type === "audio" &&
              typeof message.uploadId === "string" &&
              message.uploadId.length > 0 ? (
              <audio
                controls
                src={`/api/uploads/${message.uploadId}`}
                className="w-full"
              />
            ) : (
              message.content
            )}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="rounded-3xl border border-[color:var(--border)] bg-white/80 p-6 shadow-[var(--shadow)]">
        {hasApiKey && (
          <div className="mb-4">
            <label className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
              Modell
            </label>
            <input
              value={model}
              onChange={(event) => setModel(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
              placeholder="z.B. llama-3.1-70b-versatile"
            />
          </div>
        )}
        <div className="flex flex-col gap-3 sm:flex-row">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            rows={3}
            placeholder="Schreibe deine Frage…"
            className="flex-1 resize-none rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
          />
          <div className="flex flex-col gap-3 sm:w-[180px]">
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="rounded-2xl bg-[color:var(--accent)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[color:var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Denke..." : "Senden"}
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="rounded-2xl border border-[color:var(--border)] px-6 py-3 text-sm font-semibold transition hover:border-[color:var(--accent)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {uploading ? "Lade..." : "Bild hochladen"}
            </button>
            <button
              type="button"
              onClick={() => audioInputRef.current?.click()}
              disabled={uploadingAudio}
              className="rounded-2xl border border-[color:var(--border)] px-6 py-3 text-sm font-semibold transition hover:border-[color:var(--accent)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {uploadingAudio ? "Lade..." : "Audio hochladen"}
            </button>
            <button
              type="button"
              onClick={toggleRecording}
              disabled={!speechSupported || transcribing}
              className="rounded-2xl border border-[color:var(--border)] px-6 py-3 text-sm font-semibold transition hover:border-[color:var(--accent)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {recording
                ? "Stop Aufnahme"
                : transcribing
                ? "Transkribiere..."
                : "Spracheingabe"}
            </button>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              uploadImage(file);
              event.target.value = "";
            }
          }}
        />
        <input
          ref={audioInputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              uploadAudio(file);
              event.target.value = "";
            }
          }}
        />
        {error && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
