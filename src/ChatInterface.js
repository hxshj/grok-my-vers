import React, { useState } from "react";
import { ArrowLeft, Share, Square, History, Sun, Moon } from "lucide-react";

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

  const API_URL = "https://api.openai.com/v1/chat/completions";

  const handleSubmit = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      content: inputMessage,
      role: "user",
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [{ role: "user", content: inputMessage }],
          temperature: 0.7,
        }),
      });

      const data = await response.json();
      console.log("Ответ OpenAI API:", data);

      if (data.choices && data.choices.length > 0) {
        const assistantMessage = {
          content: data.choices[0].message.content.replace(/GPT-3.5/g, "GPT-4o Mini"),
          role: "assistant",
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        console.error("Ошибка API:", data);
      }
    } catch (err) {
      console.error("Ошибка при запросе OpenAI API:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Отключает стандартный Enter (не делает перенос строки)
      handleSubmit();
    }
  };

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  return (
    <div className={`${isDarkMode ? "bg-black text-white" : "bg-white text-black"} flex justify-center items-center h-screen`}>
      {/* Контейнер с тонкой окантовкой */}
      <div className={`w-full max-w-[800px] h-full flex flex-col border ${isDarkMode ? "border-zinc-600" : "border-zinc-300"} rounded-lg shadow-md`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-4 py-3 border-b ${isDarkMode ? "border-zinc-800" : "border-zinc-300"}`}>
          <div className="flex items-center gap-4">
            <button className="hover:bg-zinc-900 p-2 rounded-lg">
              <ArrowLeft className="h-5 w-5" />
            </button>
            {/* Кнопка переключения темы */}
            <button onClick={toggleTheme} className="hover:bg-zinc-900 p-2 rounded-lg">
              {isDarkMode ? <Sun className="h-5 w-5 text-yellow-500" /> : <Moon className="h-5 w-5 text-gray-800" />}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Chat</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="hover:bg-zinc-900 p-2 rounded-lg">
              <History className="h-5 w-5" />
            </button>
            <button className="hover:bg-zinc-900 p-2 rounded-lg">
              <Share className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 p-4">
          {messages.map((message, index) => (
            <div key={index} className="flex gap-3">
              {/* Аватар пользователя или бота */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full ${isDarkMode ? "bg-zinc-800" : "bg-gray-300"} flex items-center justify-center`}>
                {message.role === "assistant" ? "🤖" : "👤"}
              </div>
              {/* Текст сообщения без фона */}
              <div className={`flex-1 ${isDarkMode ? "text-zinc-300" : "text-gray-800"}`}>{message.content}</div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className={`w-8 h-8 rounded-full ${isDarkMode ? "bg-zinc-800" : "bg-gray-300"} flex items-center justify-center`}>🤖</div>
              <div className={`${isDarkMode ? "text-zinc-400" : "text-gray-600"}`}>Печатает...</div>
            </div>
          )}
        </div>

        {/* Input area */}
        <div className={`p-4 border-t ${isDarkMode ? "border-zinc-800" : "border-zinc-300"}`}>
          <div className={`rounded-lg flex items-center p-2 ${isDarkMode ? "bg-zinc-900" : "bg-gray-200"}`}>
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Введите запрос"
              className={`w-full bg-transparent p-2 outline-none ${isDarkMode ? "text-zinc-200 placeholder-zinc-400" : "text-gray-900 placeholder-gray-500"} resize-none`}
              rows="1"
            />
            <button onClick={handleSubmit} className="p-2 hover:bg-zinc-800 rounded-lg ml-2">
              ↑
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
