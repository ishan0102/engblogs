import Link from 'next/link';
import Upvote from './Upvote';

export default function BlogPost({
  post_id,
  title,
  published_at,
  link,
  summary,
  company,
  buzzwords,
  supabase,
  ip,
}) {
  return (
    <Link href={link} legacyBehavior passHref>
      <a target="_blank" rel="noopener noreferrer" className="block relative max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden md:max-w-2xl m-1 border border-gray-200 hover:border-indigo-500 transition">
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
        <div className="flex justify-between items-center px-8 pb-4"> {/* Added container for buzzwords and upvotes */}
          <div className="grid grid-flow-col gap-2"> {/* Buzzwords grid */}
            {buzzwords.map((buzzword, idx) => (
              <span key={idx} className="tracking-wide text-sm text-indigo-500 font-semibold">
                {buzzword}
              </span>
            ))}
          </div>
          <Upvote postId={post_id} supabase={supabase} userIP={ip} />
        </div>
      </a>
    </Link>
  );
}
