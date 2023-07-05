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
      company: "Company 1",
    },
    {
      id: 2,
      title: "Second Blog Post",
      link: "/blog/second-blog-post",
      published_at: "2023-07-05",
      description: "This is a preview of the second blog post...",
      company: "Company 2",
    },
  ]
};

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
            company={post.company}
          />
        ))}
      </div>
    </div>
  )
}
