/**
 * KotakLiveFeed — Mobile WebSocket connection to Kotak Securities binary feed
 */

const WEBSOCKET_URL = "wss://mlhsm.kotaksecurities.com";
const TRASH_VAL = -2147483648;

const BinRespTypes = {
  CONNECTION_TYPE: 1,
  THROTTLING_TYPE: 2,
  ACK_TYPE: 3,
  SUBSCRIBE_TYPE: 4,
  UNSUBSCRIBE_TYPE: 5,
  DATA_TYPE: 6,
  CHPAUSE_TYPE: 7,
  CHRESUME_TYPE: 8,
  SNAPSHOT: 9,
  OPC_SUBSCRIBE: 10,
} as const;

const ResponseTypes = { SNAP: 83, UPDATE: 85 } as const;
const FieldTypes = { FLOAT32: 1, LONG: 2, DATE: 3, STRING: 4 } as const;
const TopicTypes = { SCRIP: "sf", INDEX: "if", DEPTH: "dp" } as const;

export interface KotakTickData {
  tk: string; // Token
  ts?: string; // Trading symbol
  e?: string; // Exchange
  ltp?: number;
  c?: number; // Close
  cng?: number; // Change
  nc?: number; // % Change
  v?: number; // Volume
  ap?: number; // VWAP
  op?: number; // Open
  h?: number; // High
  lo?: number; // Low
  raw?: any;
}

export type KotakTickCallback = (tick: KotakTickData) => void;
export type KotakStatusCallback = (connected: boolean, statusText: string) => void;

export class KotakLiveFeed {
  private ws: WebSocket | null = null;
  private token: string = "";
  private sid: string = "";
  private hsServerId: string = "";
  private subscriptions: Set<string> = new Set();
  private tickCallbacks: Set<KotakTickCallback> = new Set();
  private statusCallbacks: Set<KotakStatusCallback> = new Set();
  private pingInterval: any = null;
  private reconnectTimeout: any = null;
  private isConnecting: boolean = false;
  private isConnected: boolean = false;

  constructor() {}

  public connect(token: string, sid: string, hsServerId: string = "") {
    if (this.isConnected || this.isConnecting) return;
    this.token = token;
    this.sid = sid;
    this.hsServerId = hsServerId;
    this.isConnecting = true;
    this.notifyStatus(false, "Connecting to Kotak feed...");

    try {
      this.ws = new WebSocket(WEBSOCKET_URL);
      this.ws.binaryType = "arraybuffer";

      this.ws.onopen = () => {
        this.isConnecting = false;
        this.isConnected = true;
        this.notifyStatus(true, "Connected to Kotak feed");
        this.sendHandshake();
        this.startPing();
        this.resubscribeAll();
      };

      this.ws.onmessage = (event) => {
        if (event.data instanceof ArrayBuffer) {
          this.parseBinaryMessage(event.data);
        }
      };

      this.ws.onerror = (err) => {
        console.warn("[KotakWS] Error:", err);
        this.notifyStatus(false, "Feed connection error");
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.isConnecting = false;
        this.stopPing();
        this.notifyStatus(false, "Feed disconnected. Retrying...");
        this.scheduleReconnect();
      };
    } catch (e: any) {
      this.isConnecting = false;
      this.isConnected = false;
      this.notifyStatus(false, e?.message || "Connection failed");
      this.scheduleReconnect();
    }
  }

  private sendHandshake() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const authData = JSON.stringify({
      Authorization: this.token,
      Sid: this.sid,
      hsServerId: this.hsServerId,
    });
    this.ws.send(authData);
  }

  private startPing() {
    this.stopPing();
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
        this.ws.send("ping");
      }
    }, 25000);
  }

  private stopPing() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    this.pingInterval = null;
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = setTimeout(() => {
      if (this.token && this.sid) {
        this.connect(this.token, this.sid, this.hsServerId);
      }
    }, 5000);
  }

  public subscribe(scripToken: string, channel: "sf" | "if" = "sf") {
    const key = `${channel}:${scripToken}`;
    this.subscriptions.add(key);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const msg = JSON.stringify({
        type: BinRespTypes.SUBSCRIBE_TYPE,
        data: [{ topic: key }],
      });
      this.ws.send(msg);
    }
  }

  public unsubscribe(scripToken: string, channel: "sf" | "if" = "sf") {
    const key = `${channel}:${scripToken}`;
    this.subscriptions.delete(key);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const msg = JSON.stringify({
        type: BinRespTypes.UNSUBSCRIBE_TYPE,
        data: [{ topic: key }],
      });
      this.ws.send(msg);
    }
  }

  private resubscribeAll() {
    for (const sub of this.subscriptions) {
      const [channel, token] = sub.split(":");
      this.subscribe(token, channel as any);
    }
  }

  public onTick(cb: KotakTickCallback) {
    this.tickCallbacks.add(cb);
    return () => {
      this.tickCallbacks.delete(cb);
    };
  }

  public onStatus(cb: KotakStatusCallback) {
    this.statusCallbacks.add(cb);
    cb(this.isConnected, this.isConnected ? "Connected" : "Disconnected");
    return () => {
      this.statusCallbacks.delete(cb);
    };
  }

  private notifyStatus(connected: boolean, status: string) {
    this.statusCallbacks.forEach((cb) => cb(connected, status));
  }

  private notifyTick(tick: KotakTickData) {
    this.tickCallbacks.forEach((cb) => cb(tick));
  }

  private parseBinaryMessage(buffer: ArrayBuffer) {
    try {
      const view = new DataView(buffer);
      if (buffer.byteLength < 4) return;
      // Basic binary unpacking fallback logic
      const token = view.getInt32(0, false).toString();
      const ltp = view.getFloat32(4, false);
      if (token && !isNaN(ltp) && ltp > 0) {
        this.notifyTick({ tk: token, ltp });
      }
    } catch (e) {
      // Ignore binary malformed packets
    }
  }

  public disconnect() {
    this.stopPing();
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.isConnecting = false;
    this.notifyStatus(false, "Disconnected");
  }
}

export const kotakFeed = new KotakLiveFeed();
