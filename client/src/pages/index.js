import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

import BlogPost from '../components/BlogPost';
import Pagination from '../components/Pagination';
import Filter from '../components/Filter';
import Search from '../components/Search';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const POSTS_PER_PAGE = 12;

function getSessionPage() {
  if (typeof window !== 'undefined') {
    const cachedPage = sessionStorage.getItem("currentPage");
    return cachedPage ? parseInt(cachedPage) : 0;
  } else {
    return 0;
  }
}

export async function getServerSideProps(context) {
  let ip;
  const { req } = context;

  if (req.headers['x-forwarded-for']) {
    ip = req.headers['x-forwarded-for'].split(',')[0];
  } else if (req.headers['x-real-ip']) {
    ip = req.connection.remoteAddress;
  } else {
    ip = req.connection.remoteAddress;
  }

  return {
    props: {
      ip,
    },
  };
}

export default function Home(props) {
  const [blogPostsList, setBlogPostsList] = useState([]);
  const [page, setPage] = useState(getSessionPage());
  const [totalPages, setTotalPages] = useState(0);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [filters, setFilters] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const ip = props.ip;

  const handleFilterChange = (filterValue) => {
    setFilters(filterValue);
    setPage(0); // Reset page when filter changes to display results from the first page
  };

  const handleSearch = (searchString) => {
    setSearchTerm(searchString);
    setPage(0);
  };

  // Fetching
  const fetchPosts = async (pageNumber) => {
    // Check if posts are already stored in cache
    const cachedPosts = sessionStorage.getItem(`posts-${pageNumber}`);
    const cachedTotalPages = sessionStorage.getItem("totalPages");

    if (cachedPosts && cachedTotalPages && filters.length === 0 && searchTerm.length === 0) {
      setBlogPostsList(JSON.parse(cachedPosts));
      setTotalPages(parseInt(cachedTotalPages));
      setDataLoaded(true);
    } else {
      // Query 'posts' table
      let query = supabase
        .from('posts')
        .select("*", { count: "exact" })
        .order('published_at', { ascending: false })
        .order('id', { ascending: false });

      // Filter results
      if (filters.length > 0) {
        query = query.in('company', filters);
      }
      
      // Search 
      if (searchTerm.length > 0) {
        query = query.or(`full_text.ilike.%${searchTerm}%`);
      }

      let { count, data: posts, error } = await query.range(pageNumber * POSTS_PER_PAGE, (pageNumber + 1) * POSTS_PER_PAGE - 1);

      if (error) {
        console.error("Error fetching posts:", error);
      } else {
        setBlogPostsList(posts);

        const totalPages = Math.ceil(count / POSTS_PER_PAGE);
        setTotalPages(totalPages);
        setDataLoaded(true);

        // Store posts and totalPages in cache
        if (filters.length === 0 && searchTerm.length === 0) {
          sessionStorage.setItem(`posts-${pageNumber}`, JSON.stringify(posts));
          sessionStorage.setItem("totalPages", totalPages);
        }
      }
    }
  };

  useEffect(() => {
    fetchPosts(page);
    sessionStorage.setItem("currentPage", page);
  }, [page, filters, searchTerm]);

  // Prefetching
  const prefetchPosts = async (pageNumber, filters) => {
    const cachedPosts = sessionStorage.getItem(`posts-${pageNumber}`);

    // If we have the data in the cache, no need to prefetch
    if (cachedPosts) return;

    let query = supabase
      .from('posts')
      .select("*", { count: "exact" })
      .order('published_at', { ascending: false })
      .order('id', { ascending: false });

    // Filter results
    if (filters.length > 0) {
      query = query.in('company', filters);
    }
    
    // Search 
    if (searchTerm.length > 0) {
      query = query.or(`full_text.ilike.%${searchTerm}%`);
    }

    let { count, data: posts, error } = await query.range(pageNumber * POSTS_PER_PAGE, (pageNumber + 1) * POSTS_PER_PAGE - 1);

    if (error) {
      console.error("Error fetching posts:", error);
    } else {
      // Store posts in cache
      sessionStorage.setItem(`posts-${pageNumber}`, JSON.stringify(posts));
    }
  };

  useEffect(() => {
    const nextPage = page + 1;
    if (nextPage < totalPages) {
      prefetchPosts(nextPage, filters);
    }

    const prevPage = page - 1;
    if (prevPage >= 0) {
      prefetchPosts(prevPage, filters);
    }
  }, [page, totalPages, filters, searchTerm]);

  return (
    <div className="font-berkeley m-8 md:m-10 pb-20">
      {/* Nav Buttons */}
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
      </div>

      {/* Header */}
      <div className="flex text-center flex-col mb-4">
        <div className="font-bold text-4xl mb-2">engblogs</div>
        <div className="text-md">learn from your favorite tech companies</div>
      </div>

      {/* Web Navigation - Shown on medium screens and up */}
      <div className="hidden md:grid grid-cols-3 gap-4 items-center">
        <div className="justify-self-start">
          <Filter onFilterChange={handleFilterChange} supabase={supabase} />
        </div>
        <div className="justify-self-center">
          <Pagination page={page} totalPages={totalPages} setPage={setPage} />
        </div>
        <div className="justify-self-end">
          <Search onSearch={handleSearch} />
        </div>
      </div>

      {/* Mobile Navigation - Shown on small screens */}
      <div className="md:hidden">
        <Filter onFilterChange={handleFilterChange} supabase={supabase} />
        <Search onSearch={handleSearch} />
        <Pagination page={page} totalPages={totalPages} setPage={setPage} />
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {blogPostsList.map((post, index) => (
          <BlogPost
            key={post.id}
            post_id={post.id}
            title={post.title}
            published_at={post.published_at}
            link={post.link}
            description={post.description}
            summary={post.summary}
            company={post.company}
            buzzwords={post.buzzwords}
            supabase={supabase}
            ip={ip}
          />
        ))}
      </div>

      {/* Bottom Pagination */}
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
