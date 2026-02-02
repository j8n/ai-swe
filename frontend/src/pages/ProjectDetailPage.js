import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Skeleton } from '../components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';
import { ScrollArea } from '../components/ui/scroll-area';
import { LuArrowLeft, LuPlus, LuLoader, LuBrain, LuSquareCheck, LuGitPullRequest, LuPlay, LuTrash2, LuFileCode, LuSparkles, LuFile, LuGitBranch, LuExternalLink, LuCheck, LuX } from 'react-icons/lu';
import { FaGithub } from 'react-icons/fa';
import { toast } from 'sonner';

function FileChangeItem({ file }) {
  var [expanded, setExpanded] = useState(false);
  
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div 
        className="flex items-center justify-between p-3 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={function() { setExpanded(!expanded); }}
      >
        <div className="flex items-center gap-2">
          <LuFile className="h-4 w-4 text-primary" />
          <span className="font-mono text-sm">{file.path}</span>
        </div>
        <Badge variant="outline" className="text-xs">
          {file.action === 'create' ? 'new' : file.action}
        </Badge>
      </div>
      {expanded && (
        <div className="p-3 bg-zinc-950">
          <pre className="text-xs text-zinc-300 overflow-x-auto whitespace-pre-wrap font-mono">
            {file.content}
          </pre>
        </div>
      )}
    </div>
  );
}

