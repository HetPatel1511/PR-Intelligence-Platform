import type { EngineerRef } from '../../types/api';
import { displayName } from '../../utils/format';
import { Avatar } from './Avatar';

interface PersonInlineProps {
  person: EngineerRef | null;
  size?: number;
}

/** Avatar + name, used in tables and headers. */
export function PersonInline({ person, size = 22 }: PersonInlineProps) {
  if (!person) {
    return <span className="text-slate-400">—</span>;
  }
  return (
    <span className="inline-flex items-center gap-2">
      <Avatar src={person.avatarUrl} alt={displayName(person)} size={size} />
      <span className="truncate">{displayName(person)}</span>
    </span>
  );
}
