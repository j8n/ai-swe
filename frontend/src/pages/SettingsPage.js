import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { Separator } from '../components/ui/separator';
import { 
  LuLoader, 
  LuCheck, 
  LuExternalLink,
  LuSun,
  LuMoon,
  LuBrain
} from 'react-icons/lu';
import { FaGithub } from 'react-icons/fa';
import { toast } from 'sonner';

const aiModels = [
  { provider: 'openai', model: 'gpt-5.2', name: 'GPT-5.2', description: 'Latest OpenAI model' },
  { provider: 'anthropic', model: 'claude-sonnet-4-5-20250929', name: 'Claude Sonnet 4.5', description: 'Anthropic\'s balanced model' },
];

export const SettingsPage = () => {
  const { user, api, updateUser } = useAuth();
  const { theme, setTheme, isDark } = useTheme();
  
  const [settings, setSettings] = useState({
    ai_model: 'gpt-5.2',
    ai_provider: 'openai',
    theme: 'dark'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get('/settings');
        setSettings(response.data);
      } catch (error) {
        toast.error('Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, [api]);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await api.put('/settings', settings);
      toast.success('Settings saved!');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleModelChange = (value) => {
    const selected = aiModels.find(m => `${m.provider}:${m.model}` === value);
    if (selected) {
      setSettings(prev => ({
        ...prev,
        ai_provider: selected.provider,
        ai_model: selected.model
      }));
    }
  };

  const handleConnectGitHub = async () => {
    setIsConnecting(true);
    try {
      const response = await api.get('/github/auth-url');
      window.location.href = response.data.auth_url;
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to initiate GitHub connection';
      toast.error(message);
      setIsConnecting(false);
    }
  };

  const handleDisconnectGitHub = async () => {
    setIsDisconnecting(true);
    try {
      await api.post('/github/disconnect');
      updateUser({ github_connected: false, github_username: null });
      toast.success('GitHub disconnected');
    } catch (error) {
      toast.error('Failed to disconnect GitHub');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleThemeChange = (checked) => {
    const newTheme = checked ? 'dark' : 'light';
    setTheme(newTheme);
    setSettings(prev => ({ ...prev, theme: newTheme }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 noise-bg flex items-center justify-center">
        <LuLoader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 noise-bg" data-testid="settings-page">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account and AI preferences
          </p>
        </div>

        <div className="space-y-6">
          {/* Profile Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Profile</CardTitle>
              <CardDescription>Your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  {user?.avatar_url ? (
                    <img 
                      src={user.avatar_url} 
                      alt={user.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-primary">
                      {user?.name?.charAt(0)?.toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-lg">{user?.name}</p>
                  <p className="text-muted-foreground">{user?.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* GitHub Integration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FaGithub className="h-5 w-5" />
                GitHub Integration
              </CardTitle>
              <CardDescription>
                Connect your GitHub account to import repositories
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user?.github_connected ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                      <LuCheck className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium">Connected</p>
                      <p className="text-sm text-muted-foreground">
                        @{user.github_username}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={handleDisconnectGitHub}
                    disabled={isDisconnecting}
                    data-testid="disconnect-github-btn"
                  >
                    {isDisconnecting ? (
                      <LuLoader className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Disconnect
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Not connected</p>
                    <p className="text-sm text-muted-foreground">
                      Connect to import repositories
                    </p>
                  </div>
                  <Button 
                    onClick={handleConnectGitHub}
                    disabled={isConnecting}
                    className="gap-2"
                    data-testid="connect-github-btn"
                  >
                    {isConnecting ? (
                      <LuLoader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FaGithub className="h-4 w-4" />
                    )}
                    Connect GitHub
                  </Button>
                </div>
              )}

              <div className="mt-4 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                <p>
                  DevAI needs <Badge variant="outline">repo</Badge> and <Badge variant="outline">user</Badge> scopes 
                  to read your repositories and create pull requests.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* AI Model Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <LuBrain className="h-5 w-5" />
                AI Model
              </CardTitle>
              <CardDescription>
                Choose which AI model to use for code analysis and task execution
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Active Model</Label>
                <Select 
                  value={`${settings.ai_provider}:${settings.ai_model}`}
                  onValueChange={handleModelChange}
                >
                  <SelectTrigger data-testid="ai-model-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {aiModels.map((model) => (
                      <SelectItem 
                        key={`${model.provider}:${model.model}`}
                        value={`${model.provider}:${model.model}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{model.name}</span>
                          <span className="text-muted-foreground">- {model.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                {aiModels.map((model) => (
                  <div
                    key={`${model.provider}:${model.model}`}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      settings.ai_provider === model.provider && settings.ai_model === model.model
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => handleModelChange(`${model.provider}:${model.model}`)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">{model.name}</p>
                      {settings.ai_provider === model.provider && settings.ai_model === model.model && (
                        <Badge>Active</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{model.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Appearance</CardTitle>
              <CardDescription>
                Customize how DevAI looks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isDark ? (
                    <LuMoon className="h-5 w-5" />
                  ) : (
                    <LuSun className="h-5 w-5" />
                  )}
                  <div>
                    <p className="font-medium">Dark Mode</p>
                    <p className="text-sm text-muted-foreground">
                      {isDark ? 'Currently using dark theme' : 'Currently using light theme'}
                    </p>
                  </div>
                </div>
                <Switch 
                  checked={isDark}
                  onCheckedChange={handleThemeChange}
                  data-testid="theme-switch"
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button 
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="gap-2"
              data-testid="save-settings-btn"
            >
              {isSaving ? (
                <LuLoader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LuCheck className="h-4 w-4" />
              )}
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
