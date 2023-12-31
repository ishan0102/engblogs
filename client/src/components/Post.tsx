import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";

export default function Post({ post }: any) {
  return (
    <Link href={post.link} target="_blank">
      <Card>
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <div className="flex h-8 items-center justify-center gap-2 rounded-full border border-background-light bg-badge px-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.links.logo_url}
                alt={post.links.company}
                className="h-5 w-5"
              ></img>
              <span>{post.company}</span>
            </div>
          </CardDescription>
          <CardTitle>{post.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="h-full w-full text-ellipsis">{post.summary}</p>
        </CardContent>
        <CardFooter className="flex justify-end">
          <span>{new Date(post.published_at).toLocaleDateString()}</span>
        </CardFooter>
      </Card>
    </Link>
  );
}
