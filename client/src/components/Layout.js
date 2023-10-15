import Link from "next/link";

export default function Layout({ children }) {
  return (
    <div className="font-berkeley m-8 md:m-10 pb-20">
      {/* Navbar */}
      <div className="mb-12">
        <div className="absolute top-0 left-0 md:top-4 md:left-4">
          <a href="https://github.com/ishan0102/engblogs" target="_blank" rel="noopener noreferrer">
            <button className="block text-sm font-apple2mono focus:outline-none relative transform transition-transform md:duration-200 md:hover:scale-105 p-2">
              <span className="inline-block py-1 px-2 rounded-lg">
                github
              </span>
            </button>
          </a>
        </div>
        <div className="absolute top-0 right-0 md:top-4 md:right-4">
          <a href="https://donate.stripe.com/9AQ4hH7TO2PrfsY4gg" target="_blank" rel="noopener noreferrer">
            <button className="block text-white text-sm font-apple2mono focus:outline-none relative transform transition-transform md:duration-200 md:hover:scale-105 p-2">
              <span className="inline-block py-1 px-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 shadow-md transition-all duration-300 ease-in-out hover:from-orange-500 hover:to-red-800">
                donate!
              </span>
            </button>
          </a>
        </div>

        {/* Header */}
        <div className="flex text-center flex-col mb-4">
          <Link className="font-bold text-4xl mb-2" href="/">
            engblogs
          </Link>
          <div className="text-md">learn from your favorite tech companies</div>
        </div>

        {children}

        {/* Footer */}
        <div className="mt-8">
          <div className="text-center">
            built by <a className="text-indigo-500" href="https://www.ishanshah.me/" target="_blank">ishan</a>.
            summaries by <a className="text-indigo-500" href="https://platform.openai.com/docs/models/gpt-3-5" target="_blank">gpt-3.5</a>.

          </div>
          <div className="text-center">
            read our <Link href="/privacy" className="text-indigo-500">privacy policy</Link> and contact our <Link href="/support" className="text-indigo-500">support</Link> page.
          </div>
        </div>
      </div>
    </div>
  )
}