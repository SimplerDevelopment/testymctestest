import type { Metadata } from 'next';
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
      <body className="bg-white text-gray-900 antialiased">
        <EditorModeProvider>
          {children}
        </EditorModeProvider>
      </body>
    </html>
  );
}
