import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js'
import Select from 'react-select';

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
  const handleChange = selectedOption => {
    setPage(selectedOption.value - 1);
    window.scrollTo(0, 0);
  };

  const options = Array.from({ length: totalPages }, (_, i) => ({ value: i + 1, label: i + 1 }));

  return (
    <div className="flex justify-center mt-6 mb-4">
      <button
        onClick={() => setPage(page - 1)}
        disabled={page === 0}
        className="px-1 py-2 mx-1 bg-indigo-500 text-white rounded disabled:opacity-50"
      >
        <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13.25 8.75L9.75 12L13.25 15.25"></path>
        </svg>
      </button>

      <div className="px-2 mx-1">
        <Select
          value={{ value: page + 1, label: page + 1 }}
          onChange={handleChange}
          options={options}
          isSearchable={false}
          className="my-1 rounded text-black"
          menuPlacement="auto"
        />
      </div>

      <button
        onClick={() => setPage(page + 1)}
        disabled={page === totalPages - 1}
        className="px-1 py-2 mx-1 bg-indigo-500 text-white rounded disabled:opacity-50"
      >
        <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.75 8.75L14.25 12L10.75 15.25"></path>
        </svg>
      </button>
    </div>
  )
}

function getSessionPage() {
  if (typeof window !== 'undefined') {
    const cachedPage = sessionStorage.getItem("currentPage");
    return cachedPage ? parseInt(cachedPage) : 0;
  } else {
    return 0;
  }
}

export default function Home() {
  const [blogPostsList, setBlogPostsList] = useState([]);
  const [page, setPage] = useState(getSessionPage());
  const [totalPages, setTotalPages] = useState(0);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // Fetching
  const fetchPosts = async (pageNumber) => {
    // Check if posts are already stored in cache
    const cachedPosts = sessionStorage.getItem(`posts-${pageNumber}`);
    const cachedTotalPages = sessionStorage.getItem('totalPages');
  
    if (cachedPosts && cachedTotalPages) {
      setBlogPostsList(JSON.parse(cachedPosts));
      setTotalPages(parseInt(cachedTotalPages));
      setDataLoaded(true);
    } else {
      let { count, data: posts, error } = await supabase
        .from('posts')
        .select("*", { count: "exact" })
        .order('published_at', { ascending: false })
        .range(pageNumber * POSTS_PER_PAGE, (pageNumber + 1) * POSTS_PER_PAGE - 1);
  
      if (error) {
        console.error("Error fetching posts:", error);
      } else {
        setBlogPostsList(posts);
  
        const totalPages = Math.ceil(count / POSTS_PER_PAGE);
        setTotalPages(totalPages);
        setDataLoaded(true);
  
        // Store posts and totalPages in cache
        sessionStorage.setItem(`posts-${pageNumber}`, JSON.stringify(posts));
        sessionStorage.setItem('totalPages', totalPages.toString());
      }
    }
  };

  useEffect(() => {
    fetchPosts(page);
    sessionStorage.setItem("currentPage", page);
  }, [page]);

  // Prefetching
  const prefetchPosts = async (pageNumber) => {
    const cachedPosts = sessionStorage.getItem(`posts-${pageNumber}`);
    
    // If we have the data in the cache, no need to prefetch
    if (cachedPosts) return;
    
    let { count, data: posts, error } = await supabase
      .from('posts')
      .select("*", { count: "exact" })
      .order('published_at', { ascending: false })
      .range(pageNumber * POSTS_PER_PAGE, (pageNumber + 1) * POSTS_PER_PAGE - 1);
  
    if (error) {
      console.error("Error prefetching posts:", error);
    } else {
      // Store posts in cache
      sessionStorage.setItem(`posts-${pageNumber}`, JSON.stringify(posts));
    }
  };

  useEffect(() => {
    const nextPage = page + 1;
    if (nextPage < totalPages) {
      prefetchPosts(nextPage);
    }
  
    const prevPage = page - 1;
    if (prevPage >= 0) {
      prefetchPosts(prevPage);
    }
  }, [page, totalPages]);

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
      {dataLoaded && <Pagination page={page} totalPages={totalPages} setPage={setPage} />}
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
      {dataLoaded && <Pagination page={page} totalPages={totalPages} setPage={setPage} />}

      {/* Loading */}
      {!dataLoaded && (
          <div className="flex justify-center mt-8">
            <svg className="animate-spin h-8 w-8 text-indigo-500" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
          </div>
        )
      }

      {/* Footer */}
      {dataLoaded && 
        <div className="text-center mt-8">
          built by <a className="text-indigo-500" href="https://www.ishanshah.me/" target="_blank">ishan</a>.
          summaries by <a className="text-indigo-500" href="https://platform.openai.com/docs/models/gpt-3-5" target="_blank">gpt-3.5</a>.
        </div>
      }
    </div>
  )
}
