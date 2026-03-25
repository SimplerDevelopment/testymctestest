'use client';

import Link from 'next/link';

interface CardProps {
  title: string;
  description: string;
  image?: string;
  icon?: string;
  link?: string;
  className?: string;
}

export function Card({ title, description, image, icon, link, className = '' }: CardProps) {
  const content = (
    <div className={`group relative h-full rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 ${className}`}>
      {image && (
        <div className="mb-4 overflow-hidden rounded-lg">
          <img src={image} alt={title} className="w-full h-48 object-cover transition-transform group-hover:scale-105" />
        </div>
      )}
      {icon && <span className="text-4xl mb-4 block">{icon}</span>}
      <h3 className="text-xl font-bold mb-2 group-hover:text-blue-600 transition-colors">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      {link && (
        <div className="flex items-center text-blue-600 font-medium">
          Learn more
          <svg className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </div>
  );

  if (link) return <Link href={link}>{content}</Link>;
  return content;
}
