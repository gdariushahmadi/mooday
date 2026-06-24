"use client";

import React, { useState, useEffect, useRef } from "react";
import { useApp } from "@/context/AppContext";

interface ChatOverlayProps {
  threadId: string;
  onBack: () => void;
  onCheckout: () => void;
}

export const ChatOverlay: React.FC<ChatOverlayProps> = ({
  threadId,
  onBack,
  onCheckout,
}) => {
  const { language, chats, sendChatMessage } = useApp();
  const isAr = language === "ar";
  
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const thread = chats.find((c) => c.id === threadId);

  // Auto scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread?.messages]);

  if (!thread) {
    return (
      <div className="p-xl text-center">
        <p className="text-on-surface-variant font-sans">Chat not found.</p>
        <button onClick={onBack} className="btn-primary mt-md px-md py-sm rounded-full">Back</button>
      </div>
    );
  }

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    sendChatMessage(threadId, inputText.trim());
    setInputText("");
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col md:max-w-[600px] md:mx-auto md:shadow-2xl md:border-x border-surface-container-high font-sans">
      {/* Header */}
      <header className="bg-surface sticky top-0 z-10 border-b border-surface-container-high px-margin-mobile py-md flex items-center justify-between">
        <div className="flex items-center gap-md">
          <button
            onClick={onBack}
            className="text-on-surface hover:bg-surface-container-low transition-colors rounded-full p-2 flex items-center justify-center active:scale-95"
            aria-label="Back"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          
          <img
            alt={thread.sellerName}
            src={thread.sellerAvatar}
            className="w-10 h-10 rounded-full object-cover border border-outline-variant"
          />
          <div>
            <h3 className="text-label-md font-bold text-on-surface leading-tight">
              {thread.sellerName}
            </h3>
            <span className="text-[11px] text-primary font-bold">Online</span>
          </div>
        </div>

        {/* Dynamic Context Button to Buy Directly */}
        <button
          onClick={onCheckout}
          className="btn-primary text-label-sm font-bold px-4 py-2 rounded-full active:scale-95 transition-transform"
        >
          {isAr ? "شراء المنتج" : "Buy Item"}
        </button>
      </header>

      {/* Product preview bar */}
      <div className="bg-surface-container-low border-b border-surface-container-high px-margin-mobile py-sm flex items-center gap-sm">
        <img
          alt={thread.productTitle}
          src={thread.productImage}
          className="w-10 h-10 rounded object-cover border border-outline-variant flex-shrink-0"
        />
        <div className="min-w-0">
          <p className="text-label-sm font-bold text-on-surface truncate">
            {thread.productTitle}
          </p>
          <span className="text-[11px] text-outline font-bold">AED 1,250</span>
        </div>
      </div>

      {/* Messages area */}
      <main className="flex-grow overflow-y-auto no-scrollbar p-lg flex flex-col gap-md bg-surface-container-lowest">
        {thread.messages.map((msg) => {
          const isUser = msg.sender === "user";
          return (
            <div
              key={msg.id}
              className={`flex flex-col max-w-[75%] ${
                isUser ? "self-end items-end" : "self-start items-start"
              }`}
            >
              <div
                className={`p-md rounded-2xl text-body-md leading-normal ${
                  isUser
                    ? "bg-primary text-on-primary rounded-br-none"
                    : "bg-surface-container-high text-on-surface rounded-bl-none"
                }`}
              >
                {msg.text}
              </div>
              <span className="text-[10px] text-outline mt-1 px-1">
                {msg.time}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </main>

      {/* Input box form */}
      <footer className="bg-surface border-t border-surface-container-high p-md">
        <form onSubmit={handleSend} className="flex gap-sm items-center">
          <input
            type="text"
            placeholder={isAr ? "اكتب رسالة..." : "Type your message..."}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-grow p-md bg-surface-container-low border border-outline-variant rounded-full text-body-md outline-none focus:border-primary placeholder-outline-variant"
          />
          <button
            type="submit"
            className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center active:scale-95 transition-transform shadow-md"
            aria-label="Send"
          >
            <span className="material-symbols-outlined text-[20px]">send</span>
          </button>
        </form>
      </footer>
    </div>
  );
};
