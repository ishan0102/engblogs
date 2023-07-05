import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function BlogPost({ title, published_at, link, description, company }) {
  return (
    <Link href={link}
      className="max-w-md mx-auto bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden md:max-w-2xl m-3 hover:bg-indigo-500 hover:text-white"
    >
      <div className="md:flex">
        <div className="p-8">
          <div className="flex justify-between items-center">
            <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold">{published_at}</div>
            <div className="text-sm">{company}</div>
          </div>
          <div className="block mt-1 text-lg leading-tight font-medium hover:text-white">
            {title}
          </div>
          <p className="mt-2">{description}</p>
        </div>
      </div>
    </Link>
  )
}

export default function Home() {
  const [blogPostsList, setBlogPostsList] = useState([]);

  useEffect(() => {
    const fetchPosts = async () => {
      let { data: posts, error } = await supabase
        .from('posts')
        .select("*")
        .order('published_at', { ascending: false });

      if (error) console.error("Error fetching posts:", error);
      else setBlogPostsList(posts);
    }

    fetchPosts();
  }, []);

  return (
    <div className="font-berkeley">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {blogPostsList.map((post, index) => (
          <BlogPost
            key={post.id}
            title={post.title}
            published_at={post.published_at}
            link={post.link}
            description={post.description}
            company={post.company}
          />
        ))}
      </div>
    </div>
  )
}
