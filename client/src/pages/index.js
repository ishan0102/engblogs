import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const POSTS_PER_PAGE = 12;

function BlogPost({ title, published_at, link, summary, company }) {
  return (
    <Link href={link} rel="noopener noreferrer" target="_blank"
      className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden md:max-w-2xl m-3 border border-gray-200 hover:border-indigo-500 transition"
    >
      <div className="md:flex">
        <div className="p-8">
          <div className="flex justify-between items-center">
            <div className="tracking-wide text-sm text-indigo-500 font-semibold">{company}</div>
            <div className="uppercase tracking-wide text-sm">{published_at}</div>
          </div>
          <div className="block mt-1 text-lg leading-tight font-medium">
            {title}
          </div>
          <p className="mt-2 text-gray-500">
            {summary}
            {summary.slice(-1) !== "." && "."}
          </p>
        </div>
      </div>
    </Link>
  )
}

function Pagination({ page, totalPages, setPage }) {
  const handleChange = (event) => {
    setPage(parseInt(event.target.value) - 1);
  }

  return (
    <div className="flex justify-center mt-6 mb-4">
      <button
        onClick={() => setPage(page - 1)}
        disabled={page === 0}
        className="px-3 py-2 mx-1 bg-indigo-500 text-white rounded disabled:opacity-50"
      >
        &lt;
      </button>

      <div className="mx-2 inline-flex">
        <select
          value={page + 1}
          onChange={handleChange}
          className="px-4 border border-indigo-500 text-indigo-500 rounded"
        >
          {Array.from({ length: totalPages }, (_, i) => (
            <option key={i} value={i + 1}>
              {i + 1}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
          </svg>
        </div>
      </div>

      <button
        onClick={() => setPage(page + 1)}
        disabled={page === totalPages - 1}
        className="px-3 py-2 mx-1 bg-indigo-500 text-white rounded disabled:opacity-50"
      >
        &gt;
      </button>
    </div>
  )
}


export default function Home() {
  const [blogPostsList, setBlogPostsList] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchPosts = async (pageNumber) => {
    // Check if posts are already stored in cache
    const cachedPosts = sessionStorage.getItem(`posts-${pageNumber}`);
    const cachedTotalPages = sessionStorage.getItem('totalPages');

    if (cachedPosts && cachedTotalPages) {
      setBlogPostsList(JSON.parse(cachedPosts));
      setTotalPages(parseInt(cachedTotalPages));
      return;
    }

    let { count, data: posts, error } = await supabase
      .from('posts')
      .select("*", { count: "exact" })
      .order('published_at', { ascending: false })
      .range(pageNumber * POSTS_PER_PAGE, (pageNumber + 1) * POSTS_PER_PAGE - 1);

    if (error) console.error("Error fetching posts:", error);
    else {
      setBlogPostsList(posts);

      const totalPages = Math.ceil(count / POSTS_PER_PAGE);
      setTotalPages(totalPages);

      // Store posts and totalPages in cache
      sessionStorage.setItem(`posts-${pageNumber}`, JSON.stringify(posts));
      sessionStorage.setItem('totalPages', totalPages.toString());
    }
  }

  useEffect(() => {
    fetchPosts(page);
  }, [page]);

  return (
    <div className="font-berkeley m-8 md:m-10 pb-20">
      {/* Header */}
      <div className="flex text-center flex-col mb-4">
        <div className="font-bold text-4xl mb-2">engblogs</div>
        <div className="text-md">learn from your favorite tech companies</div>
      </div>
      <div className="absolute top-0 right-0 md:top-4 md:right-4">
        <a href="https://github.com/ishan0102/engblogs" target="_blank" rel="noopener noreferrer">
          <button className="max-w-md mx-auto bg-white rounded-lg text-sm border border-white hover:border-black transition p-2">
            github
          </button>
        </a>
      </div>

      {/* Content */}
      <Pagination page={page} totalPages={totalPages} setPage={setPage} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {blogPostsList.map((post, index) => (
          <BlogPost
            key={post.id}
            title={post.title}
            published_at={post.published_at}
            link={post.link}
            description={post.description}
            summary={post.summary}
            company={post.company}
          />
        ))}
      </div>
      <Pagination page={page} totalPages={totalPages} setPage={setPage} />
      <div className="text-center mt-8">
        built by <a className="text-indigo-500" href="https://www.ishanshah.me/" target="_blank">ishan</a>.
        summaries by <a className="text-indigo-500" href="https://platform.openai.com/docs/models/gpt-3-5" target="_blank">gpt-3.5</a>.
      </div>
    </div>
  )
}
