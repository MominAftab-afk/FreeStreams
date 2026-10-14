import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
        <li className="flex items-center gap-1.5">
          <Link
            href="/"
            className="flex items-center gap-1 hover:text-white transition-colors"
            title="Return to MateFlix Home"
          >
            <Home className="w-3.5 h-3.5 text-[#FF1E56]" />
            <span>Home</span>
          </Link>
        </li>

        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={item.url} className="flex items-center gap-1.5">
              <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              {isLast ? (
                <span
                  aria-current="page"
                  className="font-semibold text-[#FF85A1] max-w-[200px] sm:max-w-md truncate"
                >
                  {item.name}
                </span>
              ) : (
                <Link
                  href={item.url}
                  className="hover:text-white transition-colors"
                >
                  {item.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
