import type { Metadata } from 'next';
import Link from 'next/link';
import { EditorModeProvider } from '@/components/visual-editor/EditorModeProvider';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'My Website',
    template: '%s | My Website',
  },
  description: 'Built with Next.js',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900 antialiased flex flex-col min-h-screen">
        <EditorModeProvider>
          <header className="border-b border-gray-100">
            <nav className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
              <Link href="/" className="font-bold text-lg">
                My Website
              </Link>
              <div className="flex gap-6 text-sm">
                <Link href="/" className="text-gray-600 hover:text-gray-900">
                  Home
                </Link>
                <Link href="/blog" className="text-gray-600 hover:text-gray-900">
                  Blog
                </Link>
              </div>
            </nav>
          </header>

          <main className="flex-1">{children}</main>

          <footer className="border-t border-gray-100 mt-auto">
            <div className="mx-auto max-w-4xl px-6 py-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-gray-500">
                  &copy; {new Date().getFullYear()} My Website. All rights reserved.
                </p>
                <div className="flex gap-6 text-sm">
                  <Link href="/" className="text-gray-500 hover:text-gray-700">
                    Home
                  </Link>
                  <Link href="/blog" className="text-gray-500 hover:text-gray-700">
                    Blog
                  </Link>
                </div>
              </div>
            </div>
          </footer>
        </EditorModeProvider>
      </body>
    </html>
  );
}
