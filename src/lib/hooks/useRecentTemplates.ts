"use client"

import { useState, useEffect, useCallback } from "react"

const STORAGE_KEY = "recentTemplates"
const MAX_RECENT_TEMPLATES = 8

export interface RecentTemplateEntry {
  templateId: string
  timestamp: number
}

/**
 * Custom hook to manage recently used templates in localStorage.
 * Tracks the last 8 templates the user has customized.
 * Handles SSR properly by only accessing localStorage on the client.
 */
export function useRecentTemplates() {
  const [recentTemplateIds, setRecentTemplateIds] = useState<string[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load recent templates from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") {
      setIsLoaded(true)
      return
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const entries: RecentTemplateEntry[] = JSON.parse(stored)
        // Sort by timestamp (most recent first) and extract IDs
        const sortedIds = entries
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, MAX_RECENT_TEMPLATES)
          .map((entry) => entry.templateId)
        setRecentTemplateIds(sortedIds)
      }
    } catch (error) {
      console.error("Failed to load recent templates:", error)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Add a template to the recent list
  const addRecentTemplate = useCallback((templateId: string) => {
    if (typeof window === "undefined") return

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      let entries: RecentTemplateEntry[] = stored ? JSON.parse(stored) : []

      // Remove existing entry for this template (if any)
      entries = entries.filter((entry) => entry.templateId !== templateId)

      // Add new entry at the beginning
      entries.unshift({
        templateId,
        timestamp: Date.now(),
      })

      // Keep only the most recent entries
      entries = entries.slice(0, MAX_RECENT_TEMPLATES)

      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))

      // Update state
      setRecentTemplateIds(entries.map((entry) => entry.templateId))
    } catch (error) {
      console.error("Failed to save recent template:", error)
    }
  }, [])

  // Clear all recent templates
  const clearRecentTemplates = useCallback(() => {
    if (typeof window === "undefined") return

    try {
      localStorage.removeItem(STORAGE_KEY)
      setRecentTemplateIds([])
    } catch (error) {
      console.error("Failed to clear recent templates:", error)
    }
  }, [])

  return {
    recentTemplateIds,
    addRecentTemplate,
    clearRecentTemplates,
    isLoaded,
  }
}
