import React from 'react';
import { motion } from 'framer-motion';
import indiaFlag from '@/assets/india-flag.jpg';
import indiaBg from '@/assets/india-bg-pattern.jpg';

interface IndiaFlagSectionProps {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
}

const IndiaFlagSection: React.FC<IndiaFlagSectionProps> = ({
  title,
  subtitle,
  children,
  className = ""
}) => {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Animated Background */}
      <div className="absolute inset-0">
        {/* Base gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-green-50" />
        
        {/* Animated pattern overlay */}
        <motion.div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url(${indiaBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
        />
        
        {/* Floating particles */}
        <div className="absolute inset-0">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                background: i % 3 === 0 ? '#FF7722' : i % 3 === 1 ? '#FFFFFF' : '#138808',
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [-20, 20],
                x: [-10, 10],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: 3 + Math.random() * 4,
                repeat: Infinity,
                repeatType: 'reverse',
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 p-8">
        {/* Flag Image */}
        <motion.div
          className="flex justify-center mb-6"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div className="relative">
            <motion.img
              src={indiaFlag}
              alt="Indian National Flag"
              className="w-32 h-21 object-cover rounded-lg shadow-2xl border-2 border-white/50"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            />
            
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-orange-400 via-white to-green-400 rounded-lg blur opacity-30 animate-pulse" />
          </div>
        </motion.div>

        {/* Title and subtitle */}
        {title && (
          <motion.h2
            className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-orange-600 via-slate-700 to-green-600 bg-clip-text text-transparent"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            {title}
          </motion.h2>
        )}

        {subtitle && (
          <motion.p
            className="text-lg text-center text-slate-600 mb-6"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            {subtitle}
          </motion.p>
        )}

        {/* Children content */}
        {children && (
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
          >
            {children}
          </motion.div>
        )}
      </div>

      {/* Decorative border elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-white to-green-500" />
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-white to-green-500" />
    </div>
  );
};

export default IndiaFlagSection;