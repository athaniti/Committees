import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { FileText, Upload, Download, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId } from '../../utils/supabase/info';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface FileRecord {
  id: string;
  fileName: string;
  category: string;
  uploadedBy: string;
  uploadedAt: string;
  size: number;
  type: string;
  url: string;
}

interface FilesSectionProps {
  user: User;
  getAccessToken: () => Promise<string | undefined>;
}

export function FilesSection({ user, getAccessToken }: FilesSectionProps) {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const token = await getAccessToken();
      if (!token) return;

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-07da4527/files`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFiles(data);
      } else {
        toast.error('Σφάλμα φόρτωσης αρχείων');
      }
    } catch (error) {
      console.error('Error fetching files:', error);
      toast.error('Σφάλμα φόρτωσης αρχείων');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const token = await getAccessToken();
      if (!token) return;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'general');

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-07da4527/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        toast.success('Το αρχείο ανέβηκε επιτυχώς');
        fetchFiles();
      } else {
        const errorData = await response.json();
        toast.error('Σφάλμα ανεβάσματος: ' + errorData.error);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Σφάλμα ανεβάσματος αρχείου');
    } finally {
      setUploading(false);
      // Reset input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      general: 'Γενικά',
      meetings: 'Συνεδριάσεις',
      documents: 'Έγγραφα',
      reports: 'Αναφορές'
    };
    return categories[category] || category;
  };

  if (loading) {
    return <div className="text-center py-8">Φόρτωση αρχείων...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Αρχεία</h2>
          <p className="text-gray-600">Διαχείριση αρχείων και εγγράφων</p>
        </div>
        <div className="flex gap-2">
          <label htmlFor="file-upload">
            <Button className="flex items-center gap-2" disabled={uploading} asChild>
              <span>
                <Upload className="h-4 w-4" />
                {uploading ? 'Ανέβασμα...' : 'Ανέβασμα Αρχείου'}
              </span>
            </Button>
          </label>
          <input
            id="file-upload"
            type="file"
            className="hidden"
            onChange={handleFileUpload}
            disabled={uploading}
          />
        </div>
      </div>

      <div className="grid gap-4">
        {files.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Δεν υπάρχουν αρχεία</p>
            </CardContent>
          </Card>
        ) : (
          files.map((file) => (
            <Card key={file.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <FileText className="h-8 w-8 text-blue-600" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{file.fileName}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Badge variant="outline">{getCategoryLabel(file.category)}</Badge>
                        <span>•</span>
                        <span>{formatFileSize(file.size)}</span>
                        <span>•</span>
                        <span>{new Date(file.uploadedAt).toLocaleDateString('el-GR')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(file.url, '_blank')}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = file.url;
                        link.download = file.fileName;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}