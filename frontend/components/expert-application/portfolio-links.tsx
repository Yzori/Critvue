/**
 * Portfolio Links Component
 * Smart portfolio URL management with platform auto-detection
 */

'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Link2, ExternalLink, Sparkles } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  PORTFOLIO_PLATFORMS,
  detectPlatform,
  getSuggestedPlatforms,
  type PortfolioLink
} from '@/lib/expert-application/types'

const MAX_LINKS = 3

interface PortfolioLinksProps {
  links: PortfolioLink[]
  skillCategories: string[]
  onAdd: (link: PortfolioLink) => void
  onRemove: (linkId: string) => void
  onUpdate?: (linkId: string, data: Partial<PortfolioLink>) => void
}

export function PortfolioLinks({
  links,
  skillCategories,
  onAdd,
  onRemove,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onUpdate: _onUpdate
}: PortfolioLinksProps) {
  const [inputUrl, setInputUrl] = useState('')
  const [inputError, setInputError] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  const suggestedPlatforms = getSuggestedPlatforms(skillCategories)

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleAddLink = useCallback(() => {
    if (!inputUrl.trim()) {
      setInputError('Please enter a URL')
      return
    }

    // Add https:// if missing
    let url = inputUrl.trim()
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url
    }

    if (!validateUrl(url)) {
      setInputError('Please enter a valid URL')
      return
    }

    // Check for duplicates
    if (links.some(link => link.url.toLowerCase() === url.toLowerCase())) {
      setInputError('This URL is already added')
      return
    }

    const { platform, platformCategory } = detectPlatform(url)

    const newLink: PortfolioLink = {
      id: crypto.randomUUID(),
      url,
      platform,
      platformCategory
    }

    onAdd(newLink)
    setInputUrl('')
    setInputError('')
  }, [inputUrl, links, onAdd])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddLink()
    }
  }

  const getPlatformInfo = (platformKey: string) => {
    const platform = PORTFOLIO_PLATFORMS[platformKey as keyof typeof PORTFOLIO_PLATFORMS]
    if (platform) {
      return { name: platform.name, icon: platform.icon }
    }
    if (platformKey === 'custom') {
      return { name: 'Personal Website', icon: '🌐' }
    }
    return { name: 'Website', icon: '🔗' }
  }

  const handleSuggestionClick = (platformKey: string) => {
    const platform = PORTFOLIO_PLATFORMS[platformKey as keyof typeof PORTFOLIO_PLATFORMS]
    if (platform) {
      // Pre-fill with the platform's typical URL pattern
      setInputUrl(`https://${platform.domains[0]}/`)
      setShowSuggestions(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Link2 className="h-4 w-4 text-[var(--accent-blue)]" />
            Portfolio Links
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Add up to {MAX_LINKS} links to your work (Behance, Dribbble, personal site, etc.)
          </p>
        </div>
        <span className="text-xs text-muted-foreground">
          {links.length}/{MAX_LINKS}
        </span>
      </div>

      {/* Current Links */}
      <AnimatePresence mode="popLayout">
        {links.map((link) => {
          const { name, icon } = getPlatformInfo(link.platform)
          return (
            <motion.div
              key={link.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="group relative"
            >
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border hover:border-[var(--accent-blue)]/30 transition-colors">
                <span className="text-xl" role="img" aria-label={name}>
                  {icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{name}</p>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:text-[var(--accent-blue)] truncate block transition-colors"
                  >
                    {link.url}
                  </a>
                </div>
                <div className="flex items-center gap-1">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    aria-label="Open link"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <button
                    onClick={() => onRemove(link.id)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    aria-label="Remove link"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>

      {/* Add Link Input */}
      {links.length < MAX_LINKS && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                type="url"
                value={inputUrl}
                onChange={(e) => {
                  setInputUrl(e.target.value)
                  setInputError('')
                }}
                onKeyDown={handleKeyDown}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="https://behance.net/yourportfolio"
                className={`h-11 ${inputError ? 'border-red-500' : ''}`}
              />

              {/* Platform Detection Preview */}
              {inputUrl && validateUrl(inputUrl.includes('://') ? inputUrl : 'https://' + inputUrl) && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                  {(() => {
                    const url = inputUrl.includes('://') ? inputUrl : 'https://' + inputUrl
                    const { platform } = detectPlatform(url)
                    const { icon, name } = getPlatformInfo(platform)
                    return (
                      <>
                        <span className="text-sm">{icon}</span>
                        <span className="text-xs text-muted-foreground hidden sm:inline">{name}</span>
                      </>
                    )
                  })()}
                </div>
              )}
            </div>
            <Button
              type="button"
              onClick={handleAddLink}
              className="h-11 px-4"
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>

          {inputError && (
            <p className="text-xs text-red-500">{inputError}</p>
          )}

          {/* Platform Suggestions */}
          {showSuggestions && !inputUrl && suggestedPlatforms.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-lg bg-muted/30 border border-border"
            >
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-2">
                <Sparkles className="h-3 w-3" />
                Suggested for your skills
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestedPlatforms.slice(0, 8).map((platformKey) => {
                  const platform = PORTFOLIO_PLATFORMS[platformKey as keyof typeof PORTFOLIO_PLATFORMS]
                  if (!platform) return null
                  return (
                    <button
                      key={platformKey}
                      type="button"
                      onClick={() => handleSuggestionClick(platformKey)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-background border border-border hover:border-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/5 transition-colors"
                    >
                      <span>{platform.icon}</span>
                      <span>{platform.name}</span>
                    </button>
                  )
                })}
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Max Links Reached */}
      {links.length >= MAX_LINKS && (
        <p className="text-xs text-muted-foreground text-center py-2">
          Maximum {MAX_LINKS} links allowed. Remove one to add another.
        </p>
      )}
    </div>
  )
}
