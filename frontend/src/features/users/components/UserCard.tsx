import { User } from "../api/usersApi";
import { Button } from "@/shared/components/ui";
import { formatRelativeTime } from "@/shared/lib";

interface UserCardProps {
  user: User;
  onEdit?: (user: User) => void;
  onDelete?: (id: string) => void;
}

export function UserCard({ user, onEdit, onDelete }: UserCardProps) {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold">{user.name}</h3>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
        <span className={`px-2 py-1 text-xs rounded ${user.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {user.status}
        </span>
      </div>
      <div className="mt-2 text-sm text-gray-500">
        Role: {user.role} • Created: {formatRelativeTime(user.createdAt)}
      </div>
      <div className="mt-3 flex gap-2">
        {onEdit && <Button onClick={() => onEdit(user)} className="text-blue-600 hover:underline">Edit</Button>}
        {onDelete && <Button onClick={() => onDelete(user.id)} className="text-red-600 hover:underline">Delete</Button>}
      </div>
    </div>
  );
}