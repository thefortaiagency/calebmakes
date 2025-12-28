"use client"

import { useState, useEffect, useCallback } from "react"

const FAVORITES_STORAGE_KEY = "calebmakes-library-favorites"

/**
 * Custom hook for managing favorites in localStorage
 * Handles SSR gracefully by initializing from localStorage only on client
 */
export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [isLoaded, setIsLoaded] = useState(false)

  // Load favorites from localStorage on mount (client-side only)
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem(FAVORITES_STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed)) {
            setFavorites(new Set(parsed))
          }
        }
      }
    } catch (error) {
      console.error("Failed to load favorites from localStorage:", error)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    if (!isLoaded) return // Don't save during initial load

    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(
          FAVORITES_STORAGE_KEY,
          JSON.stringify(Array.from(favorites))
        )
      }
    } catch (error) {
      console.error("Failed to save favorites to localStorage:", error)
    }
  }, [favorites, isLoaded])

  // Toggle a template's favorite status
  const toggleFavorite = useCallback((templateId: string) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(templateId)) {
        newFavorites.delete(templateId)
      } else {
        newFavorites.add(templateId)
      }
      return newFavorites
    })
  }, [])

  // Check if a template is favorited
  const isFavorite = useCallback(
    (templateId: string) => {
      return favorites.has(templateId)
    },
    [favorites]
  )

  // Add a template to favorites
  const addFavorite = useCallback((templateId: string) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev)
      newFavorites.add(templateId)
      return newFavorites
    })
  }, [])

  // Remove a template from favorites
  const removeFavorite = useCallback((templateId: string) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev)
      newFavorites.delete(templateId)
      return newFavorites
    })
  }, [])

  // Clear all favorites
  const clearFavorites = useCallback(() => {
    setFavorites(new Set())
  }, [])

  // Get count of favorites
  const favoritesCount = favorites.size

  // Get array of favorite IDs
  const favoriteIds = Array.from(favorites)

  return {
    favorites,
    favoriteIds,
    favoritesCount,
    isLoaded,
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    clearFavorites,
  }
}