function TaskCard({ task, onExecute, onDelete, executingTaskId }) {
  var [showResponse, setShowResponse] = useState(false);
  var isExecuting = executingTaskId === task.id;
  var filesCount = task.files_changed ? task.files_changed.length : 0;

  return (
    <div className="p-4 rounded-lg border border-border hover:border-primary/30 transition-colors" data-testid={'task-' + task.id}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-medium">{task.title}</h4>
            <Badge variant="outline" className={'status-' + task.status}>{task.status.replace('_', ' ')}</Badge>
            <Badge variant="outline" className={'priority-' + task.priority}>{task.priority}</Badge>
            {filesCount > 0 && (
              <Badge variant="secondary" className="gap-1">
                <LuFileCode className="h-3 w-3" />
                {filesCount} files
              </Badge>
            )}
            {task.pr_id && (
              <Badge className="gap-1 bg-green-500/20 text-green-500">
                <LuGitPullRequest className="h-3 w-3" />
                PR created
              </Badge>
            )}
          </div>
          {task.description && <p className="text-sm text-muted-foreground mt-1">{task.description}</p>}
          
          {task.ai_response && (
            <div className="mt-3">
              <Button variant="ghost" size="sm" onClick={function() { setShowResponse(!showResponse); }} className="text-xs">
                {showResponse ? 'Hide' : 'Show'} AI Response
              </Button>
              {showResponse && (
                <div className="mt-2 p-3 rounded-lg bg-muted/50 max-h-60 overflow-y-auto">
                  <pre className="text-xs whitespace-pre-wrap font-mono">{task.ai_response}</pre>
                </div>
              )}
            </div>
          )}
          
          {filesCount > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Generated Files:</p>
              {task.files_changed.map(function(file, idx) {
                return <FileChangeItem key={idx} file={file} />;
              })}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {task.status === 'pending' && (
            <Button size="sm" onClick={function() { onExecute(task.id); }} disabled={isExecuting} className="gap-1" data-testid={'execute-task-' + task.id}>
              {isExecuting ? <LuLoader className="h-4 w-4 animate-spin" /> : <LuPlay className="h-4 w-4" />}
              {isExecuting ? 'Running...' : 'Execute'}
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={function() { onDelete(task.id); }} data-testid={'delete-task-' + task.id}>
            <LuTrash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function PRCard({ pr }) {
  var [showFiles, setShowFiles] = useState(false);
  var filesCount = pr.files_changed ? pr.files_changed.length : 0;
  
  var statusColor = 'text-gray-500';
  if (pr.status === 'open') statusColor = 'text-green-500';
  else if (pr.status === 'merged') statusColor = 'text-purple-500';

  return (
    <div className="p-4 rounded-lg border border-border hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <LuGitPullRequest className={'h-4 w-4 ' + statusColor} />
            <h4 className="font-medium">{pr.title}</h4>
            <Badge variant="outline" className={'status-' + pr.status}>{pr.status}</Badge>
            {filesCount > 0 && (
              <Badge variant="secondary" className="gap-1">
                <LuFileCode className="h-3 w-3" />
                {filesCount} files changed
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
            <LuGitBranch className="h-3 w-3" />
            <span className="font-mono text-xs">{pr.branch_name}</span>
            <span>→</span>
            <span className="font-mono text-xs">{pr.base_branch}</span>
          </div>
          
          {pr.github_pr_url && (
            <a href={pr.github_pr_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2">
              <FaGithub className="h-3 w-3" />
              View on GitHub
              <LuExternalLink className="h-3 w-3" />
            </a>
          )}
          
          {filesCount > 0 && (
            <div className="mt-3">
              <Button variant="ghost" size="sm" onClick={function() { setShowFiles(!showFiles); }} className="text-xs gap-1">
                <LuFileCode className="h-3 w-3" />
                {showFiles ? 'Hide' : 'View'} changed files
              </Button>
              {showFiles && (
                <div className="mt-2 space-y-2">
                  {pr.files_changed.map(function(file, idx) {
                    return <FileChangeItem key={idx} file={file} />;
                  })}
                </div>
              )}
            </div>
          )}
        </div>
        {pr.status === 'open' && (
          <Button size="sm" variant="outline" className="gap-1">
            <LuCheck className="h-4 w-4" />
            Merge
          </Button>
        )}
      </div>
    </div>
  );
}

export function ProjectDetailPage() {
  var params = useParams();
  var projectId = params.projectId;
  var navigate = useNavigate();
  var auth = useAuth();
  var api = auth.api;
  
  var [project, setProject] = useState(null);
  var [tasks, setTasks] = useState([]);
  var [prs, setPrs] = useState([]);
  var [isLoading, setIsLoading] = useState(true);
  var [analyzing, setAnalyzing] = useState(false);
  var [taskDialogOpen, setTaskDialogOpen] = useState(false);
  var [newTaskTitle, setNewTaskTitle] = useState('');
  var [newTaskDescription, setNewTaskDescription] = useState('');
  var [newTaskPriority, setNewTaskPriority] = useState('medium');
  var [creatingTask, setCreatingTask] = useState(false);
  var [executingTaskId, setExecutingTaskId] = useState(null);

  var fetchProjectData = useCallback(function() {
    return Promise.all([
      api.get('/projects/' + projectId),
      api.get('/projects/' + projectId + '/tasks'),
      api.get('/projects/' + projectId + '/prs')
    ]).then(function(results) {
      setProject(results[0].data);
      setTasks(results[1].data);
      setPrs(results[2].data);
    }).catch(function(error) {
      toast.error('Failed to load project');
      navigate('/projects');
    }).finally(function() {
      setIsLoading(false);
    });
  }, [api, projectId, navigate]);

  useEffect(function() {
    fetchProjectData();
  }, [fetchProjectData]);

  var handleAnalyze = function() {
    setAnalyzing(true);
    api.post('/projects/' + projectId + '/analyze')
      .then(function(response) {
        setProject(function(prev) { return { ...prev, summary: response.data.summary, status: 'ready' }; });
        toast.success('Project analyzed successfully!');
      })
      .catch(function() {
        toast.error('Analysis failed. Please try again.');
      })
      .finally(function() {
        setAnalyzing(false);
      });
  };

  var handleCreateTask = function() {
    if (!newTaskTitle.trim()) return;
    setCreatingTask(true);
    api.post('/projects/' + projectId + '/tasks', {
      title: newTaskTitle,
      description: newTaskDescription,
      priority: newTaskPriority
    }).then(function(response) {
      setTasks(function(prev) { return [response.data].concat(prev); });
      setTaskDialogOpen(false);
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskPriority('medium');
      toast.success('Task created!');
    }).catch(function() {
      toast.error('Failed to create task');
    }).finally(function() {
      setCreatingTask(false);
    });
  };

  var handleExecuteTask = function(taskId) {
    setExecutingTaskId(taskId);
    toast.info('AI is working on your task. This may take a minute...');
    
    api.post('/projects/' + projectId + '/tasks/' + taskId + '/execute')
      .then(function(response) {
        setTasks(function(prev) { 
          return prev.map(function(t) {
            if (t.id === taskId) {
              return { 
                ...t, 
                status: 'completed', 
                ai_response: response.data.ai_response,
                files_changed: response.data.files_changed || [],
                pr_id: response.data.pr_id
              };
            }
            return t;
          });
        });
        
        // Refresh PRs if a new one was created
        if (response.data.pr_id) {
          api.get('/projects/' + projectId + '/prs').then(function(res) {
            setPrs(res.data);
          });
        }
        
        var filesCount = response.data.files_changed ? response.data.files_changed.length : 0;
        if (response.data.pr_id) {
          toast.success('Task completed! Created ' + filesCount + ' files and opened a PR.');
        } else if (filesCount > 0) {
          toast.success('Task completed! Generated ' + filesCount + ' files.');
        } else {
          toast.success('Task completed!');
        }
      })
      .catch(function(error) {
        toast.error('Task execution failed');
        setTasks(function(prev) { 
          return prev.map(function(t) {
            return t.id === taskId ? { ...t, status: 'failed' } : t;
          });
        });
      })
      .finally(function() {
        setExecutingTaskId(null);
      });
  };

  var handleDeleteTask = function(taskId) {
    api.delete('/projects/' + projectId + '/tasks/' + taskId)
      .then(function() {
        setTasks(function(prev) { return prev.filter(function(t) { return t.id !== taskId; }); });
        toast.success('Task deleted');
      })
      .catch(function() {
        toast.error('Failed to delete task');
      });
  };

  var handleDeleteProject = function() {
    api.delete('/projects/' + projectId)
      .then(function() {
        toast.success('Project deleted');
        navigate('/projects');
      })
      .catch(function() {
        toast.error('Failed to delete project');
      });
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

  var techStack = project && project.tech_stack ? project.tech_stack : [];
  var projectName = project ? project.name : '';
  var projectStatus = project ? project.status : '';
  var projectSummary = project ? project.summary : '';
  var projectDescription = project && project.description ? project.description : 'No description';
  var projectSourceType = project ? project.source_type : '';
  var projectCreatedAt = project && project.created_at ? new Date(project.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '';
  var projectFileCount = project ? project.file_count : 0;
  var githubOwner = project ? project.github_owner : '';
  var githubRepo = project ? project.github_repo : '';

  return (
    <div className="min-h-screen pt-20 noise-bg" data-testid="project-detail-page">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={function() { navigate('/projects'); }}>
            <LuArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{projectName}</h1>
              <Badge variant="outline" className={'status-' + projectStatus}>{projectStatus}</Badge>
              {projectSourceType === 'github' && (
                <Badge variant="secondary" className="gap-1">
                  <FaGithub className="h-3 w-3" />
                  GitHub
                </Badge>
              )}
            </div>
            {githubOwner && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <FaGithub className="h-4 w-4" />
                {githubOwner}/{githubRepo}
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
                <AlertDialogDescription>This will permanently delete the project and all associated tasks and PRs.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteProject}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {techStack.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {techStack.map(function(tech, idx) {
              return <Badge key={idx} variant="outline" className="gap-1">{tech}</Badge>;
            })}
            <Badge variant="secondary" className="gap-1">
              <LuFileCode className="h-3 w-3" />
              {projectFileCount} files
            </Badge>
          </div>
        )}

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview" className="gap-2"><LuBrain className="h-4 w-4" />Overview</TabsTrigger>
            <TabsTrigger value="tasks" className="gap-2"><LuSquareCheck className="h-4 w-4" />Tasks ({tasks.length})</TabsTrigger>
            <TabsTrigger value="prs" className="gap-2"><LuGitPullRequest className="h-4 w-4" />PRs ({prs.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">AI Analysis</CardTitle>
                    {!projectSummary && (
                      <Button size="sm" onClick={handleAnalyze} disabled={analyzing} className="gap-2" data-testid="analyze-btn">
                        {analyzing ? <LuLoader className="h-4 w-4 animate-spin" /> : <LuSparkles className="h-4 w-4" />}
                        {analyzing ? 'Analyzing...' : 'Analyze'}
                      </Button>
                    )}
                  </div>
                  <CardDescription>AI-generated summary of your project</CardDescription>
                </CardHeader>
                <CardContent>
                  {projectSummary ? (
                    <ScrollArea className="h-64">
                      <div className="whitespace-pre-wrap text-sm text-muted-foreground pr-4">{projectSummary}</div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <LuBrain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Click "Analyze" to generate an AI summary</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-lg">Project Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div><p className="text-sm text-muted-foreground">Description</p><p className="mt-1">{projectDescription}</p></div>
                  <div><p className="text-sm text-muted-foreground">Source</p><p className="mt-1 capitalize">{projectSourceType}</p></div>
                  <div><p className="text-sm text-muted-foreground">Created</p><p className="mt-1">{projectCreatedAt}</p></div>
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
                    <CardDescription>Create tasks for AI to implement. The AI will generate real code and create PRs.</CardDescription>
                  </div>
                  <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="gap-2" data-testid="add-task-btn"><LuPlus className="h-4 w-4" />Add Task</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Task</DialogTitle>
                        <DialogDescription>Describe the feature or bug fix you want the AI to implement</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Title</label>
                          <Input placeholder="Add user authentication" value={newTaskTitle} onChange={function(e) { setNewTaskTitle(e.target.value); }} data-testid="task-title-input" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Description</label>
                          <Textarea placeholder="Implement JWT-based authentication with login and register endpoints, include middleware for protected routes..." value={newTaskDescription} onChange={function(e) { setNewTaskDescription(e.target.value); }} rows={4} data-testid="task-description-input" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Priority</label>
                          <Select value={newTaskPriority} onValueChange={setNewTaskPriority}>
                            <SelectTrigger data-testid="task-priority-select"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={function() { setTaskDialogOpen(false); }}>Cancel</Button>
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
                  <div className="space-y-4">
                    {tasks.map(function(task) {
                      return <TaskCard key={task.id} task={task} onExecute={handleExecuteTask} onDelete={handleDeleteTask} executingTaskId={executingTaskId} />;
                    })}
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
                <CardDescription>AI-generated pull requests with actual code changes</CardDescription>
              </CardHeader>
              <CardContent>
                {prs.length > 0 ? (
                  <div className="space-y-4">
                    {prs.map(function(pr) {
                      return <PRCard key={pr.id} pr={pr} />;
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <LuGitPullRequest className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No pull requests yet</p>
                    <p className="text-sm mt-1">Execute tasks to generate PRs with real code</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default ProjectDetailPage;
