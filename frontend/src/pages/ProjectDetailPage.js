import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Skeleton } from '../components/ui/skeleton';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/ui/alert-dialog';
import { 
  LuArrowLeft, 
  LuPlus, 
  LuLoader,
  LuBrain,
  LuSquareCheck,
  LuGitPullRequest,
  LuPlay,
  LuTrash2,
  LuFileCode,
  LuSparkles
} from 'react-icons/lu';
import { FaGithub, FaLaravel, FaVuejs } from 'react-icons/fa';
import { SiFlutter } from 'react-icons/si';
import { toast } from 'sonner';

const techIcons = {
  'Laravel': FaLaravel,
  'PHP': FaLaravel,
  'Vue.js': FaVuejs,
  'Vue': FaVuejs,
  'Flutter': SiFlutter,
  'Dart': SiFlutter,
};

export const ProjectDetailPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { api } = useAuth();
  
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [prs, setPrs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');
  const [creatingTask, setCreatingTask] = useState(false);
  const [executingTaskId, setExecutingTaskId] = useState(null);

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      const [projectRes, tasksRes, prsRes] = await Promise.all([
        api.get(`/projects/${projectId}`),
        api.get(`/projects/${projectId}/tasks`),
        api.get(`/projects/${projectId}/prs`),
      ]);
      setProject(projectRes.data);
      setTasks(tasksRes.data);
      setPrs(prsRes.data);
    } catch (error) {
      toast.error('Failed to load project');
      navigate('/projects');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const response = await api.post(`/projects/${projectId}/analyze`);
      setProject(prev => ({ ...prev, summary: response.data.summary, status: 'ready' }));
      toast.success('Project analyzed successfully!');
    } catch (error) {
      toast.error('Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return;
    
    setCreatingTask(true);
    try {
      const response = await api.post(`/projects/${projectId}/tasks`, {
        title: newTaskTitle,
        description: newTaskDescription,
        priority: newTaskPriority
      });
      setTasks(prev => [response.data, ...prev]);
      setTaskDialogOpen(false);
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskPriority('medium');
      toast.success('Task created!');
    } catch (error) {
      toast.error('Failed to create task');
    } finally {
      setCreatingTask(false);
    }
  };

  const handleExecuteTask = async (taskId) => {
    setExecutingTaskId(taskId);
    try {
      const response = await api.post(`/projects/${projectId}/tasks/${taskId}/execute`);
      setTasks(prev => prev.map(t => 
        t.id === taskId 
          ? { ...t, status: 'completed', ai_response: response.data.ai_response }
          : t
      ));
      toast.success('Task executed successfully!');
    } catch (error) {
      toast.error('Task execution failed');
      setTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, status: 'failed' } : t
      ));
    } finally {
      setExecutingTaskId(null);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await api.delete(`/projects/${projectId}/tasks/${taskId}`);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      toast.success('Task deleted');
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  const handleDeleteProject = async () => {
    try {
      await api.delete(`/projects/${projectId}`);
      toast.success('Project deleted');
      navigate('/projects');
    } catch (error) {
      toast.error('Failed to delete project');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 noise-bg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 noise-bg" data-testid="project-detail-page">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/projects')}>
            <LuArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{project?.name}</h1>
              <Badge variant="outline" className={`status-${project?.status}`}>
                {project?.status}
              </Badge>
            </div>
            {project?.github_owner && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <FaGithub className="h-4 w-4" />
                {project.github_owner}/{project.github_repo}
              </div>
            )}
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="gap-2">
                <LuTrash2 className="h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Project?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the project and all associated tasks and PRs.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteProject}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {project?.tech_stack?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {project.tech_stack.map((tech) => {
              const Icon = techIcons[tech];
              return (
                <Badge key={tech} variant="outline" className="gap-1">
                  {Icon && <Icon className="h-3 w-3" />}
                  {tech}
                </Badge>
              );
            })}
            <Badge variant="secondary" className="gap-1">
              <LuFileCode className="h-3 w-3" />
              {project.file_count} files
            </Badge>
          </div>
        )}

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview" className="gap-2">
              <LuBrain className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-2">
              <LuSquareCheck className="h-4 w-4" />
              Tasks ({tasks.length})
            </TabsTrigger>
            <TabsTrigger value="prs" className="gap-2">
              <LuGitPullRequest className="h-4 w-4" />
              PRs ({prs.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">AI Analysis</CardTitle>
                    {!project?.summary && (
                      <Button size="sm" onClick={handleAnalyze} disabled={analyzing} className="gap-2" data-testid="analyze-btn">
                        {analyzing ? <LuLoader className="h-4 w-4 animate-spin" /> : <LuSparkles className="h-4 w-4" />}
                        {analyzing ? 'Analyzing...' : 'Analyze'}
                      </Button>
                    )}
                  </div>
                  <CardDescription>AI-generated summary of your project</CardDescription>
                </CardHeader>
                <CardContent>
                  {project?.summary ? (
                    <div className="whitespace-pre-wrap text-sm text-muted-foreground">{project.summary}</div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <LuBrain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Click "Analyze" to generate an AI summary</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Project Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="mt-1">{project?.description || 'No description'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Source</p>
                    <p className="mt-1 capitalize">{project?.source_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="mt-1">{new Date(project?.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tasks">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Tasks</CardTitle>
                    <CardDescription>Create tasks for AI to implement</CardDescription>
                  </div>
                  <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="gap-2" data-testid="add-task-btn">
                        <LuPlus className="h-4 w-4" />
                        Add Task
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Task</DialogTitle>
                        <DialogDescription>Describe the feature or bug fix</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Title</label>
                          <Input placeholder="Add user authentication" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} data-testid="task-title-input" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Description</label>
                          <Textarea placeholder="Implementation details..." value={newTaskDescription} onChange={(e) => setNewTaskDescription(e.target.value)} rows={4} data-testid="task-description-input" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Priority</label>
                          <Select value={newTaskPriority} onValueChange={setNewTaskPriority}>
                            <SelectTrigger data-testid="task-priority-select">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setTaskDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateTask} disabled={!newTaskTitle.trim() || creatingTask} data-testid="create-task-submit">
                          {creatingTask && <LuLoader className="h-4 w-4 animate-spin mr-2" />}
                          Create Task
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {tasks.length > 0 ? (
                  <div className="space-y-3">
                    {tasks.map((task) => (
                      <div key={task.id} className="p-4 rounded-lg border border-border hover:border-primary/30 transition-colors" data-testid={`task-${task.id}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{task.title}</h4>
                              <Badge variant="outline" className={`status-${task.status}`}>{task.status.replace('_', ' ')}</Badge>
                              <Badge variant="outline" className={`priority-${task.priority}`}>{task.priority}</Badge>
                            </div>
                            {task.description && <p className="text-sm text-muted-foreground mt-1">{task.description}</p>}
                            {task.ai_response && (
                              <div className="mt-3 p-3 rounded-lg bg-muted/50">
                                <p className="text-xs text-muted-foreground mb-1">AI Response:</p>
                                <pre className="text-xs whitespace-pre-wrap font-mono max-h-40 overflow-y-auto">{task.ai_response}</pre>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {task.status === 'pending' && (
                              <Button size="sm" onClick={() => handleExecuteTask(task.id)} disabled={executingTaskId === task.id} className="gap-1" data-testid={`execute-task-${task.id}`}>
                                {executingTaskId === task.id ? <LuLoader className="h-4 w-4 animate-spin" /> : <LuPlay className="h-4 w-4" />}
                                Execute
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" onClick={() => handleDeleteTask(task.id)} data-testid={`delete-task-${task.id}`}>
                              <LuTrash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <LuSquareCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No tasks yet</p>
                    <p className="text-sm mt-1">Create a task to start AI development</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="prs">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pull Requests</CardTitle>
                <CardDescription>AI-generated pull requests for completed tasks</CardDescription>
              </CardHeader>
              <CardContent>
                {prs.length > 0 ? (
                  <div className="space-y-3">
                    {prs.map((pr) => (
                      <div key={pr.id} className="p-4 rounded-lg border border-border hover:border-primary/30 transition-colors">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <LuGitPullRequest className={`h-4 w-4 ${pr.status === 'open' ? 'text-green-500' : pr.status === 'merged' ? 'text-purple-500' : 'text-gray-500'}`} />
                              <h4 className="font-medium">{pr.title}</h4>
                              <Badge variant="outline" className={`status-${pr.status}`}>{pr.status}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{pr.branch_name} → {pr.base_branch}</p>
                            {pr.github_pr_url && (
                              <a href={pr.github_pr_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline mt-1 inline-block">
                                View on GitHub →
                              </a>
                            )}
                          </div>
                          {pr.status === 'open' && <Button size="sm" variant="outline">Merge</Button>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <LuGitPullRequest className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No pull requests yet</p>
                    <p className="text-sm mt-1">Complete tasks to generate PRs</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProjectDetailPage;
