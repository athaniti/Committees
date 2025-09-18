import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

export function DebugInfo() {
  const [backendStatus, setBackendStatus] = useState<string>('Testing...');
  const [accountsInfo, setAccountsInfo] = useState<any>(null);
  const [supabaseStatus, setSupabaseStatus] = useState<string>('Testing...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    testBackend();
  }, []);

  const testBackend = async () => {
    try {
      console.log('Testing backend with project ID:', projectId);
      console.log('Using anon key:', publicAnonKey?.substring(0, 20) + '...');
      
      // Test Supabase client first
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(`https://${projectId}.supabase.co`, publicAnonKey);
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          setSupabaseStatus('❌ Supabase client error');
          console.error('Supabase client error:', error);
        } else {
          setSupabaseStatus('✅ Supabase client OK');
          console.log('Supabase client working');
        }
      } catch (supabaseError) {
        setSupabaseStatus('❌ Supabase client failed');
        console.error('Supabase client test failed:', supabaseError);
      }
      
      // First test simple test endpoint
      try {
        const testResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/test`);
        console.log('Test endpoint status:', testResponse.status);
        
        if (testResponse.ok) {
          const testData = await testResponse.json();
          console.log('Test endpoint working:', testData);
        }
      } catch (testError) {
        console.error('Test endpoint failed:', testError);
      }
      
      // Test health endpoint
      const healthResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-07da4527/health`);
      
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        setBackendStatus('✅ Backend is healthy');
        console.log('Backend health check successful:', healthData);

        // Test accounts endpoint
        try {
          const accountsResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-07da4527/debug/accounts`);
          if (accountsResponse.ok) {
            const accountsData = await accountsResponse.json();
            setAccountsInfo(accountsData);
            console.log('Demo accounts info:', accountsData);
          } else {
            console.error('Failed to fetch accounts info:', accountsResponse.status);
          }
        } catch (accountsError) {
          console.error('Accounts check failed:', accountsError);
        }
      } else {
        setBackendStatus(`❌ Backend error: ${healthResponse.status}`);
        const errorText = await healthResponse.text();
        setError(`HTTP ${healthResponse.status}: ${errorText}`);
        console.error('Backend health check failed:', healthResponse.status, errorText);
        
        // Additional debugging
        console.log('Response headers:', Object.fromEntries(healthResponse.headers.entries()));
      }
    } catch (error) {
      setBackendStatus('❌ Backend connection failed');
      setError((error as Error).message);
      console.error('Backend connection test failed:', error);
    }
  };

  const recreateAccounts = async () => {
    try {
      console.log('Recreating demo accounts...');
      setBackendStatus('🔄 Recreating accounts...');
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-07da4527/debug/recreate-accounts`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Accounts recreated successfully:', data);
        setBackendStatus('✅ Accounts recreated');
        // Refresh the info
        setTimeout(testBackend, 1000);
      } else {
        console.error('Failed to recreate accounts:', response.status);
        setBackendStatus('❌ Failed to recreate accounts');
      }
    } catch (error) {
      console.error('Recreate accounts error:', error);
      setBackendStatus('❌ Recreate failed');
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Debug Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <strong>Project ID:</strong> <span className="text-xs font-mono">{projectId}</span>
        </div>
        <div>
          <strong>Supabase Client:</strong> <Badge variant={supabaseStatus.includes('✅') ? 'default' : 'destructive'}>{supabaseStatus}</Badge>
        </div>
        <div>
          <strong>Backend Status:</strong> <Badge variant={backendStatus.includes('✅') ? 'default' : 'destructive'}>{backendStatus}</Badge>
        </div>
        <div>
          <strong>Demo Users Status:</strong> <Badge variant="secondary">
            {localStorage.getItem('demoUsersCreated') ? 'Created' : 'Not Created'}
          </Badge>
        </div>
        {accountsInfo && (
          <div>
            <strong>Backend Accounts:</strong> {accountsInfo.totalAccounts} found
            <div className="mt-2 text-sm space-y-1">
              {accountsInfo.accounts?.map((account: any, index: number) => (
                <div key={index} className="bg-gray-100 p-2 rounded text-xs">
                  {account.email} ({account.role})
                </div>
              ))}
            </div>
          </div>
        )}
        {error && (
          <div>
            <strong>Error:</strong> <span className="text-red-600 text-sm break-all">{error}</span>
          </div>
        )}
        <div className="flex gap-2 flex-wrap">
          <Button onClick={testBackend} size="sm">Refresh</Button>
          <Button onClick={recreateAccounts} size="sm" variant="outline">
            Recreate Backend
          </Button>
          <Button 
            onClick={() => {
              localStorage.removeItem('demoUsersCreated');
              window.location.reload();
            }} 
            size="sm" 
            variant="outline"
          >
            Reset Demo Users
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}