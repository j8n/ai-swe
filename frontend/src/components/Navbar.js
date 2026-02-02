import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { 
  LuLayoutDashboard, 
  LuFolderKanban, 
  LuSettings, 
  LuLogOut,
  LuSun,
  LuMoon,
  LuUser,
  LuMenu,
  LuX
} from 'react-icons/lu';
import { FaGithub } from 'react-icons/fa';

export const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LuLayoutDashboard },
    { href: '/projects', label: 'Projects', icon: LuFolderKanban },
    { href: '/settings', label: 'Settings', icon: LuSettings },
  ];

  if (location.pathname === '/' && !isAuthenticated) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2" data-testid="navbar-logo">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-lg">D</span>
              </div>
              <span className="font-semibold text-xl tracking-tight">DevAI</span>
            </Link>

            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                data-testid="theme-toggle"
              >
                {theme === 'dark' ? <LuSun className="h-5 w-5" /> : <LuMoon className="h-5 w-5" />}
              </Button>
              <Link to="/login">
                <Button variant="ghost" data-testid="login-btn">Sign In</Button>
              </Link>
              <Link to="/register">
                <Button data-testid="register-btn">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2" data-testid="navbar-logo">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-lg">D</span>
              </div>
              <span className="font-semibold text-xl tracking-tight">DevAI</span>
            </Link>

            {isAuthenticated && (
              <div className="hidden md:flex items-center gap-1">
                {navItems.map((item) => (
                  <Link key={item.href} to={item.href}>
                    <Button
                      variant={location.pathname.startsWith(item.href) ? 'secondary' : 'ghost'}
                      size="sm"
                      className="gap-2"
                      data-testid={`nav-${item.label.toLowerCase()}`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              data-testid="theme-toggle"
            >
              {theme === 'dark' ? <LuSun className="h-5 w-5" /> : <LuMoon className="h-5 w-5" />}
            </Button>

            {isAuthenticated && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  data-testid="mobile-menu-toggle"
                >
                  {mobileMenuOpen ? <LuX className="h-5 w-5" /> : <LuMenu className="h-5 w-5" />}
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full" data-testid="user-menu-trigger">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user?.avatar_url} alt={user?.name} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{user?.name}</p>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {user?.github_connected && (
                      <DropdownMenuItem className="gap-2">
                        <FaGithub className="h-4 w-4" />
                        <span className="text-xs text-muted-foreground">@{user?.github_username}</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => navigate('/settings')} data-testid="menu-settings">
                      <LuSettings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive" data-testid="menu-logout">
                      <LuLogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}

            {!isAuthenticated && (
              <>
                <Link to="/login">
                  <Button variant="ghost" data-testid="login-btn">Sign In</Button>
                </Link>
                <Link to="/register">
                  <Button data-testid="register-btn">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {isAuthenticated && mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link key={item.href} to={item.href} onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant={location.pathname.startsWith(item.href) ? 'secondary' : 'ghost'}
                    className="w-full justify-start gap-2"
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
