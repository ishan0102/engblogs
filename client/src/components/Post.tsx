import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";

interface PostData {
  link: string;
  title: string;
  summary: string | null;
  company: string;
  published_at: string;
  links: { company: string; logo_url: string | null } | { company: string; logo_url: string | null }[] | null;
}

export default function Post({ post }: { post: PostData }) {
  const company = Array.isArray(post.links) ? post.links[0] : post.links;
  const publisherSummary = post.summary?.startsWith("Publisher summary: ");
  const summary = publisherSummary ? post.summary?.slice("Publisher summary: ".length) : post.summary;
  return (
    <Link href={post.link} target="_blank">
      <Card>
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <div className="flex h-8 items-center justify-center gap-2 rounded-full border border-background-light bg-badge px-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {company?.logo_url ? <img
                src={company.logo_url}
                alt=""
                className="h-5 w-5"
              /> : <span aria-hidden className="flex h-5 w-5 items-center justify-center rounded bg-muted text-[10px] font-medium">{post.company.slice(0, 2)}</span>}
              <span>{post.company}</span>
            </div>
          </CardDescription>
          <CardTitle>{post.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="h-full w-full text-ellipsis">{summary}</p>
          {publisherSummary && <p className="mt-2 text-xs text-muted-foreground">Publisher summary</p>}
        </CardContent>
        <CardFooter className="flex justify-end">
          <span>{new Date(post.published_at).toLocaleDateString()}</span>
        </CardFooter>
      </Card>
    </Link>
  );
}
