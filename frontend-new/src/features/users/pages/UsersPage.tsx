import { useUsers, useCreateUser, useDeleteUser } from "../hooks/useUsers";
import { UserCard } from "../components/UserCard";
import { User } from "../api/usersApi";
import { useState } from "react";
import { Button } from "@/shared/components/ui";


export function UsersPage() {
  const { data, isLoading, error } = useUsers();
  const createUser = useCreateUser();
  const deleteUser = useDeleteUser();
  const [showForm, setShowForm] = useState(false);

  const handleCreate = async () => {
    await createUser.mutateAsync({ name: "New User", email: "new@example.com", role: "user", status: "active" });
    setShowForm(false);
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Users</h1>
        <Button onClick={() => setShowForm(true)}>Add User</Button>
      </div>
      {showForm && (
        <div className="mb-4 p-4 border rounded">
          <h2 className="font-semibold mb-2">Create User</h2>
          <Button onClick={handleCreate} disabled={createUser.isPending}>
            {createUser.isPending ? "Creating..." : "Create"}
          </Button>
          <Button variant="ghost" onClick={() => setShowForm(false)} className="ml-2">Cancel</Button>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data?.data.map((user: User) => (
          <UserCard
            key={user.id}
            user={user}
            onDelete={(id) => deleteUser.mutate(id)}
          />
        ))}
      </div>
    </div>
  );
}