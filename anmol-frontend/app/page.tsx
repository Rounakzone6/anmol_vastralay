'use client';

import { trpc } from '../lib/trpc';

export default function Home() {
  const { data: users, isLoading } = trpc.user.getUsers.useQuery();

  if (isLoading) return <p>Loading...</p>;

  return (
    <div>
      {users?.map((user) => (
        <div key={user.id}>{user.email}</div>
      ))}
    </div>
  );
}