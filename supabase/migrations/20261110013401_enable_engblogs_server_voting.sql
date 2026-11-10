grant select, insert, update, delete on public.engblogs_upvotes to service_role;
grant usage, select on sequence public.engblogs_upvotes_id_seq to service_role;
create index engblogs_posts_link_hash on public.engblogs_posts using hash(link);
