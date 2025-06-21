'use client'

import { motion } from 'framer-motion'
import { Star, Zap, CheckCircle, Trophy, BookOpen } from 'lucide-react'

interface LearningStatusBadgeProps {
  status: 'new' | 'learning' | 'learned' | 'mastered'
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  showTooltip?: boolean
  animated?: boolean
}

export default function LearningStatusBadge({
  status,
  size = 'md',
  showIcon = true,
  showTooltip = true,
  animated = true
}: LearningStatusBadgeProps) {
  
  const statusConfig = {
    new: {
      label: 'Новое',
      description: 'Слово еще не изучалось',
      icon: BookOpen,
      gradient: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-400/30',
      textColor: 'text-blue-300'
    },
    learning: {
      label: 'Изучается',
      description: 'Слово находится в процессе изучения',
      icon: Zap,
      gradient: 'from-yellow-500 to-orange-500',
      bgColor: 'bg-yellow-500/20',
      borderColor: 'border-yellow-400/30',
      textColor: 'text-yellow-300'
    },
    learned: {
      label: 'Изучено',
      description: 'Слово успешно изучено',
      icon: CheckCircle,
      gradient: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/20',
      borderColor: 'border-green-400/30',
      textColor: 'text-green-300'
    },
    mastered: {
      label: 'Освоено',
      description: 'Слово полностью освоено',
      icon: Trophy,
      gradient: 'from-purple-500 to-violet-500',
      bgColor: 'bg-purple-500/20',
      borderColor: 'border-purple-400/30',
      textColor: 'text-purple-300'
    }
  }

  const sizeConfig = {
    sm: {
      padding: 'px-2 py-1',
      text: 'text-xs',
      icon: 'w-3 h-3'
    },
    md: {
      padding: 'px-3 py-1.5',
      text: 'text-sm',
      icon: 'w-4 h-4'
    },
    lg: {
      padding: 'px-4 py-2',
      text: 'text-base',
      icon: 'w-5 h-5'
    }
  }

  const config = statusConfig[status]
  const sizeStyles = sizeConfig[size]
  const Icon = config.icon

  return (
    <div className="relative group">
      <motion.div
        initial={animated ? { opacity: 0, scale: 0.8 } : false}
        animate={animated ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.3, ease: "easeOut" }}
        whileHover={{ scale: 1.05 }}
        className={`
          inline-flex items-center gap-1.5 rounded-full
          ${sizeStyles.padding} ${sizeStyles.text}
          ${config.bgColor} ${config.borderColor} ${config.textColor}
          border backdrop-blur-sm font-semibold
          transition-all duration-200
        `}
      >
        {/* Icon */}
        {showIcon && (
          <motion.div
            initial={animated ? { rotate: -180, opacity: 0 } : false}
            animate={animated ? { rotate: 0, opacity: 1 } : {}}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Icon className={sizeStyles.icon} />
          </motion.div>
        )}

        {/* Label */}
        <span>{config.label}</span>

        {/* Glow effect */}
        <motion.div
          className={`absolute inset-0 bg-gradient-to-r ${config.gradient} opacity-0 rounded-full blur-sm`}
          whileHover={{ opacity: 0.2 }}
          transition={{ duration: 0.3 }}
        />
      </motion.div>

      {/* Tooltip */}
      {showTooltip && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          whileHover={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900/95 text-white text-xs rounded-lg shadow-lg backdrop-blur-sm border border-white/10 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50"
        >
          {config.description}
          
          {/* Tooltip arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900/95" />
        </motion.div>
      )}

      {/* Mastered celebration effect */}
      {status === 'mastered' && animated && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            repeatDelay: 5,
            ease: "easeInOut" 
          }}
        >
          {/* Sparkle particles */}
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-purple-400 rounded-full"
              initial={{ 
                x: '50%', 
                y: '50%', 
                scale: 0 
              }}
              animate={{ 
                x: `${50 + (i - 1) * 30}%`, 
                y: `${20 + i * 20}%`, 
                scale: [0, 1, 0] 
              }}
              transition={{ 
                duration: 1.5, 
                delay: i * 0.2,
                repeat: Infinity,
                repeatDelay: 5
              }}
            />
          ))}
        </motion.div>
      )}
    </div>
  )
} 