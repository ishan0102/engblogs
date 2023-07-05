import { useState } from 'react';
import Link from 'next/link';

export const BlogData = {
  blogPostsList: [
    {
      id: 1,
      title: "First Blog Post",
      link: "/blog/first-blog-post",
      published_at: "2023-07-04",
      description: "This is a preview of the first blog post...",
    },
    {
      id: 2,
      title: "Second Blog Post",
      link: "/blog/second-blog-post",
      published_at: "2023-07-05",
      description: "This is a preview of the second blog post...",
    },
  ]
};

function BlogPost({ title, published_at, link, description }) {
  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl m-3">
      <div className="md:flex">
        <div className="p-8">
          <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold">{published_at}</div>
          <Link href={link} className="block mt-1 text-lg leading-tight font-medium text-black hover:underline">
            {title}
          </Link>
          <p className="mt-2 text-gray-500">{description}</p>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <div className="font-berkeley">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {BlogData.blogPostsList.map((post, index) => (
          <BlogPost
            key={post.id}
            title={post.title}
            published_at={post.published_at}
            link={post.link}
            description={post.description}
          />
        ))}
      </div>
    </div>
  )
}
