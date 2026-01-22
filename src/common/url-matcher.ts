export function globToRegex(glob: string): RegExp {
  // Escape special regex characters except *
  const escaped = glob.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  // Replace * with .*
  const pattern = escaped.replace(/\*/g, '.*');
  // Anchor start and end, case insensitive
  return new RegExp(`^${pattern}$`, 'i');
}

export function matchesGlob(url: string, glob: string): boolean {
  try {
    const regex = globToRegex(glob);
    return regex.test(url);
  } catch (e) {
    console.warn('Invalid glob pattern:', glob, e);
    return false;
  }
}
