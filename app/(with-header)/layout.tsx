import Link from 'next/link';

export default function WithHeaderLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
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
      {children}
    </>
  );
}
