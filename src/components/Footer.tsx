export default function Footer() {
  return (
    <footer className="border-t border-white/5 py-10 text-center text-sm text-slate-500">
      <p>
        <span className="text-gradient font-semibold">微光义工团</span> · 记录每一次出发
      </p>
      <p className="mt-2">用善意点亮城市 · {new Date().getFullYear()}</p>
    </footer>
  );
}
