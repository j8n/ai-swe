import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Skeleton } from '../components/ui/skeleton';
import { 
  LuPlus, 
  LuSearch, 
  LuFolderKanban,
  LuGitBranch,
  LuUpload,
  LuFileCode
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

export const ProjectsListPage = () => {
  const { api } = useAuth();
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await api.get('/projects');
        setProjects(response.data);
      } catch (error) {
        toast.error('Failed to load projects');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjects();
  }, [api]);

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.tech_stack?.some(tech => tech.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 noise-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <Skeleton className="h-10 w-48" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 noise-bg" data-testid="projects-list-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Projects</h1>
            <p className="text-muted-foreground mt-1">
              {projects.length} project{projects.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Link to="/projects/new">
            <Button className="gap-2" data-testid="new-project-btn">
              <LuPlus className="h-4 w-4" />
              New Project
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 max-w-md"
            data-testid="search-projects"
          />
        </div>

        {/* Projects Grid */}
        {filteredProjects.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project, index) => (
              <Link key={project.id} to={`/projects/${project.id}`}>
                <Card 
                  className="card-hover h-full"
                  style={{ animationDelay: `${index * 50}ms` }}
                  data-testid={`project-card-${project.id}`}
                >
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        {project.source_type === 'github' ? (
                          <FaGithub className="h-6 w-6" />
                        ) : project.source_type === 'upload' ? (
                          <LuUpload className="h-6 w-6 text-primary" />
                        ) : (
                          <LuFolderKanban className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      <Badge variant="outline" className={`status-${project.status}`}>
                        {project.status}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="font-semibold text-lg">{project.name}</h3>
                      {project.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {project.tech_stack?.map((tech) => {
                        const Icon = techIcons[tech];
                        return (
                          <Badge key={tech} variant="outline" className="gap-1">
                            {Icon && <Icon className="h-3 w-3" />}
                            {tech}
                          </Badge>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t border-border">
                      <div className="flex items-center gap-1">
                        <LuFileCode className="h-4 w-4" />
                        {project.file_count} files
                      </div>
                      <span>{formatDate(project.updated_at)}</span>
                    </div>

                    {project.github_owner && project.github_repo && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <LuGitBranch className="h-3 w-3" />
                        {project.github_owner}/{project.github_repo}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <LuFolderKanban className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              {searchQuery ? (
                <>
                  <h3 className="text-lg font-semibold mb-2">No projects found</h3>
                  <p className="text-muted-foreground">
                    No projects match "{searchQuery}"
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first project to get started with AI development
                  </p>
                  <Link to="/projects/new">
                    <Button className="gap-2">
                      <LuPlus className="h-4 w-4" />
                      Create Project
                    </Button>
                  </Link>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ProjectsListPage;
