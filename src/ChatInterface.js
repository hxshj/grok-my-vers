import React, { useState, useEffect } from "react";
import { ArrowLeft, Link, History, Sun, Moon } from "lucide-react";

// Функции для работы с хранилищем ссылок
const getChatLinks = () => {
  try {
    return JSON.parse(localStorage.getItem('chatLinks')) || {};
  } catch {
    return {};
  }
};

const createLink = (linkData) => {
  const links = getChatLinks();
  links[linkData.id] = linkData;
  localStorage.setItem('chatLinks', JSON.stringify(links));
};

const getLinkData = (linkId) => {
  const links = getChatLinks();
  return links[linkId];
};

const updateLinkUses = (linkId) => {
  const links = getChatLinks();
  if (links[linkId]) {
    links[linkId].uses += 1;
    localStorage.setItem('chatLinks', JSON.stringify(links));
    return links[linkId];
  }
  return null;
};

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [chatClosed, setChatClosed] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [requestLimit, setRequestLimit] = useState(25);

  const API_KEY = process.env.REACT_APP_OPENAI_API_KEY;
  const API_URL = "https://api.openai.com/v1/chat/completions";

  useEffect(() => {
    const path = window.location.pathname;
    const linkId = path.split('/chat/')[1];
    
    if (linkId) {
      const link = getLinkData(linkId);
      if (!link) {
        setMessages([{
          content: "Invalid chat link.",
          role: "system",
          timestamp: new Date().toISOString()
        }]);
        setChatClosed(true);
      } else if (link.uses >= link.maxUses) {
        setMessages([{
          content: "This chat link has reached its usage limit. Chat is now closed.",
          role: "system",
          timestamp: new Date().toISOString()
        }]);
        setChatClosed(true);
      }
    }
  }, []);

  const generateLink = () => {
    const linkId = Math.random().toString(36).substring(2, 15);
    const linkData = {
      id: linkId,
      uses: 0,
      maxUses: requestLimit,
      created: Date.now()
    };
    
    createLink(linkData);
    const link = `${window.location.origin}/chat/${linkId}`;
    navigator.clipboard.writeText(link);
    
    setMessages(prev => [...prev, {
      content: `New chat link generated and copied to clipboard! It will expire after ${requestLimit} uses.`,
      role: "system",
      timestamp: new Date().toISOString()
    }]);
    setShowLinkModal(false);
  };

  const handleSubmit = async () => {
    if (!inputMessage.trim() || isLoading || chatClosed) return;

    const path = window.location.pathname;
    const linkId = path.split('/chat/')[1];
    
    if (linkId) {
      const link = updateLinkUses(linkId);
      if (!link || link.uses > link.maxUses) {
        setMessages(prev => [...prev, {
          content: "Chat limit reached. Chat is now closed.",
          role: "system",
          timestamp: new Date().toISOString()
        }]);
        setChatClosed(true);
        return;
      }
    }

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

      if (data.choices && data.choices.length > 0) {
        const assistantMessage = {
          content: data.choices[0].message.content,
          role: "assistant",
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // Проверяем лимит после получения ответа
        if (linkId) {
          const link = getLinkData(linkId);
          if (link && link.uses >= link.maxUses) {
            setTimeout(() => {
              setMessages(prev => [...prev, {
                content: "Chat limit reached. Chat is now closed.",
                role: "system",
                timestamp: new Date().toISOString()
              }]);
              setChatClosed(true);
            }, 1000);
          }
        }
      }
    } catch (err) {
      console.error("API Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`${isDarkMode ? "bg-black text-white" : "bg-white text-black"} flex justify-center items-center h-screen`}>
      <div className={`w-full max-w-[800px] h-full flex flex-col border ${isDarkMode ? "border-zinc-600" : "border-zinc-300"} rounded-lg shadow-md`}>
        <div className={`flex items-center justify-between px-4 py-3 border-b ${isDarkMode ? "border-zinc-800" : "border-zinc-300"}`}>
          <div className="flex items-center gap-4">
            <button className="hover:bg-zinc-900 p-2 rounded-lg">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="hover:bg-zinc-900 p-2 rounded-lg">
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="font-medium">Chat</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowLinkModal(true)}
              className="hover:bg-zinc-900 p-2 rounded-lg"
              title="Generate chat link"
            >
              <Link className="h-5 w-5" />
            </button>
            <button className="hover:bg-zinc-900 p-2 rounded-lg">
              <History className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 p-4">
          {messages.map((message, index) => (
            <div key={index} className="flex gap-3">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full ${isDarkMode ? "bg-zinc-800" : "bg-gray-300"} flex items-center justify-center`}>
                {message.role === "assistant" ? "🤖" : message.role === "system" ? "🔔" : "👤"}
              </div>
              <div className={`flex-1 ${isDarkMode ? "text-zinc-300" : "text-gray-800"}`}>
                {message.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className={`w-8 h-8 rounded-full ${isDarkMode ? "bg-zinc-800" : "bg-gray-300"} flex items-center justify-center`}>
                🤖
              </div>
              <div className={`${isDarkMode ? "text-zinc-400" : "text-gray-600"}`}>
                Typing...
              </div>
            </div>
          )}
        </div>

        <div className={`p-4 border-t ${isDarkMode ? "border-zinc-800" : "border-zinc-300"}`}>
          <div className={`rounded-lg flex items-center p-2 ${isDarkMode ? "bg-zinc-900" : "bg-gray-200"} ${chatClosed ? "opacity-50" : ""}`}>
            <textarea
              value={inputMessage}
              onChange={(e) => !chatClosed && setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !chatClosed) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder={chatClosed ? "Chat is closed" : "Enter your message"}
              className={`w-full bg-transparent p-2 outline-none ${
                isDarkMode ? "text-zinc-200 placeholder-zinc-400" : "text-gray-900 placeholder-gray-500"
              } resize-none ${chatClosed ? "cursor-not-allowed" : ""}`}
              disabled={chatClosed}
              rows="1"
            />
            <button 
              onClick={handleSubmit}
              className={`p-2 hover:bg-zinc-800 rounded-lg ml-2 ${chatClosed ? "cursor-not-allowed opacity-50" : ""}`}
              disabled={chatClosed}
            >
              ↑
            </button>
          </div>
        </div>
      </div>

      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className={`${isDarkMode ? 'bg-zinc-800' : 'bg-white'} p-4 rounded-lg w-80`}>
            <h3 className="text-lg font-medium mb-4">Set Request Limit</h3>
            <div className="mb-4">
              <input
                type="number"
                min="1"
                max="100"
                value={requestLimit}
                onChange={(e) => setRequestLimit(Math.max(1, parseInt(e.target.value) || 1))}
                className={`w-full p-2 rounded ${
                  isDarkMode ? 'bg-zinc-700 text-white' : 'bg-gray-100 text-black'
                }`}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowLinkModal(false)}
                className={`px-4 py-2 rounded ${
                  isDarkMode ? 'hover:bg-zinc-700' : 'hover:bg-gray-200'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={generateLink}
                className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white"
              >
                Generate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;