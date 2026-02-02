import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { FaGithub, FaLaravel, FaVuejs } from 'react-icons/fa';
import { SiFlutter } from 'react-icons/si';
import { 
  LuGitPullRequest, 
  LuCheckSquare, 
  LuZap, 
  LuBrain,
  LuArrowRight,
  LuUpload,
  LuSparkles
} from 'react-icons/lu';

const features = [
  {
    icon: FaGithub,
    title: 'GitHub Integration',
    description: 'Connect your repositories and let AI analyze your codebase instantly.',
  },
  {
    icon: LuUpload,
    title: 'Project Upload',
    description: 'Upload ZIP files for projects not on GitHub. Full offline support.',
  },
  {
    icon: LuBrain,
    title: 'AI Analysis',
    description: 'Get instant project summaries, architecture insights, and improvement suggestions.',
  },
  {
    icon: LuCheckSquare,
    title: 'Task Management',
    description: 'Create tasks and watch AI implement features, fix bugs, and refactor code.',
  },
  {
    icon: LuGitPullRequest,
    title: 'Automated PRs',
    description: 'AI creates pull requests with clear descriptions and diff previews.',
  },
  {
    icon: LuZap,
    title: 'Multiple AI Models',
    description: 'Switch between GPT-5.2 and Claude Sonnet 4.5 for different tasks.',
  },
];

const techStack = [
  { icon: FaLaravel, name: 'Laravel', color: 'text-red-500' },
  { icon: FaVuejs, name: 'Vue.js', color: 'text-emerald-500' },
  { icon: SiFlutter, name: 'Flutter', color: 'text-cyan-500' },
];

export const LandingPage = () => {
  return (
    <div className="min-h-screen noise-bg">
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.15)_0%,rgba(9,9,11,0)_70%)]" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary">
                <LuSparkles className="h-4 w-4" />
                AI-Powered Development
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
                Your AI <span className="text-primary">Software Developer</span> Companion
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-xl">
                Connect your GitHub repos or upload projects. Create tasks, and let AI implement features, 
                fix bugs, and create pull requests—all with GPT-5.2 and Claude Sonnet 4.5.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/register">
                  <Button size="lg" className="gap-2 w-full sm:w-auto" data-testid="hero-get-started">
                    Get Started Free
                    <LuArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto" data-testid="hero-sign-in">
                    <FaGithub className="h-5 w-5" />
                    Sign in with GitHub
                  </Button>
                </Link>
              </div>

              <div className="pt-4">
                <p className="text-sm text-muted-foreground mb-3">Optimized for</p>
                <div className="flex items-center gap-6">
                  {techStack.map((tech) => (
                    <div key={tech.name} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                      <tech.icon className={`h-6 w-6 ${tech.color}`} />
                      <span className="text-sm font-medium">{tech.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="absolute -inset-4 bg-primary/5 rounded-3xl blur-3xl" />
              <Card className="relative overflow-hidden border-primary/20 glow-primary">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="ml-2 text-xs text-muted-foreground font-mono">devai-terminal</span>
                    </div>
                    <div className="font-mono text-sm space-y-2 text-muted-foreground">
                      <p><span className="text-green-500">$</span> devai analyze ./my-laravel-app</p>
                      <p className="text-primary">✓ Detected Laravel 10 project</p>
                      <p className="text-primary">✓ Found 47 controllers, 23 models</p>
                      <p className="text-primary">✓ Vue.js frontend detected</p>
                      <p className="text-muted-foreground mt-4"><span className="text-green-500">$</span> devai task "Add user authentication"</p>
                      <p className="text-yellow-500">⚡ Processing with GPT-5.2...</p>
                      <p className="text-primary">✓ Created branch: feature/user-auth</p>
                      <p className="text-primary">✓ Generated 5 files</p>
                      <p className="text-primary">✓ Pull request #42 created</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything you need for AI-powered development
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From project analysis to pull request creation, DevAI handles the heavy lifting so you can focus on what matters.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={feature.title} 
                className="card-hover border-border/50 bg-card/50"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="p-12 rounded-2xl bg-primary/5 border border-primary/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.1)_0%,transparent_70%)]" />
            <div className="relative space-y-6">
              <h2 className="text-3xl sm:text-4xl font-bold">
                Ready to supercharge your development?
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Join developers using AI to build better software faster. Start with your first project today.
              </p>
              <Link to="/register">
                <Button size="lg" className="gap-2" data-testid="cta-get-started">
                  Start Building
                  <LuArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">D</span>
              </div>
              <span className="font-semibold">DevAI</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 DevAI. Built for developers who ship fast.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
