import { NavLink } from "react-router-dom";

const links = [
  { href: "/", label: "탐색" },
  { href: "/upload", label: "업로드" },
  { href: "/library", label: "내 라이브러리" },
];

function TopNav() {
  return (
    <header className="sticky top-0 z-20 w-full bg-background-dark/80 backdrop-blur-sm border-b border-white/10">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-3xl">music_note</span>
          <p className="text-xl font-bold tracking-tight">AI Music</p>
        </div>
        <nav className="hidden gap-6 md:flex">
          {links.map((link) => (
            <NavLink
              key={link.href}
              to={link.href}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${isActive ? "text-white" : "text-white/60 hover:text-white"}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-4">
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
        </div>
      </div>
    </header>
  );
}

export default TopNav;
