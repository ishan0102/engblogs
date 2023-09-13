import Link from 'next/link';

export default function BlogPost({ title, published_at, link, summary, company, upvotes }) {
  return (
    <div className="relative max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden md:max-w-2xl m-1 border border-gray-200 hover:border-indigo-500 transition">
      <Link href={link} rel="noopener noreferrer" target="_blank">
        <div className="md:flex mb-10">
          <div className="p-8">
            <div className="flex justify-between items-center">
              <div className="tracking-wide text-sm text-indigo-500 font-semibold">{company}</div>
              <div className="uppercase tracking-wide text-sm">{published_at}</div>
            </div>
            <div className="block mt-1 text-lg leading-tight font-medium">
              {title}
            </div>
            <p className="mt-2 text-gray-500">
              {summary + (".!?".includes(summary.slice(-1)) ? "" : ".")}
            </p>
          </div>
        </div>
      </Link>
      <div className="absolute bottom-6 right-6 flex items-center">
        <span className="text-gray-500 text-sm mr-2">{upvotes ? upvotes : 0}</span>
        <button onClick={() => { /* update upvote count in the database */ }} className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-1 px-2 rounded">
          upvote
        </button>
      </div>
    </div>
  )
}
