import React from 'react';
import { motion } from 'framer-motion';

interface ConnectionLink {
  id: string;
  label: string;
  url: string;
  icon: string;
  description: string;
  color: string;
}

const CONNECTION_LINKS: ConnectionLink[] = [
  {
    id: 'professor',
    label: '교수상담',
    url: '#professor-counseling', // Placeholder - 학교측에서 실제 URL 제공 필요
    icon: '👨‍🏫',
    description: '학과 교수님과 진로 상담',
    color: 'from-blue-500 to-blue-600'
  },
  {
    id: 'career',
    label: '취업상담',
    url: '#career-counseling', // Placeholder
    icon: '💼',
    description: '대학일자리플러스센터 취업 상담',
    color: 'from-green-500 to-green-600'
  },
  {
    id: 'learning',
    label: '학습상담',
    url: '#learning-counseling', // Placeholder
    icon: '📚',
    description: '교수학습지원센터 학습 상담',
    color: 'from-purple-500 to-purple-600'
  }
];

interface ConnectionLinksProps {
  variant?: 'horizontal' | 'vertical' | 'compact';
  showAll?: boolean;
  filterIds?: string[];
  className?: string;
}

export default function ConnectionLinks({
  variant = 'horizontal',
  showAll = true,
  filterIds,
  className = ''
}: ConnectionLinksProps) {
  const links = showAll
    ? CONNECTION_LINKS
    : CONNECTION_LINKS.filter(link => filterIds?.includes(link.id));

  if (variant === 'compact') {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {links.map((link) => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-2 md:py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition min-h-[44px]"
          >
            <span>{link.icon}</span>
            <span>{link.label}</span>
          </a>
        ))}
      </div>
    );
  }

  if (variant === 'vertical') {
    return (
      <div className={`space-y-3 ${className}`}>
        {links.map((link) => (
          <motion.a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="block p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${link.color} flex items-center justify-center text-white text-lg`}>
                {link.icon}
              </div>
              <div>
                <p className="font-medium text-gray-800">{link.label}</p>
                <p className="text-sm text-gray-500">{link.description}</p>
              </div>
            </div>
          </motion.a>
        ))}
      </div>
    );
  }

  // horizontal (default) - glassmorphism style
  const glassColors: Record<string, { bg: string; text: string; border: string }> = {
    'from-blue-500 to-blue-600': { bg: 'bg-blue-500/15 hover:bg-blue-500/25', text: 'text-blue-700', border: 'border-blue-300/40' },
    'from-green-500 to-green-600': { bg: 'bg-green-500/15 hover:bg-green-500/25', text: 'text-green-700', border: 'border-green-300/40' },
    'from-purple-500 to-purple-600': { bg: 'bg-purple-500/15 hover:bg-purple-500/25', text: 'text-purple-700', border: 'border-purple-300/40' }
  };

  return (
    <div className={`flex flex-wrap gap-2 md:gap-3 ${className}`}>
      {links.map((link) => {
        const colors = glassColors[link.color] || { bg: 'bg-gray-500/15 hover:bg-gray-500/25', text: 'text-gray-700', border: 'border-gray-300/40' };
        return (
          <motion.a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={`flex items-center gap-2 px-4 py-3 md:py-2 ${colors.bg} ${colors.text} backdrop-blur-md border ${colors.border} rounded-xl shadow-sm hover:shadow-md transition min-h-[44px]`}
          >
            <span className="text-lg">{link.icon}</span>
            <span className="font-medium text-sm md:text-base">{link.label}</span>
          </motion.a>
        );
      })}
    </div>
  );
}

export { CONNECTION_LINKS };
