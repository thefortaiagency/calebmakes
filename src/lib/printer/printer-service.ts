/**
 * Bambu Lab P1S Printer Service
 * Handles connection, monitoring, and print management via local API
 */

export interface PrinterConfig {
  ip: string
  accessCode: string
  serialNumber: string
  name?: string
}

export interface PrinterStatus {
  connected: boolean
  state: "idle" | "printing" | "paused" | "finished" | "error" | "offline"
  printProgress?: number
  currentLayer?: number
  totalLayers?: number
  timeRemaining?: number
  timeElapsed?: number
  hotendTemp?: number
  hotendTarget?: number
  bedTemp?: number
  bedTarget?: number
  chamberTemp?: number
  fileName?: string
  error?: string
}

const PRINTER_CONFIG_KEY = "calebmakes_printer_config"

export function savePrinterConfig(config: PrinterConfig): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(PRINTER_CONFIG_KEY, JSON.stringify(config))
  }
}

export function loadPrinterConfig(): PrinterConfig | null {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(PRINTER_CONFIG_KEY)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        return null
      }
    }
  }
  return null
}

export function clearPrinterConfig(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(PRINTER_CONFIG_KEY)
  }
}

export class PrinterService {
  private config: PrinterConfig | null = null
  private statusCallback?: (status: PrinterStatus) => void
  private pollInterval?: ReturnType<typeof setInterval>

  constructor() {
    this.config = loadPrinterConfig()
  }

  setConfig(config: PrinterConfig): void {
    this.config = config
    savePrinterConfig(config)
  }

  getConfig(): PrinterConfig | null {
    return this.config
  }

  isConfigured(): boolean {
    return this.config !== null && 
           this.config.ip.length > 0 && 
           this.config.accessCode.length > 0
  }

  async testConnection(): Promise<{ success: boolean; message: string; status?: PrinterStatus }> {
    if (!this.config) {
      return { success: false, message: "Printer not configured" }
    }

    try {
      const response = await fetch("/api/printer/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(this.config),
      })

      const data = await response.json()
      return data
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : "Connection failed" 
      }
    }
  }

  async getStatus(): Promise<PrinterStatus> {
    if (!this.config) {
      return { connected: false, state: "offline" }
    }

    try {
      const response = await fetch("/api/printer/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip: this.config.ip, accessCode: this.config.accessCode }),
      })

      if (!response.ok) {
        return { connected: false, state: "offline" }
      }

      const data = await response.json()
      return data.status
    } catch {
      return { connected: false, state: "offline" }
    }
  }

  startMonitoring(callback: (status: PrinterStatus) => void, intervalMs: number = 5000): void {
    this.statusCallback = callback
    this.stopMonitoring()

    this.getStatus().then(callback)

    this.pollInterval = setInterval(async () => {
      const status = await this.getStatus()
      if (this.statusCallback) {
        this.statusCallback(status)
      }
    }, intervalMs)
  }

  stopMonitoring(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval)
      this.pollInterval = undefined
    }
  }

  async sendPrint(
    gcode: string, 
    fileName: string
  ): Promise<{ success: boolean; message: string; jobId?: string }> {
    if (!this.config) {
      return { success: false, message: "Printer not configured" }
    }

    try {
      const response = await fetch("/api/printer/print", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...this.config,
          gcode,
          fileName,
        }),
      })

      return await response.json()
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to send print" 
      }
    }
  }

  async controlPrinter(action: "pause" | "resume" | "stop" | "light_on" | "light_off"): Promise<{ success: boolean; message: string }> {
    if (!this.config) {
      return { success: false, message: "Printer not configured" }
    }

    try {
      const response = await fetch("/api/printer/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...this.config,
          action,
        }),
      })

      return await response.json()
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : "Control command failed" 
      }
    }
  }

  getCameraUrl(): string | null {
    if (!this.config) return null
    const params = new URLSearchParams({
      ip: this.config.ip,
      accessCode: this.config.accessCode,
    })
    return "/api/printer/camera?" + params.toString()
  }
}

let printerServiceInstance: PrinterService | null = null

export function getPrinterService(): PrinterService {
  if (!printerServiceInstance) {
    printerServiceInstance = new PrinterService()
  }
  return printerServiceInstance
}
