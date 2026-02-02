import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { 
  LuUpload, 
  LuLoader, 
  LuCheck,
  LuArrowLeft,
  LuFolderKanban,
  LuAlertCircle
} from 'react-icons/lu';
import { FaGithub, FaLaravel, FaVuejs } from 'react-icons/fa';
import { SiFlutter } from 'react-icons/si';
import { toast } from 'sonner';

export const NewProjectPage = () => {
  const { user, api } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('github');
  const [isLoading, setIsLoading] = useState(false);
  
  // Manual project state
  const [manualName, setManualName] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const [selectedTech, setSelectedTech] = useState([]);

  // GitHub state
  const [repos, setRepos] = useState([]);
  const [reposLoading, setReposLoading] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [repoSearch, setRepoSearch] = useState('');

  // Upload state
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');

  const techOptions = [
    { name: 'Laravel', icon: FaLaravel, color: 'text-red-500' },
    { name: 'Vue.js', icon: FaVuejs, color: 'text-emerald-500' },
    { name: 'Flutter', icon: SiFlutter, color: 'text-cyan-500' },
  ];

  useEffect(() => {
    if (user?.github_connected && activeTab === 'github') {
      fetchRepos();
    }
  }, [user?.github_connected, activeTab]);

  const fetchRepos = async () => {
    setReposLoading(true);
    try {
      const response = await api.get('/github/repos');
      setRepos(response.data);
    } catch (error) {
      toast.error('Failed to fetch repositories');
    } finally {
      setReposLoading(false);
    }
  };

  const filteredRepos = repos.filter(repo =>
    repo.name.toLowerCase().includes(repoSearch.toLowerCase()) ||
    repo.full_name.toLowerCase().includes(repoSearch.toLowerCase())
  );

  const handleGitHubSubmit = async () => {
    if (!selectedRepo) {
      toast.error('Please select a repository');
      return;
    }
    
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('owner', selectedRepo.full_name.split('/')[0]);
      formData.append('repo', selectedRepo.name);
      
      const response = await api.post('/projects/from-github', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success('Project created successfully!');
      navigate(`/projects/${response.data.id}`);
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to create project';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadSubmit = async () => {
    if (!uploadFile || !uploadName) {
      toast.error('Please provide a name and upload a ZIP file');
      return;
    }
    
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('name', uploadName);
      formData.append('description', uploadDescription);
      
      const response = await api.post('/projects/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success('Project uploaded successfully!');
      navigate(`/projects/${response.data.id}`);
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to upload project';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!manualName) {
      toast.error('Please provide a project name');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await api.post('/projects', {
        name: manualName,
        description: manualDescription,
        tech_stack: selectedTech
      });
      
      toast.success('Project created successfully!');
      navigate(`/projects/${response.data.id}`);
    } catch (error) {
      toast.error('Failed to create project');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 noise-bg" data-testid="new-project-page">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button 
          variant="ghost" 
          className="gap-2 mb-6"
          onClick={() => navigate('/projects')}
        >
          <LuArrowLeft className="h-4 w-4" />
          Back to Projects
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold">Create New Project</h1>
          <p className="text-muted-foreground mt-1">
            Connect a GitHub repository, upload a ZIP file, or create manually
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="github" className="gap-2" data-testid="tab-github">
              <FaGithub className="h-4 w-4" />
              GitHub
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-2" data-testid="tab-upload">
              <LuUpload className="h-4 w-4" />
              Upload ZIP
            </TabsTrigger>
            <TabsTrigger value="manual" className="gap-2" data-testid="tab-manual">
              <LuFolderKanban className="h-4 w-4" />
              Manual
            </TabsTrigger>
          </TabsList>

          {/* GitHub Tab */}
          <TabsContent value="github">
            <Card>
              <CardHeader>
                <CardTitle>Import from GitHub</CardTitle>
                <CardDescription>
                  Select a repository from your GitHub account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!user?.github_connected ? (
                  <div className="text-center py-8">
                    <FaGithub className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">
                      Connect your GitHub account to import repositories
                    </p>
                    <Button onClick={() => navigate('/settings')} data-testid="connect-github-btn">
                      Connect GitHub
                    </Button>
                  </div>
                ) : (
                  <>
                    <Input
                      placeholder="Search repositories..."
                      value={repoSearch}
                      onChange={(e) => setRepoSearch(e.target.value)}
                      data-testid="repo-search"
                    />
                    
                    {reposLoading ? (
                      <div className="flex justify-center py-8">
                        <LuLoader className="h-6 w-6 animate-spin" />
                      </div>
                    ) : (
                      <div className="max-h-80 overflow-y-auto space-y-2">
                        {filteredRepos.map((repo) => (
                          <div
                            key={repo.id}
                            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                              selectedRepo?.id === repo.id 
                                ? 'border-primary bg-primary/5' 
                                : 'border-border hover:border-primary/50'
                            }`}
                            onClick={() => setSelectedRepo(repo)}
                            data-testid={`repo-${repo.name}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {selectedRepo?.id === repo.id ? (
                                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                    <LuCheck className="h-3 w-3 text-white" />
                                  </div>
                                ) : (
                                  <div className="w-5 h-5 rounded-full border-2 border-muted" />
                                )}
                                <div>
                                  <p className="font-medium">{repo.name}</p>
                                  <p className="text-xs text-muted-foreground">{repo.full_name}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {repo.language && (
                                  <Badge variant="outline" className="text-xs">
                                    {repo.language}
                                  </Badge>
                                )}
                                {repo.is_private && (
                                  <Badge variant="secondary" className="text-xs">Private</Badge>
                                )}
                              </div>
                            </div>
                            {repo.description && (
                              <p className="text-sm text-muted-foreground mt-2 ml-8 line-clamp-1">
                                {repo.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <Button 
                      className="w-full" 
                      disabled={!selectedRepo || isLoading}
                      onClick={handleGitHubSubmit}
                      data-testid="create-github-project"
                    >
                      {isLoading ? (
                        <>
                          <LuLoader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <FaGithub className="mr-2 h-4 w-4" />
                          Import Repository
                        </>
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload">
            <Card>
              <CardHeader>
                <CardTitle>Upload Project</CardTitle>
                <CardDescription>
                  Upload a ZIP file containing your project
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="upload-name">Project Name</Label>
                  <Input
                    id="upload-name"
                    placeholder="My Laravel App"
                    value={uploadName}
                    onChange={(e) => setUploadName(e.target.value)}
                    data-testid="upload-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="upload-description">Description (Optional)</Label>
                  <Textarea
                    id="upload-description"
                    placeholder="A brief description of your project..."
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    data-testid="upload-description"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Project ZIP File</Label>
                  <div 
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      uploadFile ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50'
                    }`}
                  >
                    <input
                      type="file"
                      accept=".zip"
                      onChange={(e) => setUploadFile(e.target.files?.[0])}
                      className="hidden"
                      id="file-upload"
                      data-testid="file-input"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      {uploadFile ? (
                        <div className="flex items-center justify-center gap-2">
                          <LuCheck className="h-5 w-5 text-primary" />
                          <span className="font-medium">{uploadFile.name}</span>
                        </div>
                      ) : (
                        <>
                          <LuUpload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            ZIP files only (max 50MB)
                          </p>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                  <LuAlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    We'll automatically detect Laravel, Vue.js, and Flutter projects. 
                    Make sure to include configuration files like composer.json, package.json, or pubspec.yaml.
                  </p>
                </div>

                <Button 
                  className="w-full" 
                  disabled={!uploadFile || !uploadName || isLoading}
                  onClick={handleUploadSubmit}
                  data-testid="upload-project-btn"
                >
                  {isLoading ? (
                    <>
                      <LuLoader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <LuUpload className="mr-2 h-4 w-4" />
                      Upload Project
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manual Tab */}
          <TabsContent value="manual">
            <Card>
              <CardHeader>
                <CardTitle>Create Manually</CardTitle>
                <CardDescription>
                  Create an empty project and add tasks directly
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="manual-name">Project Name</Label>
                  <Input
                    id="manual-name"
                    placeholder="My New Project"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    data-testid="manual-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manual-description">Description (Optional)</Label>
                  <Textarea
                    id="manual-description"
                    placeholder="A brief description of your project..."
                    value={manualDescription}
                    onChange={(e) => setManualDescription(e.target.value)}
                    data-testid="manual-description"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tech Stack</Label>
                  <div className="flex flex-wrap gap-2">
                    {techOptions.map((tech) => (
                      <Badge
                        key={tech.name}
                        variant={selectedTech.includes(tech.name) ? 'default' : 'outline'}
                        className="cursor-pointer gap-1 py-2 px-3"
                        onClick={() => {
                          setSelectedTech(prev => 
                            prev.includes(tech.name)
                              ? prev.filter(t => t !== tech.name)
                              : [...prev, tech.name]
                          );
                        }}
                        data-testid={`tech-${tech.name.toLowerCase()}`}
                      >
                        <tech.icon className={`h-4 w-4 ${selectedTech.includes(tech.name) ? '' : tech.color}`} />
                        {tech.name}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  disabled={!manualName || isLoading}
                  onClick={handleManualSubmit}
                  data-testid="create-manual-project"
                >
                  {isLoading ? (
                    <>
                      <LuLoader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Project'
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default NewProjectPage;
