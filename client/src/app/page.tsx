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

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!,
  {
    auth: {
      persistSession: false,
    },
  },
);

async function getPosts(page: number = 1, companies: string[] = []) {
  const query = supabase
    .from("posts")
    .select("*, links ( company, logo_url )", { count: "exact" })
    .order("published_at", { ascending: false })
    .order("id", { ascending: false });

  if (companies.length > 0) {
    const ilikeConditions = companies
      .map((company) => `company.ilike.%${company}%`)
      .join(",");
    query.or(ilikeConditions);
  }

  const {
    count,
    data: posts,
    error,
  } = await query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (error) {
    console.error("Error fetching posts:", error);
    return { posts: [], count: 0 };
  }

  return { posts, count };
}

async function getCompanies() {
  let { data, error } = await supabase
    .from("links")
    .select("company, logo_url")
    .order("company", { ascending: true });

  if (error) {
    console.error("Error fetching companies:", error);
    return [];
  }

  const companies = data!.map((company) => ({
    name: company.company as string,
    logo: company.logo_url as string,
  }));

  return companies;
}

export default async function Page({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: { [key: string]: string | undefined };
}) {
  const pageNumber = searchParams?.page ? Number(searchParams.page) : 1;
  const selectedCompanies = searchParams?.companies
    ? searchParams.companies.split(",")
    : [];
  const { posts, count } = await getPosts(pageNumber, selectedCompanies);
  const maxPageNumber = Math.ceil((count || 1) / PAGE_SIZE);

  const companies = await getCompanies();

  return (
    <div className="flex h-full flex-col justify-start gap-4">
      <div className="flex w-full">
        <Filter companies={companies} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {posts?.map((post, index) => <Post key={index} post={post} />)}
      </div>

      <Pagination>
        <PaginationContent>
          {pageNumber > 1 && (
            <PaginationPrevious
              href={`?page=${pageNumber > 1 ? pageNumber - 1 : 1}${
                searchParams && searchParams.companies
                  ? `&companies=${searchParams.companies}`
                  : ""
              }`}
            />
          )}

          {pageNumber > 1 && (
            <PaginationLink
              href={`?page=1${
                searchParams && searchParams.companies
                  ? `&companies=${searchParams.companies}`
                  : ""
              }`}
            >
              1
            </PaginationLink>
          )}

          {pageNumber > 3 && (
            <>
              <PaginationEllipsis />
            </>
          )}

          {pageNumber > 2 && (
            <PaginationLink
              href={`?page=${pageNumber - 1}${
                searchParams && searchParams.companies
                  ? `&companies=${searchParams.companies}`
                  : ""
              }`}
            >
              {pageNumber - 1}
            </PaginationLink>
          )}

          <PaginationLink
            isActive
            href={`?page=${pageNumber}${
              searchParams && searchParams.companies
                ? `&companies=${searchParams.companies}`
                : ""
            }`}
          >
            {pageNumber}
          </PaginationLink>

          {pageNumber < maxPageNumber - 1 && (
            <PaginationLink
              href={`?page=${pageNumber + 1}${
                searchParams && searchParams.companies
                  ? `&companies=${searchParams.companies}`
                  : ""
              }`}
            >
              {pageNumber + 1}
            </PaginationLink>
          )}

          {pageNumber < maxPageNumber - 2 && (
            <>
              <PaginationEllipsis />
            </>
          )}

          {pageNumber < maxPageNumber && (
            <PaginationLink
              href={`?page=${maxPageNumber}${
                searchParams && searchParams.companies
                  ? `&companies=${searchParams.companies}`
                  : ""
              }`}
            >
              {maxPageNumber}
            </PaginationLink>
          )}

          <PaginationNext
            href={`?page=${pageNumber + 1}${
              searchParams && searchParams.companies
                ? `&companies=${searchParams.companies}`
                : ""
            }`}
          />
        </PaginationContent>
      </Pagination>
    </div>
  );
}
