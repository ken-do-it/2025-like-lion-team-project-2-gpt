import { useState } from "react";
import { NavLink } from "react-router-dom";

const links = [
  { href: "/", label: "탐색" },
  { href: "/upload", label: "업로드" },
  { href: "/library", label: "내 라이브러리" },
  { href: "/profile", label: "프로필" },
];

function TopNav() {
  const [open, setOpen] = useState(false);

  const renderLinks = (onClick?: () => void) =>
    links.map((link) => (
      <NavLink
        key={link.href}
        to={link.href}
        onClick={() => onClick?.()}
        className={({ isActive }) =>
          `text-sm font-medium transition-colors ${isActive ? "text-white" : "text-white/70 hover:text-white"}`
        }
      >
        {link.label}
      </NavLink>
    ));

  return (
    <header className="sticky top-0 z-20 w-full border-b border-white/10 bg-background-dark/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-3xl">music_note</span>
          <p className="text-xl font-bold tracking-tight">AI Music GPT</p>
        </div>

        {/* 데스크톱 내비게이션 */}
        <nav className="hidden items-center gap-6 md:flex">{renderLinks()}</nav>

        <div className="flex items-center gap-3">
          <button className="hidden h-10 w-10 items-center justify-center rounded-full bg-white/10 text-gray-300 transition hover:bg-white/20 hover:text-white md:flex">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <div
            className="h-10 w-10 rounded-full bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDtENzkGvmmTBezQTG4tnYos6jxBkrJZz_-U9oWC146ugpuHIPs8RpfhvIwLy9H1o_rQQGnlnh4R8Itk-ExtY1-gUci7Ym5pp4EGvJ85mz38jDz4i6v2GXwXt7fcNe-0Q-wJKGlFv0Z34TOpZQ2m2uCkRZfHkBiZaLhL0wtRTgBVuKnt-U-WdBSB39Vl7bnUQeuluIXzVs52XXinKPVtHFtkgtGzqbMkgvHyaGR9k_SC3Lg7ax33YG6vjXzsayqj85LWittsOXLrL4')",
            }}
          />
          {/* 모바일 햄버거 */}
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="메뉴 열기"
          >
            <span className="material-symbols-outlined">{open ? "close" : "menu"}</span>
          </button>
        </div>
      </div>

      {/* 모바일 드롭다운 메뉴 */}
      {open && (
        <div className="border-t border-white/10 bg-background-dark/95 px-4 py-3 md:hidden">
          <div className="flex flex-col gap-3">{renderLinks(() => setOpen(false))}</div>
        </div>
      )}
    </header>
  );
}

export default TopNav;
