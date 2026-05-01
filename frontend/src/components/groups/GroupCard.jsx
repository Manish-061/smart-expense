import { Users } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";

export function GroupCard({ group }) {
  return (
    <Link 
      to={`/groups/${group.id}`}
      className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow block"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{group.name}</h3>
          {group.description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-1">{group.description}</p>
          )}
        </div>
        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
          <Users className="w-5 h-5" />
        </div>
      </div>
      
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          {group.members.length} Members
        </span>
        <span>•</span>
        <span>Created {format(new Date(group.createdAt), "MMM d, yyyy")}</span>
      </div>
    </Link>
  );
}
