/**
 * Step 4: Skills & Specializations
 * Multi-select skills with category filtering
 */

'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Star } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { SKILL_CATEGORIES, type Skill } from '@/lib/expert-application/types'
import { useExpertApplicationStore } from '@/stores/expert-application-store'
import { getAnimationDuration } from '@/lib/expert-application/auto-save'

interface Step4SkillsProps {
  onValidationChange?: (isValid: boolean) => void
}

export function Step4Skills({ onValidationChange }: Step4SkillsProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const skills = useExpertApplicationStore((state) => state.skills)
  const addSkill = useExpertApplicationStore((state) => state.addSkill)
  const removeSkill = useExpertApplicationStore((state) => state.removeSkill)
  const setPrimarySkill = useExpertApplicationStore((state) => state.setPrimarySkill)
  const animDuration = getAnimationDuration(0.3)

  const isValid = skills.length >= 1 && skills.length <= 10 && skills.some(s => s.isPrimary)

  useEffect(() => {
    onValidationChange?.(isValid)
  }, [isValid, onValidationChange])

  const handleAddSkill = (skillName: string, category: string) => {
    if (skills.length >= 10) return
    if (skills.some(s => s.name === skillName)) return

    const newSkill: Skill = {
      id: `${category}-${skillName}-${Date.now()}`,
      name: skillName,
      category: category as any,
      isPrimary: skills.length === 0
    }

    addSkill(newSkill)
  }

  const filteredSkills = SKILL_CATEGORIES.flatMap(category =>
    category.skills
      .filter(skill => {
        const matchesSearch = skill.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = !selectedCategory || category.id === selectedCategory
        return matchesSearch && matchesCategory
      })
      .map(skill => ({ skill, category: category.id, icon: category.icon }))
  )

  return (
    <div className="mx-auto max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: animDuration }}
      >
        <Card className="glass-light p-6 sm:p-8">
          <h2 className="mb-2 text-2xl font-bold text-foreground">Skills & Specializations</h2>
          <p className="mb-4 text-foreground-muted">
            Select 1-10 skills that best represent your expertise.
          </p>

          {/* Top Skill Explanation */}
          <div className="mb-6 flex items-start gap-3 rounded-lg bg-[var(--accent-blue)]/10 p-4 border border-[var(--accent-blue)]/20">
            <Star className="h-5 w-5 text-[var(--accent-blue)] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Mark your Top Skill</p>
              <p className="text-sm text-foreground-muted">
                Click the star on one skill to mark it as your specialty — this helps creators choose the right expert for their work.
              </p>
            </div>
          </div>

          {/* Selected Skills */}
          {skills.length > 0 && (
            <div className="mb-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Your Skills ({skills.length}/10)</span>
                {!skills.some(s => s.isPrimary) && (
                  <span className="text-sm text-red-600">⚠ Please select a primary skill</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <AnimatePresence>
                  {skills.map(skill => (
                    <motion.div
                      key={skill.id}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Badge
                        variant="secondary"
                        className={`group flex items-center gap-2 px-3 py-2 text-sm ${
                          skill.isPrimary ? 'border-2 border-[var(--accent-blue)] bg-[var(--accent-blue)]/10' : ''
                        }`}
                      >
                        <button
                          onClick={() => setPrimarySkill(skill.id)}
                          className="transition-colors hover:text-[var(--accent-blue)]"
                          aria-label={`Mark ${skill.name} as primary skill`}
                        >
                          <Star className={`h-3 w-3 ${skill.isPrimary ? 'fill-[var(--accent-blue)] text-[var(--accent-blue)]' : ''}`} />
                        </button>
                        <span>{skill.name}</span>
                        <button
                          onClick={() => removeSkill(skill.id)}
                          className="ml-1 transition-colors hover:text-red-600"
                          aria-label={`Remove ${skill.name}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Category Filter */}
          <div className="mb-4">
            <p className="text-sm font-medium text-foreground mb-2">Filter by Category</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`rounded-full border-2 px-4 py-2 text-sm font-medium transition-all ${
                  !selectedCategory
                    ? 'border-[var(--accent-blue)] bg-[var(--accent-blue)] text-white shadow-md'
                    : 'border-border bg-background hover:border-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/5'
                }`}
              >
                All
              </button>
              {SKILL_CATEGORIES.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`rounded-full border-2 px-4 py-2 text-sm font-medium transition-all ${
                    selectedCategory === category.id
                      ? 'border-[var(--accent-blue)] bg-[var(--accent-blue)] text-white shadow-md'
                      : 'border-border bg-background hover:border-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/5'
                  }`}
                >
                  <span className="mr-1.5">{category.icon}</span>
                  {category.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
            <Input
              type="search"
              placeholder="Search skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 pl-10"
              inputMode="search"
            />
          </div>

          {/* Suggested Skills - Show top 5 from selected category */}
          {selectedCategory && !searchQuery && (
            <div className="mb-4 p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-sm font-medium text-foreground mb-3">
                Suggested {SKILL_CATEGORIES.find(c => c.id === selectedCategory)?.label} Skills
              </p>
              <div className="flex flex-wrap gap-2">
                {SKILL_CATEGORIES
                  .find(c => c.id === selectedCategory)
                  ?.skills.slice(0, 5)
                  .map(skill => {
                    const isSelected = skills.some(s => s.name === skill)
                    const canAdd = skills.length < 10
                    return (
                      <button
                        key={`suggested-${skill}`}
                        onClick={() => !isSelected && canAdd && handleAddSkill(skill, selectedCategory)}
                        disabled={isSelected || !canAdd}
                        className={`rounded-full px-3 py-1.5 text-sm transition-all ${
                          isSelected
                            ? 'bg-green-100 text-green-700 border border-green-300'
                            : canAdd
                              ? 'bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/20 border border-[var(--accent-blue)]/30'
                              : 'bg-muted text-muted-foreground cursor-not-allowed'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}{skill}
                      </button>
                    )
                  })}
              </div>
            </div>
          )}

          {/* Available Skills */}
          <div className="max-h-[350px] overflow-y-auto rounded-lg border border-border p-4">
            <div className="grid gap-2 sm:grid-cols-2">
              {filteredSkills.map(({ skill, category, icon }) => {
                const isSelected = skills.some(s => s.name === skill)
                const canAdd = skills.length < 10

                return (
                  <button
                    key={`${category}-${skill}`}
                    onClick={() => !isSelected && canAdd && handleAddSkill(skill, category)}
                    disabled={isSelected || !canAdd}
                    className={`rounded-lg border p-3 text-left text-sm transition-all ${
                      isSelected
                        ? 'cursor-not-allowed border-green-500 bg-green-50 opacity-50'
                        : canAdd
                          ? 'border-border hover:border-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/5'
                          : 'cursor-not-allowed opacity-50'
                    }`}
                  >
                    <span className="mr-2">{icon}</span>
                    {skill}
                    {isSelected && <span className="ml-2 text-green-600">✓</span>}
                  </button>
                )
              })}
            </div>
          </div>

          <p className="mt-4 text-sm text-foreground-muted">
            Your top skill will be prominently displayed on your reviewer profile.
          </p>
        </Card>
      </motion.div>
    </div>
  )
}
