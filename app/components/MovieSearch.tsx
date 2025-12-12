"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";
import { MovieSearchResult } from "./types";

interface MovieSearchProps {
  onSearchResults: (results: MovieSearchResult[]) => void;
  onQueryChange: (query: string) => void;
  onError?: (error: string) => void;
  isLoading?: boolean;
}

const STORAGE_KEY_SEARCH_HISTORY = "cinelog_search_history";
const MAX_HISTORY_ITEMS = 5;

export default function MovieSearch({ 
  onSearchResults, 
  onQueryChange, 
  onError,
  isLoading: externalIsLoading 
}: MovieSearchProps) {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const { t, apiLang } = useTranslation();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);

  const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

  // 検索履歴を読み込む
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SEARCH_HISTORY);
      if (saved) {
        setSearchHistory(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Error loading search history:", error);
    }
  }, []);

  // 検索履歴を保存
  const saveToHistory = (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    const trimmedQuery = searchQuery.trim();
    const updated = [trimmedQuery, ...searchHistory.filter(h => h !== trimmedQuery)].slice(0, MAX_HISTORY_ITEMS);
    setSearchHistory(updated);
    
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY_SEARCH_HISTORY, JSON.stringify(updated));
      } catch (error) {
        console.error("Error saving search history:", error);
      }
    }
  };

  // クリックアウトサイドで履歴を閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        historyRef.current &&
        !historyRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowHistory(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchMovies = async (searchQuery: string, immediate = false) => {
    const trimmedQuery = searchQuery.trim();
    
    if (!trimmedQuery) {
      onSearchResults([]);
      onQueryChange("");
      setIsSearching(false);
      return;
    }

    onQueryChange(trimmedQuery);
    setIsSearching(true);

    try {
      if (!TMDB_API_KEY) {
        onSearchResults([]);
        if (onError) {
          onError("TMDB APIキーが設定されていません");
        }
        setIsSearching(false);
        return;
      }

      const response = await fetch(
        `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(trimmedQuery)}&language=${apiLang}`
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const results = data.results || [];
      
      onSearchResults(results);
      
      // 検索成功時に履歴に保存
      if (results.length > 0) {
        saveToHistory(trimmedQuery);
      }
    } catch (error) {
      console.error("Error searching movies:", error);
      onSearchResults([]);
      if (onError) {
        onError("検索中にエラーが発生しました");
      }
    } finally {
      setIsSearching(false);
    }
  };

  // デバウンス処理（300ms）
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (query.trim()) {
      debounceTimerRef.current = setTimeout(() => {
        searchMovies(query);
      }, 300);
    } else {
      onSearchResults([]);
      onQueryChange("");
      setIsSearching(false);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query]);

  const handleClear = () => {
    setQuery("");
    onSearchResults([]);
    onQueryChange("");
    setIsSearching(false);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      searchMovies(query, true);
      setShowHistory(false);
    } else if (e.key === "Escape") {
      setShowHistory(false);
    }
  };

  const handleHistoryClick = (historyItem: string) => {
    setQuery(historyItem);
    setShowHistory(false);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    searchMovies(historyItem, true);
  };

  const handleHistoryDelete = (e: React.MouseEvent, historyItem: string) => {
    e.stopPropagation();
    const updated = searchHistory.filter(h => h !== historyItem);
    setSearchHistory(updated);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY_SEARCH_HISTORY, JSON.stringify(updated));
      } catch (error) {
        console.error("Error saving search history:", error);
      }
    }
  };

  const isLoading = externalIsLoading || isSearching;

  return (
    <div className="w-full max-w-xl relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowHistory(searchHistory.length > 0)}
          onKeyDown={handleKeyDown}
          placeholder="映画タイトルを検索..."
          className="w-full rounded-full bg-gray-700 border border-gray-600 py-3 pl-12 pr-10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-all duration-200 p-1.5 rounded-full hover:bg-white/10"
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {isLoading && !query && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#d4af37]/50 border-t-[#d4af37]"></div>
          </div>
        )}
      </div>

      {/* 検索履歴ドロップダウン */}
      {showHistory && searchHistory.length > 0 && (
        <div
          ref={historyRef}
          className="absolute top-full left-0 right-0 mt-2 rounded-lg border border-gray-600 bg-gray-800 shadow-lg z-50 max-h-60 overflow-y-auto"
        >
          <div className="p-2">
            <div className="text-xs text-gray-400 px-3 py-2 mb-1">最近の検索</div>
            {searchHistory.map((item, index) => (
              <button
                key={index}
                onClick={() => handleHistoryClick(item)}
                className="w-full flex items-center justify-between px-3 py-2 text-left text-sm text-white hover:bg-gray-700 rounded transition-colors group"
              >
                <span className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-gray-400" />
                  {item}
                </span>
                <button
                  onClick={(e) => handleHistoryDelete(e, item)}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white transition-opacity p-1"
                  type="button"
                >
                  <X className="h-3 w-3" />
                </button>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

