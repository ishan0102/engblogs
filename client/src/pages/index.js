import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

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
  return (
    <div className="flex justify-center mt-6 mb-4">
      <button
        onClick={() => setPage(page - 1)}
        disabled={page === 0}
        className="px-3 py-2 mx-1 bg-indigo-500 text-white rounded disabled:opacity-50"
      >
        &lt;
      </button>

      <div className="px-4 py-2 mx-1 border border-indigo-500 text-indigo-500 rounded">
        {page + 1}
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

function Filter({ onFilterChange }) {
  const handleFilterChange = (event) => {
    const filterValue = event.target.value;
    console.log(filterValue);
    onFilterChange(filterValue);
  };

  return (
    <div className="mt-4 mb-6 text-center">
      <label htmlFor="filter" className="mr-2 font-medium">
        Filter posts by:
      </label>
      <select
        id="filter"
        className="border border-gray-300 rounded px-2 py-1"
        onChange={handleFilterChange}
      >
        <option value="">All</option>
        <option value="Company 10">Company 10</option>
        <option value="Company 20">Company 20</option>
        {/* Add more options based on your requirements */}
      </select>
    </div>
  );
}

export default function Home() {
  const [blogPostsList, setBlogPostsList] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filter, setFilter] = useState('');

  const handleFilterChange = (filterValue) => {
    console.log("should trigger useEffect... again by resetting page to zero...");
    console.log("Filter value:", filterValue);

    setFilter(filterValue);
    setPage(0); // Reset page when filter changes to display results from the first page
  };

  const fetchPosts = async (pageNumber) => {
    // Check if posts are already stored in cache
    console.log("Triggering databse call...")
    console.log("Filtering with:", filter);
    const cachedPosts = sessionStorage.getItem(`posts-${pageNumber}`);

    if (cachedPosts) {
      setBlogPostsList(JSON.parse(cachedPosts));
      return;
    }

    let  query = supabase
      .from('posts')
      .select("*", { count: "exact" })
      .order('published_at', { ascending: false })
      .range(pageNumber * POSTS_PER_PAGE, (pageNumber + 1) * POSTS_PER_PAGE - 1);

    // Apply filter if a filter value is selected
    if (filter) {
      console.log("Inside company filtering-", filter);
      query = query.eq('company', filter);
    }

    const { count, data: posts, error } = await query;

    if (error) console.error("Error fetching posts:", error);
    else {
      setBlogPostsList(posts);
      setTotalPages(Math.ceil(count / POSTS_PER_PAGE));

      // Store posts in cache
      // sessionStorage.setItem(`posts-${pageNumber}`, JSON.stringify(posts));
    }
  }

  useEffect(() => {
    fetchPosts(page);
    console.log("I fire only once...")
  }, [page, filter]);

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

      {/* Filter */}
      <Filter onFilterChange={handleFilterChange} />

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
