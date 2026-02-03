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
import { LuArrowLeft, LuPlus, LuLoader, LuBrain, LuSquareCheck, LuGitPullRequest, LuPlay, LuTrash2, LuFileCode, LuSparkles, LuFile, LuGitBranch, LuExternalLink, LuCheck, LuChevronDown, LuChevronRight, LuRotateCcw, LuFolder, LuFolderOpen, LuSearch } from 'react-icons/lu';
import { FaGithub } from 'react-icons/fa';
import { toast } from 'sonner';

// Helper to get file extension color
function getFileColor(filename) {
  const ext = filename.split('.').pop()?.toLowerCase();
  const colors = {
    'php': 'text-indigo-400',
    'vue': 'text-emerald-400',
    'js': 'text-yellow-400',
    'jsx': 'text-yellow-400',
    'ts': 'text-blue-400',
    'tsx': 'text-blue-400',
    'dart': 'text-cyan-400',
    'py': 'text-green-400',
    'json': 'text-orange-400',
    'css': 'text-pink-400',
    'html': 'text-red-400',
    'md': 'text-gray-400',
  };
  return colors[ext] || 'text-primary';
}

// Build tree structure from flat file list
function buildFileTree(files) {
  const tree = {};
  
  files.forEach(file => {
    const parts = file.path.split('/');
    let current = tree;
    
    parts.forEach((part, idx) => {
      if (idx === parts.length - 1) {
        // File
        current[part] = { type: 'file', ...file };
      } else {
        // Directory
        if (!current[part]) {
          current[part] = { type: 'dir', children: {} };
        }
        current = current[part].children;
      }
    });
  });
  
  return tree;
}

// File tree node component
function FileTreeNode({ name, node, level, onFileClick, selectedFile }) {
  const [expanded, setExpanded] = useState(level < 2);
  const isDir = node.type === 'dir';
  const isSelected = !isDir && node.path === selectedFile;
  const padding = level * 16;
  
  if (isDir) {
    const children = Object.entries(node.children).sort((a, b) => {
      // Directories first, then files
      if (a[1].type !== b[1].type) return a[1].type === 'dir' ? -1 : 1;
      return a[0].localeCompare(b[0]);
    });
    
    return (
      <div>
        <button
          className="w-full flex items-center gap-1 py-1 px-2 hover:bg-muted/50 rounded text-left text-sm"
          style={{ paddingLeft: padding }}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <LuChevronDown className="h-3 w-3 flex-shrink-0" /> : <LuChevronRight className="h-3 w-3 flex-shrink-0" />}
          {expanded ? <LuFolderOpen className="h-4 w-4 text-yellow-500 flex-shrink-0" /> : <LuFolder className="h-4 w-4 text-yellow-500 flex-shrink-0" />}
          <span className="truncate">{name}</span>
        </button>
        {expanded && children.map(([childName, childNode]) => (
          <FileTreeNode
            key={childName}
            name={childName}
            node={childNode}
            level={level + 1}
            onFileClick={onFileClick}
            selectedFile={selectedFile}
          />
        ))}
      </div>
    );
  }
  
  return (
    <button
      className={`w-full flex items-center gap-1 py-1 px-2 hover:bg-muted/50 rounded text-left text-sm ${isSelected ? 'bg-primary/20 text-primary' : ''}`}
      style={{ paddingLeft: padding }}
      onClick={() => onFileClick(node)}
    >
      <span className="w-3" />
      <LuFile className={`h-4 w-4 flex-shrink-0 ${getFileColor(name)}`} />
      <span className="truncate">{name}</span>
    </button>
  );
}

