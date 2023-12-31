import Filter from "@/components/Filter";
import Post from "@/components/Post";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 60 * 30; // only query supabase every 30 minutes
const PAGE_SIZE = 12;

async function getPosts(page: number = 1) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_KEY!,
    {
      auth: {
        persistSession: false,
      },
    },
  );

  const query = supabase
    .from("posts")
    .select("*, links ( company, logo_url )", { count: "exact" })
    .order("published_at", { ascending: false })
    .order("id", { ascending: false });

  const {
    count,
    data: posts,
    error,
  } = await query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  return { posts, count };
}
export default async function Page({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const pageNumber = searchParams?.page ? Number(searchParams.page) : 1;
  const { posts, count } = await getPosts(pageNumber);
  const maxPageNumber = Math.ceil((count || 1) / PAGE_SIZE);

  return (
    <div className="flex h-full flex-col justify-start gap-4">
      <div className="flex w-full">
        <Filter />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {posts?.map((post, index) => <Post key={index} post={post} />)}
      </div>

      <Pagination>
        <PaginationContent>
          {pageNumber > 1 && (
            <PaginationPrevious
              href={`?page=${pageNumber > 1 ? pageNumber - 1 : 1}`}
            />
          )}

          {pageNumber > 1 && (
            <PaginationLink href={`?page=1`}>1</PaginationLink>
          )}

          {pageNumber > 3 && (
            <>
              <PaginationEllipsis />
            </>
          )}

          {pageNumber > 2 && (
            <PaginationLink href={`?page=${pageNumber - 1}`}>
              {pageNumber - 1}
            </PaginationLink>
          )}

          <PaginationLink isActive href={`?page=${pageNumber}`}>
            {pageNumber}
          </PaginationLink>

          {pageNumber < maxPageNumber - 1 && (
            <PaginationLink href={`?page=${pageNumber + 1}`}>
              {pageNumber + 1}
            </PaginationLink>
          )}

          {pageNumber < maxPageNumber - 2 && (
            <>
              <PaginationEllipsis />
            </>
          )}

          {pageNumber < maxPageNumber && (
            <PaginationLink href={`?page=${maxPageNumber}`}>
              {maxPageNumber}
            </PaginationLink>
          )}

          <PaginationNext href={`?page=${pageNumber + 1}`} />
        </PaginationContent>
      </Pagination>
    </div>
  );
}
