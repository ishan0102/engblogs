import Link from "next/link";
import { usePathname } from 'next/navigation'

export default function Layout({ children }) {
  const isindex = usePathname() === "/";
  return (
    <div className="font-berkeley m-8 md:m-10 pb-20">
      {/* Navbar */}
      <header className={`fixed top-0 left-0 px-4 py-5 z-20 w-full ${isindex ? 'h-52 md:h-36' : 'h-36'} bg-white shadow`}>
        <div className="flex h-14 justify-between">
          <div className="flex-none w-30">
            <a href="https://github.com/ishan0102/engblogs" target="_blank" rel="noopener noreferrer">
              <button className="block text-sm font-apple2mono focus:outline-none relative transform transition-transform md:duration-200 md:hover:scale-105 p-2">
                <span className="inline-block py-1 px-2 rounded-lg">
                  github
                </span>
              </button>
            </a>
          </div>

          {/* Header */}
          <div className="grow">
            <div className="text-center mb-4">
              <Link className="font-bold text-4xl mb-2" href="/">
                engblogs
              </Link>
              <div className="w-full">learn from your favorite tech companies</div>
            </div>
          </div>

          <div className="flex-none w-30">
            <a href="https://donate.stripe.com/9AQ4hH7TO2PrfsY4gg" target="_blank" rel="noopener noreferrer">
              <button className="block text-white text-sm font-apple2mono focus:outline-none relative transform transition-transform md:duration-200 md:hover:scale-105 p-2">
                <span className="inline-block py-1 px-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 shadow-md transition-all duration-300 ease-in-out hover:from-orange-500 hover:to-red-800">
                  donate!
                </span>
              </button>
            </a>
          </div>
        </div>
      </header>

      <main className="pt-16">
        {children}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 z-20 w-full p-4 bg-white border-t border-gray-200 shadow">
        <div className="text-center">
          built by <a className="text-indigo-500" href="https://www.ishanshah.me/" target="_blank">ishan</a>.
          summaries by <a className="text-indigo-500" href="https://platform.openai.com/docs/models/gpt-3-5" target="_blank">gpt-3.5</a>.

        </div>
        <div className="text-center">
          read our <Link href="/privacy" className="text-indigo-500">privacy policy</Link> and view our <Link href="/support" className="text-indigo-500">support</Link> page.
        </div>
      </footer>
    </div>
  )
}