// File Browser component
function FileBrowser({ projectId, api, sourceType }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [loadingContent, setLoadingContent] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    api.get('/projects/' + projectId + '/files')
      .then(r => {
        setFiles(r.data.files || []);
      })
      .catch(() => toast.error('Failed to load files'))
      .finally(() => setLoading(false));
  }, [api, projectId]);
  
  const handleFileClick = (file) => {
    setSelectedFile(file.path);
    
    // Check if content is already available
    if (file.content) {
      setFileContent(file.content);
      return;
    }
    
    // Fetch content from API
    setLoadingContent(true);
    api.get('/projects/' + projectId + '/files/' + encodeURIComponent(file.path))
      .then(r => setFileContent(r.data.content || ''))
      .catch(() => {
        setFileContent('// Unable to load file content');
        toast.error('Failed to load file');
      })
      .finally(() => setLoadingContent(false));
  };
  
  const filteredFiles = searchQuery
    ? files.filter(f => f.path.toLowerCase().includes(searchQuery.toLowerCase()))
    : files;
  
  const fileTree = buildFileTree(filteredFiles);
  const treeEntries = Object.entries(fileTree).sort((a, b) => {
    if (a[1].type !== b[1].type) return a[1].type === 'dir' ? -1 : 1;
    return a[0].localeCompare(b[0]);
  });
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LuLoader className="h-6 w-6 animate-spin" />
      </div>
    );
  }
  
  if (files.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <LuFolder className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No files found</p>
        <p className="text-sm mt-1">Upload a project or connect GitHub to view files</p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[600px]">
      {/* File Tree */}
      <div className="border border-border rounded-lg overflow-hidden flex flex-col">
        <div className="p-2 border-b border-border">
          <div className="relative">
            <LuSearch className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2">
            {treeEntries.map(([name, node]) => (
              <FileTreeNode
                key={name}
                name={name}
                node={node}
                level={0}
                onFileClick={handleFileClick}
                selectedFile={selectedFile}
              />
            ))}
          </div>
        </ScrollArea>
        <div className="p-2 border-t border-border text-xs text-muted-foreground">
          {files.length} files
        </div>
      </div>
      
      {/* File Content */}
      <div className="lg:col-span-2 border border-border rounded-lg overflow-hidden flex flex-col">
        {selectedFile ? (
          <>
            <div className="p-3 border-b border-border flex items-center gap-2 bg-muted/30">
              <LuFile className={`h-4 w-4 ${getFileColor(selectedFile)}`} />
              <span className="font-mono text-sm truncate">{selectedFile}</span>
            </div>
            <ScrollArea className="flex-1 bg-zinc-950">
              {loadingContent ? (
                <div className="flex items-center justify-center py-12">
                  <LuLoader className="h-5 w-5 animate-spin text-zinc-500" />
                </div>
              ) : (
                <pre className="p-4 text-sm text-zinc-300 font-mono whitespace-pre-wrap">{fileContent}</pre>
              )}
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <LuFileCode className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>Select a file to view its content</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FileItem({ file }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 text-left" onClick={() => setOpen(!open)}>
        <div className="flex items-center gap-2">
          {open ? <LuChevronDown className="h-4 w-4" /> : <LuChevronRight className="h-4 w-4" />}
          <LuFile className="h-4 w-4 text-primary" />
          <span className="font-mono text-sm">{file.path}</span>
        </div>
        <Badge variant="outline" className="text-xs">new</Badge>
      </button>
      {open && <div className="p-3 bg-zinc-950 max-h-60 overflow-auto"><pre className="text-xs text-zinc-300 whitespace-pre-wrap font-mono">{file.content}</pre></div>}
    </div>
  );
}

function FilesList({ files }) {
  if (!files || files.length === 0) return null;
  return (
    <div className="space-y-2">
      {files.map((f, i) => <FileItem key={i} file={f} />)}
    </div>
  );
}

function TechBadges({ techStack }) {
  if (!techStack || techStack.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {techStack.map((t, i) => <Badge key={i} variant="outline">{t}</Badge>)}
    </div>
  );
}

function TasksList({ tasks, onExecute, onDelete, executingTaskId }) {
  const [expanded, setExpanded] = useState({});
  const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  if (tasks.length === 0) {
    return <div className="text-center py-12 text-muted-foreground"><LuSquareCheck className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>No tasks yet</p></div>;
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => {
        const fc = task.files_changed || [];
        const isExp = expanded[task.id];
        const isRunning = executingTaskId === task.id;
        const canExecute = task.status === 'pending' || task.status === 'failed';
        return (
          <div key={task.id} className="p-4 rounded-lg border border-border" data-testid={'task-' + task.id}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-medium">{task.title}</h4>
                  <Badge variant="outline" className={'status-' + task.status}>{task.status.replace('_', ' ')}</Badge>
                  <Badge variant="outline" className={'priority-' + task.priority}>{task.priority}</Badge>
                  {fc.length > 0 && <Badge variant="secondary"><LuFileCode className="h-3 w-3 mr-1" />{fc.length} files</Badge>}
                  {task.pr_id && <Badge className="bg-green-500/20 text-green-500"><LuGitPullRequest className="h-3 w-3 mr-1" />PR</Badge>}
                </div>
                {task.description && <p className="text-sm text-muted-foreground mt-1">{task.description}</p>}
                {(task.ai_response || fc.length > 0) && <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={() => toggle(task.id)}>{isExp ? 'Hide' : 'Show'} details</Button>}
                {isExp && task.ai_response && <div className="mt-2 p-3 rounded-lg bg-muted/50 max-h-40 overflow-y-auto"><pre className="text-xs whitespace-pre-wrap font-mono">{task.ai_response}</pre></div>}
                {isExp && fc.length > 0 && <div className="mt-3"><p className="text-xs text-muted-foreground mb-2">Generated Files:</p><FilesList files={fc} /></div>}
              </div>
              <div className="flex items-center gap-2">
                {canExecute && (
                  <Button size="sm" onClick={() => onExecute(task.id)} disabled={isRunning} variant={task.status === 'failed' ? 'outline' : 'default'}>
                    {isRunning ? <LuLoader className="h-4 w-4 animate-spin mr-1" /> : task.status === 'failed' ? <LuRotateCcw className="h-4 w-4 mr-1" /> : <LuPlay className="h-4 w-4 mr-1" />}
                    {isRunning ? 'Running...' : task.status === 'failed' ? 'Retry' : 'Execute'}
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => onDelete(task.id)}><LuTrash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PRsList({ prs }) {
  const [expanded, setExpanded] = useState({});
  const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  if (prs.length === 0) {
    return <div className="text-center py-12 text-muted-foreground"><LuGitPullRequest className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>No PRs yet</p></div>;
  }

  return (
    <div className="space-y-4">
      {prs.map((pr) => {
        const fc = pr.files_changed || [];
        const isExp = expanded[pr.id];
        const color = pr.status === 'open' ? 'text-green-500' : pr.status === 'merged' ? 'text-purple-500' : 'text-gray-500';
        return (
          <div key={pr.id} className="p-4 rounded-lg border border-border">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <LuGitPullRequest className={'h-4 w-4 ' + color} />
                  <h4 className="font-medium">{pr.title}</h4>
                  <Badge variant="outline" className={'status-' + pr.status}>{pr.status}</Badge>
                  {fc.length > 0 && <Badge variant="secondary"><LuFileCode className="h-3 w-3 mr-1" />{fc.length} files</Badge>}
                </div>
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <LuGitBranch className="h-3 w-3" />
                  <span className="font-mono text-xs">{pr.branch_name}</span>
                  <span>→</span>
                  <span className="font-mono text-xs">{pr.base_branch}</span>
                </div>
                {pr.github_pr_url && <a href={pr.github_pr_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"><FaGithub className="h-3 w-3" />GitHub<LuExternalLink className="h-3 w-3" /></a>}
                {fc.length > 0 && (
                  <div className="mt-3">
                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => toggle(pr.id)}><LuFileCode className="h-3 w-3 mr-1" />{isExp ? 'Hide' : 'View'} files</Button>
                    {isExp && <div className="mt-2"><FilesList files={fc} /></div>}
                  </div>
                )}
              </div>
              {pr.status === 'open' && <Button size="sm" variant="outline"><LuCheck className="h-4 w-4 mr-1" />Merge</Button>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ProjectDetailPage() {
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

  const fetchData = useCallback(() => {
    Promise.all([api.get('/projects/' + projectId), api.get('/projects/' + projectId + '/tasks'), api.get('/projects/' + projectId + '/prs')])
      .then(r => { setProject(r[0].data); setTasks(r[1].data); setPrs(r[2].data); })
      .catch(() => { toast.error('Failed to load'); navigate('/projects'); })
      .finally(() => setIsLoading(false));
  }, [api, projectId, navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAnalyze = () => {
    setAnalyzing(true);
    api.post('/projects/' + projectId + '/analyze').then(r => { setProject(p => ({ ...p, summary: r.data.summary, status: 'ready' })); toast.success('Done!'); }).catch(() => toast.error('Failed')).finally(() => setAnalyzing(false));
  };

  const handleCreateTask = () => {
    if (!newTaskTitle.trim()) return;
    setCreatingTask(true);
    api.post('/projects/' + projectId + '/tasks', { title: newTaskTitle, description: newTaskDescription, priority: newTaskPriority })
      .then(r => { setTasks(p => [r.data, ...p]); setTaskDialogOpen(false); setNewTaskTitle(''); setNewTaskDescription(''); toast.success('Created!'); })
      .catch(() => toast.error('Failed')).finally(() => setCreatingTask(false));
  };

  const handleExecuteTask = (id) => {
    setExecutingTaskId(id);
    toast.info('AI working...');
    api.post('/projects/' + projectId + '/tasks/' + id + '/execute')
      .then(r => {
        setTasks(p => p.map(t => t.id === id ? { ...t, status: 'completed', ai_response: r.data.ai_response, files_changed: r.data.files_changed || [], pr_id: r.data.pr_id } : t));
        if (r.data.pr_id) api.get('/projects/' + projectId + '/prs').then(x => setPrs(x.data));
        toast.success('Completed!');
      })
      .catch(() => { toast.error('Failed'); setTasks(p => p.map(t => t.id === id ? { ...t, status: 'failed' } : t)); })
      .finally(() => setExecutingTaskId(null));
  };

  const handleDeleteTask = (id) => {
    api.delete('/projects/' + projectId + '/tasks/' + id).then(() => { setTasks(p => p.filter(t => t.id !== id)); toast.success('Deleted'); }).catch(() => toast.error('Failed'));
  };

  const handleDeleteProject = () => {
    api.delete('/projects/' + projectId).then(() => { toast.success('Deleted'); navigate('/projects'); }).catch(() => toast.error('Failed'));
  };

  if (isLoading) return <div className="min-h-screen pt-20 noise-bg"><div className="max-w-6xl mx-auto px-4 py-8"><Skeleton className="h-8 w-48 mb-6" /><Skeleton className="h-64" /></div></div>;

  const ts = project?.tech_stack || [];
  const pn = project?.name || '';
  const ps = project?.status || '';
  const psum = project?.summary || '';
  const pd = project?.description || 'No description';
  const pst = project?.source_type || '';
  const pca = project?.created_at ? new Date(project.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '';
  const pfc = project?.file_count || 0;
  const go = project?.github_owner || '';
  const gr = project?.github_repo || '';

  return (
    <div className="min-h-screen pt-20 noise-bg" data-testid="project-detail-page">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/projects')}><LuArrowLeft className="h-5 w-5" /></Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{pn}</h1>
              <Badge variant="outline" className={'status-' + ps}>{ps}</Badge>
              {pst === 'github' && <Badge variant="secondary" className="gap-1"><FaGithub className="h-3 w-3" />GitHub</Badge>}
            </div>
            {go && <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1"><FaGithub className="h-4 w-4" />{go}/{gr}</div>}
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild><Button variant="destructive" size="sm" className="gap-2"><LuTrash2 className="h-4 w-4" />Delete</Button></AlertDialogTrigger>
            <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete?</AlertDialogTitle><AlertDialogDescription>Permanently delete project?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteProject}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
          </AlertDialog>
        </div>
        <TechBadges techStack={ts} />
        {ts.length > 0 && <Badge variant="secondary" className="gap-1 mb-6"><LuFileCode className="h-3 w-3" />{pfc} files</Badge>}
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
                    {!psum && <Button size="sm" onClick={handleAnalyze} disabled={analyzing} className="gap-2">{analyzing ? <LuLoader className="h-4 w-4 animate-spin" /> : <LuSparkles className="h-4 w-4" />}{analyzing ? 'Analyzing...' : 'Analyze'}</Button>}
                  </div>
                  <CardDescription>Summary</CardDescription>
                </CardHeader>
                <CardContent>{psum ? <ScrollArea className="h-64"><div className="whitespace-pre-wrap text-sm text-muted-foreground pr-4">{psum}</div></ScrollArea> : <div className="text-center py-8 text-muted-foreground"><LuBrain className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>Click Analyze</p></div>}</CardContent>
              </Card>
              <Card><CardHeader><CardTitle className="text-lg">Details</CardTitle></CardHeader><CardContent className="space-y-4"><div><p className="text-sm text-muted-foreground">Description</p><p className="mt-1">{pd}</p></div><div><p className="text-sm text-muted-foreground">Source</p><p className="mt-1 capitalize">{pst}</p></div><div><p className="text-sm text-muted-foreground">Created</p><p className="mt-1">{pca}</p></div></CardContent></Card>
            </div>
          </TabsContent>
          <TabsContent value="tasks">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div><CardTitle className="text-lg">Tasks</CardTitle><CardDescription>AI generates code and PRs</CardDescription></div>
                  <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
                    <DialogTrigger asChild><Button className="gap-2"><LuPlus className="h-4 w-4" />Add Task</Button></DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>New Task</DialogTitle><DialogDescription>What to implement</DialogDescription></DialogHeader>
                      <div className="space-y-4 py-4">
                        <div><label className="text-sm font-medium">Title</label><Input value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} placeholder="Add auth" /></div>
                        <div><label className="text-sm font-medium">Description</label><Textarea value={newTaskDescription} onChange={e => setNewTaskDescription(e.target.value)} rows={3} placeholder="Details..." /></div>
                        <div><label className="text-sm font-medium">Priority</label><Select value={newTaskPriority} onValueChange={setNewTaskPriority}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem></SelectContent></Select></div>
                      </div>
                      <DialogFooter><Button variant="outline" onClick={() => setTaskDialogOpen(false)}>Cancel</Button><Button onClick={handleCreateTask} disabled={!newTaskTitle.trim() || creatingTask}>{creatingTask && <LuLoader className="h-4 w-4 animate-spin mr-2" />}Create</Button></DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent><TasksList tasks={tasks} onExecute={handleExecuteTask} onDelete={handleDeleteTask} executingTaskId={executingTaskId} /></CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="prs">
            <Card><CardHeader><CardTitle className="text-lg">Pull Requests</CardTitle><CardDescription>AI-generated PRs</CardDescription></CardHeader><CardContent><PRsList prs={prs} /></CardContent></Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default ProjectDetailPage;
