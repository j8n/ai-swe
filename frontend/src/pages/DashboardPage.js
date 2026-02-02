import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { LuFolderKanban, LuSquareCheck, LuGitPullRequest, LuPlus, LuArrowRight, LuClock } from 'react-icons/lu';
import { FaGithub } from 'react-icons/fa';
import { toast } from 'sonner';

function StatCard({ title, value, icon: Icon, iconColor, children }) {
  return (
    <Card className="card-hover">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
          </div>
          <div className={'w-12 h-12 rounded-lg flex items-center justify-center ' + iconColor}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

function ProjectItem({ project }) {
  const techList = project.tech_stack || [];
  return (
    <Link to={'/projects/' + project.id} className="block">
      <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <LuFolderKanban className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{project.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {techList.slice(0, 2).map(function(tech, i) {
                return <Badge key={i} variant="outline" className="text-xs">{tech}</Badge>;
              })}
            </div>
          </div>
        </div>
        <Badge variant="outline" className={'status-' + project.status}>{project.status}</Badge>
      </div>
    </Link>
  );
}

function TaskItem({ task }) {
  var statusColor = 'bg-yellow-500';
  if (task.status === 'completed') statusColor = 'bg-green-500';
  else if (task.status === 'in_progress') statusColor = 'bg-blue-500';
  else if (task.status === 'failed') statusColor = 'bg-red-500';

  var formattedDate = '';
  if (task.updated_at) {
    var d = new Date(task.updated_at);
    formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className={'w-2 h-2 rounded-full ' + statusColor} />
        <div>
          <p className="font-medium">{task.title}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            <LuClock className="h-3 w-3" />
            {formattedDate}
          </div>
        </div>
      </div>
      <Badge variant="outline" className={'status-' + task.status}>{task.status.replace('_', ' ')}</Badge>
    </div>
  );
}

export function DashboardPage() {
  var auth = useAuth();
  var user = auth.user;
  var api = auth.api;
  var [stats, setStats] = useState(null);
  var [recent, setRecent] = useState(null);
  var [isLoading, setIsLoading] = useState(true);

  var fetchData = useCallback(function() {
    return Promise.all([api.get('/dashboard/stats'), api.get('/dashboard/recent')])
      .then(function(results) {
        setStats(results[0].data);
        setRecent(results[1].data);
      })
      .catch(function() {
        toast.error('Failed to load dashboard data');
      })
      .finally(function() {
        setIsLoading(false);
      });
  }, [api]);

  useEffect(function() {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 noise-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            <Skeleton className="h-8 w-48" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  var projectsCount = stats && stats.projects ? stats.projects : 0;
  var tasksTotal = stats && stats.tasks ? stats.tasks.total : 0;
  var tasksPending = stats && stats.tasks ? stats.tasks.pending : 0;
  var tasksCompleted = stats && stats.tasks ? stats.tasks.completed : 0;
  var prsOpen = stats && stats.pull_requests ? stats.pull_requests.open : 0;
  var prsMerged = stats && stats.pull_requests ? stats.pull_requests.merged : 0;
  var recentProjects = recent && recent.projects ? recent.projects : [];
  var recentTasks = recent && recent.tasks ? recent.tasks : [];
  var userName = user && user.name ? user.name.split(' ')[0] : '';
  var githubConnected = user && user.github_connected;

  return (
    <div className="min-h-screen pt-20 noise-bg" data-testid="dashboard-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {userName}</h1>
            <p className="text-muted-foreground mt-1">Here's what's happening with your projects</p>
          </div>
          <Link to="/projects/new">
            <Button className="gap-2" data-testid="new-project-btn">
              <LuPlus className="h-4 w-4" />
              New Project
            </Button>
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="Projects" value={projectsCount} icon={LuFolderKanban} iconColor="bg-primary/10 text-primary" />
          <StatCard title="Total Tasks" value={tasksTotal} icon={LuSquareCheck} iconColor="bg-yellow-500/10 text-yellow-500">
            <div className="flex gap-2 mt-3">
              <Badge variant="outline" className="status-pending text-xs">{tasksPending} pending</Badge>
              <Badge variant="outline" className="status-completed text-xs">{tasksCompleted} done</Badge>
            </div>
          </StatCard>
          <StatCard title="Open PRs" value={prsOpen} icon={LuGitPullRequest} iconColor="bg-green-500/10 text-green-500">
            <div className="flex gap-2 mt-3">
              <Badge variant="outline" className="status-merged text-xs">{prsMerged} merged</Badge>
            </div>
          </StatCard>
          <Card className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">GitHub</p>
                  <p className="text-lg font-semibold mt-1">
                    {githubConnected ? <span className="text-green-500">Connected</span> : <span className="text-muted-foreground">Not connected</span>}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-zinc-500/10 flex items-center justify-center">
                  <FaGithub className="h-6 w-6" />
                </div>
              </div>
              {!githubConnected && (
                <Link to="/settings">
                  <Button variant="outline" size="sm" className="w-full mt-3">Connect GitHub</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Recent Projects</CardTitle>
              <Link to="/projects">
                <Button variant="ghost" size="sm" className="gap-1">View all <LuArrowRight className="h-4 w-4" /></Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentProjects.length > 0 ? (
                <div className="space-y-3">
                  {recentProjects.map(function(project, i) {
                    return <ProjectItem key={i} project={project} />;
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <LuFolderKanban className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No projects yet</p>
                  <Link to="/projects/new">
                    <Button variant="outline" size="sm" className="mt-2">Create your first project</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Recent Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {recentTasks.length > 0 ? (
                <div className="space-y-3">
                  {recentTasks.map(function(task, i) {
                    return <TaskItem key={i} task={task} />;
                  })}
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
}

export default DashboardPage;
