import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LuLoader2 } from 'react-icons/lu';
import { toast } from 'sonner';

export const GitHubCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { api, updateUser } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');

      if (!code || !state) {
        toast.error('Invalid callback parameters');
        navigate('/settings');
        return;
      }

      try {
        const formData = new FormData();
        formData.append('code', code);
        formData.append('state', state);

        const response = await api.post('/github/callback', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        updateUser({ 
          github_connected: true, 
          github_username: response.data.github_username 
        });
        
        toast.success('GitHub connected successfully!');
        navigate('/settings');
      } catch (error) {
        const message = error.response?.data?.detail || 'Failed to connect GitHub';
        toast.error(message);
        navigate('/settings');
      }
    };

    handleCallback();
  }, [searchParams, navigate, api, updateUser]);

  return (
    <div className="min-h-screen flex items-center justify-center noise-bg">
      <div className="text-center">
        <LuLoader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Connecting GitHub...</p>
      </div>
    </div>
  );
};

export default GitHubCallbackPage;
