/**
 * 资源路径前缀：用于 GitHub Pages 等带子路径（basePath）的部署。
 * 普通用 <img>/TextureLoader 引用 public 下的绝对路径时，Next 不会自动加 basePath，
 * 需手动用 asset() 包一层。本地/根域名部署时 NEXT_PUBLIC_BASE_PATH 为空，无副作用。
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function asset(path?: string): string {
  if (!path) return path ?? "";
  if (/^(https?:)?\/\//.test(path) || path.startsWith("data:")) return path;
  return BASE_PATH + path;
}
