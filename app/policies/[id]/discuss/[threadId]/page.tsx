import ThreadDetail from './ThreadDetail';

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ id: string; threadId: string }>;
}) {
  const { id, threadId } = await params;

  return <ThreadDetail policyId={id} threadId={threadId} />;
}
