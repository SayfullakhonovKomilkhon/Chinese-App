'use client'

import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  gradient: string
  loading?: boolean
  delay?: number
  onClick?: () => void
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  gradient,
  loading = false,
  delay = 0,
  onClick
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.5, 
        delay: delay * 0.1,
        ease: "easeOut" 
      }}
      whileHover={{ 
        scale: onClick ? 1.02 : 1.01, 
        y: -2,
        boxShadow: "0 20px 40px rgba(0,0,0,0.15)" 
      }}
      className={`
        relative overflow-hidden rounded-2xl border border-white/20 
        backdrop-blur-xl shadow-2xl p-6
        ${onClick ? 'cursor-pointer' : ''}
        bg-white/10
      `}
      onClick={onClick}
    >
      {/* Background gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-10`} />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Icon and Title Row */}
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          
          {loading && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
            />
          )}
        </div>

        {/* Value */}
        <div className="mb-2">
          {loading ? (
            <div className="h-8 bg-white/20 rounded-lg animate-pulse" />
          ) : (
            <motion.h3 
              className="text-3xl font-bold text-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: delay * 0.1 + 0.2 }}
            >
              {value}
            </motion.h3>
          )}
        </div>

        {/* Title */}
        <p className="text-white/80 font-medium text-sm mb-1">
          {title}
        </p>

        {/* Subtitle */}
        {subtitle && (
          <p className="text-white/60 text-xs">
            {subtitle}
          </p>
        )}

        {/* Hover glow effect */}
        <motion.div
          className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 rounded-2xl`}
          whileHover={{ opacity: 0.05 }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Border glow effect */}
      <motion.div
        className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${gradient} opacity-0`}
        whileHover={{ opacity: 0.1 }}
        transition={{ duration: 0.3 }}
        style={{
          background: `linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)`,
        }}
      />
    </motion.div>
  )
} 