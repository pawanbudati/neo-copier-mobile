/**
 * QuoteStreamManager — Standalone client for backend SSE quote stream (/api/quotes/stream)
 * Consumes existing backend Server-Sent Events stream directly on mobile via XHR / EventSource.
 */

export interface RawTick {
  token?: string;
  symbol?: string;
  trading_symbol?: string;
  ltp?: number;
  change?: number;
  changePct?: number;
  high?: number;
  low?: number;
  open?: number;
  close?: number;
  volume?: number;
}

export type QuoteTickHandler = (quotesMap: Record<string, RawTick>) => void;

class QuoteStreamManager {
  private currentTokensKey: string = "";
  private listeners: Set<QuoteTickHandler> = new Set();
  private xhrStream: XMLHttpRequest | null = null;
  private eventSource: any = null;

  public onQuotes(handler: QuoteTickHandler) {
    this.listeners.add(handler);
    return () => {
      this.listeners.delete(handler);
    };
  }

  private notify(data: Record<string, any>) {
    if (!data || typeof data !== "object") return;
    this.listeners.forEach((fn) => fn(data));
  }

  public subscribe(serverUrl: string, tokens: string[]) {
    const cleanTokens = Array.from(new Set(tokens.filter((t) => t && t.trim()))).map((t) => t.trim());
    if (cleanTokens.length === 0 || !serverUrl) return;
    const tokensKey = cleanTokens.sort().join(",");

    if (this.currentTokensKey === tokensKey) {
      return;
    }

    this.disconnect();
    this.currentTokensKey = tokensKey;

    const streamUrl = `${serverUrl}/api/quotes/stream?tokens=${encodeURIComponent(tokensKey)}`;

    // 1. Try EventSource if present globally
    const GlobalEventSource = (globalThis as any).EventSource;
    if (typeof GlobalEventSource === "function") {
      try {
        const es = new GlobalEventSource(streamUrl);
        this.eventSource = es;
        es.onmessage = (e: any) => {
          try {
            const data = JSON.parse(e.data);
            if (data && typeof data === "object") {
              this.notify(data);
            }
          } catch (_) {}
        };
        es.onerror = () => {
          this.initXhrStream(streamUrl);
        };
        return;
      } catch (e) {
        // Fallback to XHR
      }
    }

    // 2. Consume SSE stream via XHR onprogress
    this.initXhrStream(streamUrl);
  }

  private initXhrStream(streamUrl: string) {
    try {
      const xhr = new XMLHttpRequest();
      this.xhrStream = xhr;
      xhr.open("GET", streamUrl, true);
      xhr.setRequestHeader("Accept", "text/event-stream");
      let lastIndex = 0;

      xhr.onprogress = () => {
        const text = xhr.responseText;
        const chunk = text.substring(lastIndex);
        lastIndex = text.length;

        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data:")) {
            const jsonStr = line.replace(/^data:\s*/, "").trim();
            if (jsonStr) {
              try {
                const data = JSON.parse(jsonStr);
                if (data && typeof data === "object") {
                  this.notify(data);
                }
              } catch (_) {}
            }
          }
        }
      };

      xhr.onloadend = () => {
        if (this.xhrStream === xhr) {
          setTimeout(() => {
            if (this.currentTokensKey) {
              this.initXhrStream(streamUrl);
            }
          }, 2000);
        }
      };

      xhr.send();
    } catch (e) {
      console.warn("[QuoteStream] XHR Stream init warning", e);
    }
  }

  public disconnect() {
    if (this.xhrStream) {
      try {
        this.xhrStream.abort();
      } catch (_) {}
      this.xhrStream = null;
    }
    if (this.eventSource) {
      try {
        this.eventSource.close();
      } catch (_) {}
      this.eventSource = null;
    }
    this.currentTokensKey = "";
  }
}

export const quoteStream = new QuoteStreamManager();
