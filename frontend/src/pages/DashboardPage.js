import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { 
  LuFolderKanban, 
  LuSquareCheck, 
  LuGitPullRequest, 
  LuPlus,
  LuArrowRight,
  LuClock
} from 'react-icons/lu';
import { FaGithub } from 'react-icons/fa';
import { toast } from 'sonner';

export const DashboardPage = () => {
  const { user, api } = useAuth();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, recentRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/dashboard/recent'),
        ]);
        setStats(statsRes.data);
        setRecent(recentRes.data);
      } catch (error) {
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [api]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 noise-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            <Skeleton className="h-8 w-48" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 noise-bg" data-testid="dashboard-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {user?.name?.split(' ')[0]}</h1>
            <p className="text-muted-foreground mt-1">Here's what's happening with your projects</p>
          </div>
          <Link to="/projects/new">
            <Button className="gap-2" data-testid="new-project-btn">
              <LuPlus className="h-4 w-4" />
              New Project
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Projects</p>
                  <p className="text-3xl font-bold mt-1">{stats?.projects || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <LuFolderKanban className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Tasks</p>
                  <p className="text-3xl font-bold mt-1">{stats?.tasks?.total || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <LuSquareCheck className="h-6 w-6 text-yellow-500" />
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Badge variant="outline" className="status-pending text-xs">
                  {stats?.tasks?.pending || 0} pending
                </Badge>
                <Badge variant="outline" className="status-completed text-xs">
                  {stats?.tasks?.completed || 0} done
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Open PRs</p>
                  <p className="text-3xl font-bold mt-1">{stats?.pull_requests?.open || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <LuGitPullRequest className="h-6 w-6 text-green-500" />
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Badge variant="outline" className="status-merged text-xs">
                  {stats?.pull_requests?.merged || 0} merged
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">GitHub</p>
                  <p className="text-lg font-semibold mt-1">
                    {user?.github_connected ? (
                      <span className="text-green-500">Connected</span>
                    ) : (
                      <span className="text-muted-foreground">Not connected</span>
                    )}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-zinc-500/10 flex items-center justify-center">
                  <FaGithub className="h-6 w-6" />
                </div>
              </div>
              {!user?.github_connected && (
                <Link to="/settings">
                  <Button variant="outline" size="sm" className="w-full mt-3">
                    Connect GitHub
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Projects */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Recent Projects</CardTitle>
              <Link to="/projects">
                <Button variant="ghost" size="sm" className="gap-1">
                  View all <LuArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recent?.projects?.length > 0 ? (
                <div className="space-y-3">
                  {recent.projects.map((project) => (
                    <Link 
                      key={project.id} 
                      to={`/projects/${project.id}`}
                      className="block"
                    >
                      <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <LuFolderKanban className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{project.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {project.tech_stack?.slice(0, 2).map((tech) => (
                                <Badge key={tech} variant="outline" className="text-xs">
                                  {tech}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className={`status-${project.status}`}>
                          {project.status}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <LuFolderKanban className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No projects yet</p>
                  <Link to="/projects/new">
                    <Button variant="outline" size="sm" className="mt-2">
                      Create your first project
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Tasks */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Recent Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {recent?.tasks?.length > 0 ? (
                <div className="space-y-3">
                  {recent.tasks.map((task) => (
                    <div 
                      key={task.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          task.status === 'completed' ? 'bg-green-500' :
                          task.status === 'in_progress' ? 'bg-blue-500' :
                          task.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                        }`} />
                        <div>
                          <p className="font-medium">{task.title}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <LuClock className="h-3 w-3" />
                            {formatDate(task.updated_at)}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className={`status-${task.status}`}>
                        {task.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <LuSquareCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No tasks yet</p>
                  <p className="text-sm mt-1">Create a project to add tasks</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
