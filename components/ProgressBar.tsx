'use client'

import { motion } from 'framer-motion'

interface ProgressBarProps {
  progress: number // 0-100
  label?: string
  showPercentage?: boolean
  size?: 'sm' | 'md' | 'lg'
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red'
  animated?: boolean
  delay?: number
}

export default function ProgressBar({
  progress,
  label,
  showPercentage = true,
  size = 'md',
  color = 'blue',
  animated = true,
  delay = 0
}: ProgressBarProps) {
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  }

  const colorClasses = {
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500',
    purple: 'from-purple-500 to-violet-500',
    orange: 'from-orange-500 to-yellow-500',
    red: 'from-red-500 to-pink-500'
  }

  const glowColors = {
    blue: 'shadow-blue-500/25',
    green: 'shadow-green-500/25',
    purple: 'shadow-purple-500/25',
    orange: 'shadow-orange-500/25',
    red: 'shadow-red-500/25'
  }

  const clampedProgress = Math.min(Math.max(progress, 0), 100)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1, duration: 0.5 }}
      className="w-full"
    >
      {/* Label and Percentage */}
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {label && (
            <span className="text-sm font-medium text-white/80">
              {label}
            </span>
          )}
          {showPercentage && (
            <motion.span
              className="text-sm font-bold text-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: delay * 0.1 + 0.3 }}
            >
              {Math.round(clampedProgress)}%
            </motion.span>
          )}
        </div>
      )}

      {/* Progress Bar Container */}
      <div className={`
        relative w-full ${sizeClasses[size]} 
        bg-white/10 rounded-full overflow-hidden
        backdrop-blur-sm border border-white/20
      `}>
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-white/10 rounded-full" />
        
        {/* Progress Fill */}
        <motion.div
          className={`
            h-full bg-gradient-to-r ${colorClasses[color]} 
            rounded-full relative overflow-hidden
            ${glowColors[color]} shadow-lg
          `}
          initial={{ width: 0 }}
          animate={{ width: animated ? `${clampedProgress}%` : `${clampedProgress}%` }}
          transition={{
            duration: animated ? 1.5 : 0,
            delay: delay * 0.1 + 0.2,
            ease: "easeOut"
          }}
        >
          {/* Shimmer effect */}
          {animated && clampedProgress > 0 && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3,
                ease: "easeInOut"
              }}
            />
          )}
          
          {/* Inner glow */}
          <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent rounded-full" />
        </motion.div>

        {/* Completion sparkle effect */}
        {clampedProgress >= 100 && animated && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0] }}
            transition={{
              duration: 0.6,
              delay: delay * 0.1 + 1.7,
              ease: "easeOut"
            }}
          >
            <div className="w-2 h-2 bg-white rounded-full shadow-lg" />
          </motion.div>
        )}
      </div>

      {/* Progress milestones (optional dots) */}
      {size === 'lg' && (
        <div className="absolute top-0 left-0 w-full h-full flex items-center">
          {[25, 50, 75].map((milestone) => (
            <div
              key={milestone}
              className="absolute w-1 h-1 bg-white/40 rounded-full"
              style={{ left: `${milestone}%`, transform: 'translateX(-50%)' }}
            />
          ))}
        </div>
      )}
    </motion.div>
  )
} 