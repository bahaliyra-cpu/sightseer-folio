import { Link } from "@tanstack/react-router";
import { Moon, Settings, Sun, LogOut } from "lucide-react";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

import { AuthDialog } from "@/components/AuthDialog";
import { SettingsDialog } from "@/components/SettingsDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";

const ShellContext = createContext<{ openAuth: (mode?: "login" | "signup") => void }>({
  openAuth: () => {},
});

export function useShell() {
  return useContext(ShellContext);
}

const NAV = [
  { to: "/", label: "Gallery" },
  { to: "/my-gallery", label: "My Gallery" },
  { to: "/upload", label: "Upload" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { user, profile, avatarUrl, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const openAuth = useCallback((mode: "login" | "signup" = "login") => {
    setAuthMode(mode);
    setAuthOpen(true);
  }, []);

  return (
    <ShellContext.Provider value={{ openAuth }}>
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-md">
          <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-6 px-6 py-4">
            <Link to="/" className="font-display text-2xl font-medium tracking-tight">
              Wanderlight
            </Link>

            <nav className="hidden items-center gap-8 md:flex">
              {NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="label-caps text-muted-foreground transition-colors hover:text-foreground"
                  activeProps={{ className: "label-caps text-foreground" }}
                  activeOptions={{ exact: item.to === "/" }}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-2 rounded-full border border-border bg-card py-1 pl-1 pr-3 transition-colors hover:bg-secondary">
                        <Avatar className="size-8">
                          <AvatarImage src={avatarUrl ?? undefined} alt={profile?.username ?? "profile"} />
                          <AvatarFallback className="bg-secondary text-xs">
                            {(profile?.username ?? user.email ?? "T").slice(0, 1).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="hidden text-sm sm:inline">{profile?.username ?? "Traveller"}</span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel className="font-normal">
                        <p className="text-sm font-medium">{profile?.username ?? "Traveller"}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => setSettingsOpen(true)}>
                        <Settings className="mr-2 size-4" /> Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={(event) => {
                          event.preventDefault();
                          toggle();
                        }}
                      >
                        {theme === "dark" ? (
                          <>
                            <Sun className="mr-2 size-4" /> Light mode
                          </>
                        ) : (
                          <>
                            <Moon className="mr-2 size-4" /> Dark mode
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => void signOut()}>
                        <LogOut className="mr-2 size-4" /> Log out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button variant="ghost" size="sm" className="hidden lg:inline-flex" onClick={() => void signOut()}>
                    Log out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" onClick={() => openAuth("login")}>
                    Log in
                  </Button>
                  <Button size="sm" onClick={() => openAuth("signup")}>
                    Sign up
                  </Button>
                </>
              )}
            </div>
          </div>

          <nav className="flex items-center justify-center gap-6 border-t border-border/70 py-2 md:hidden">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="label-caps text-muted-foreground"
                activeProps={{ className: "label-caps text-foreground" }}
                activeOptions={{ exact: item.to === "/" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>

        <main>{children}</main>

        <footer className="mt-24 border-t border-border/70 py-10 text-center">
          <p className="label-caps text-muted-foreground">Wanderlight — a travel journal</p>
        </footer>
      </div>

      <AuthDialog key={authMode} open={authOpen} onOpenChange={setAuthOpen} initialMode={authMode} />
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        onSwitchAccount={() => openAuth("login")}
      />
    </ShellContext.Provider>
  );
}
