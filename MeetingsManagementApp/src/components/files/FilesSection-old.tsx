import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { 
  FileText, Upload, Download, Trash2, Eye, Search, 
  FolderOpen, Grid, List, Filter, Plus, File,
  FileImage, FileVideo, Archive, UserIcon,
  ImageIcon, Video, Music
} from 'lucide-react';
import { User } from '../../utils/auth';
import { fileAPI, File as ApiFile } from '../../utils/api';

interface FilesSectionProps {
  user: User;
  getAccessToken?: () => Promise<string | undefined>;
}

// Mock data για αρχεία
const mockFiles: FileRecord[] = [
  {
    id: 1,
    fileName: "meeting_minutes_2025_09_15.pdf",
    originalName: "Πρακτικά Συνεδρίασης 15-09-2025.pdf",
    category: "meetings",
    uploadedBy: "Γραμματεία",
    uploadedAt: "2025-09-15T14:30:00Z",
    size: 2485760, // 2.4 MB
    type: "application/pdf",
    description: "Πρακτικά της τακτικής συνεδρίασης του Διοικητικού Συμβουλίου",
    tags: ["πρακτικά", "συνεδρίαση", "διοικητικό"],
    downloadCount: 23,
    isPublic: true
  },
  {
    id: 2,
    fileName: "annual_report_2024.docx",
    originalName: "Ετήσια Έκθεση 2024.docx",
    category: "reports",
    uploadedBy: "Διεύθυνση",
    uploadedAt: "2025-09-10T10:15:00Z",
    size: 5242880, // 5 MB
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    description: "Αναλυτική ετήσια έκθεση δραστηριοτήτων και οικονομικών στοιχείων",
    tags: ["έκθεση", "ετήσια", "οικονομικά"],
    downloadCount: 45,
    isPublic: true
  },
  {
    id: 3,
    fileName: "budget_proposal_2026.xlsx",
    originalName: "Πρόταση Προϋπολογισμού 2026.xlsx",
    category: "documents",
    uploadedBy: "Οικονομικό Τμήμα",
    uploadedAt: "2025-09-08T16:45:00Z",
    size: 1048576, // 1 MB
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    description: "Προτεινόμενος προϋπολογισμός για το έτος 2026",
    tags: ["προϋπολογισμός", "2026", "οικονομικά"],
    downloadCount: 12,
    isPublic: false
  },
  {
    id: 4,
    fileName: "committee_photo_2025.jpg",
    originalName: "Φωτογραφία Επιτροπής 2025.jpg",
    category: "images",
    uploadedBy: "Δημόσιες Σχέσεις",
    uploadedAt: "2025-09-05T12:00:00Z",
    size: 3145728, // 3 MB
    type: "image/jpeg",
    description: "Επίσημη φωτογραφία των μελών της επιτροπής",
    tags: ["φωτογραφία", "επιτροπή", "μέλη"],
    downloadCount: 8,
    isPublic: true
  },
  {
    id: 5,
    fileName: "training_video_2025.mp4",
    originalName: "Εκπαιδευτικό Βίντεο 2025.mp4",
    category: "videos",
    uploadedBy: "Εκπαίδευση",
    uploadedAt: "2025-09-01T09:30:00Z",
    size: 52428800, // 50 MB
    type: "video/mp4",
    description: "Εκπαιδευτικό βίντεο για νέα μέλη",
    tags: ["εκπαίδευση", "βίντεο", "νέα μέλη"],
    downloadCount: 34,
    isPublic: true
  }
];

const categories = [
  { id: 'all', label: 'Όλα', icon: FolderOpen },
  { id: 'meetings', label: 'Συνεδριάσεις', icon: FileText },
  { id: 'documents', label: 'Έγγραφα', icon: File },
  { id: 'reports', label: 'Αναφορές', icon: FileText },
  { id: 'images', label: 'Εικόνες', icon: FileImage },
  { id: 'videos', label: 'Βίντεο', icon: FileVideo },
  { id: 'general', label: 'Γενικά', icon: Archive }
];

export function FilesSection({ user, getAccessToken }: FilesSectionProps) {
  const [files, setFiles] = useState<FileRecord[]>(mockFiles);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [newFile, setNewFile] = useState({
    category: 'general' as FileRecord['category'],
    description: '',
    tags: '',
    isPublic: true
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Φίλτρα αρχείων
  const filteredFiles = files.filter(file => {
    const matchesSearch = file.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || file.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Προσομοίωση upload στο API
      const newFileRecord: FileRecord = {
        id: files.length + 1,
        fileName: `file_${Date.now()}_${file.name}`,
        originalName: file.name,
        category: newFile.category,
        uploadedBy: user.name,
        uploadedAt: new Date().toISOString(),
        size: file.size,
        type: file.type,
        description: newFile.description,
        tags: newFile.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        downloadCount: 0,
        isPublic: newFile.isPublic
      };

      setFiles(prev => [newFileRecord, ...prev]);
      alert('Το αρχείο ανέβηκε επιτυχώς');
      setUploadDialogOpen(false);
      setNewFile({
        category: 'general',
        description: '',
        tags: '',
        isPublic: true
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Σφάλμα ανεβάσματος αρχείου');
    } finally {
      setUploading(false);
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

  const getCategoryInfo = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId) || categories[0];
  };

  const getFileTypeIcon = (type: string, category: string) => {
    if (type.startsWith('image/')) return <FileImage className="h-8 w-8 text-green-500" />;
    if (type.startsWith('video/')) return <FileVideo className="h-8 w-8 text-purple-500" />;
    if (type.includes('pdf')) return <FileText className="h-8 w-8 text-red-500" />;
    if (type.includes('word') || type.includes('document')) return <FileText className="h-8 w-8 text-blue-500" />;
    if (type.includes('sheet') || type.includes('excel')) return <FileText className="h-8 w-8 text-green-600" />;
    return <File className="h-8 w-8 text-gray-500" />;
  };

  const handleDownload = (file: FileRecord) => {
    // Προσομοίωση download - στην πραγματικότητα θα καλούσε το API
    console.log('Downloading file:', file.fileName);
    alert(`Λήψη αρχείου: ${file.originalName}`);
    
    // Ενημέρωση του download count
    setFiles(prev => prev.map(f => 
      f.id === file.id ? { ...f, downloadCount: f.downloadCount + 1 } : f
    ));
  };

  const handleDelete = (fileId: number) => {
    if (confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το αρχείο;')) {
      setFiles(prev => prev.filter(f => f.id !== fileId));
      alert('Το αρχείο διαγράφηκε επιτυχώς');
    }
  };

  // Στατιστικά
  const stats = {
    total: files.length,
    totalSize: files.reduce((sum, file) => sum + file.size, 0),
    byCategory: categories.slice(1).map(cat => ({
      ...cat,
      count: files.filter(f => f.category === cat.id).length
    })),
    totalDownloads: files.reduce((sum, file) => sum + file.downloadCount, 0)
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FolderOpen className="h-6 w-6 text-blue-600" />
            Διαχείριση Αρχείων
          </h2>
          <p className="text-gray-600 mt-1">
            Ανέβασμα, οργάνωση και διαχείριση αρχείων της επιτροπής
          </p>
        </div>
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Ανέβασμα Αρχείου
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Ανέβασμα Νέου Αρχείου</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file-input">Επιλογή Αρχείου</Label>
                <input
                  ref={fileInputRef}
                  id="file-input"
                  type="file"
                  onChange={handleFileUpload}
                  className="w-full p-2 border rounded-md"
                  disabled={uploading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Κατηγορία</Label>
                <select
                  id="category"
                  value={newFile.category}
                  onChange={(e) => setNewFile({ ...newFile, category: e.target.value as FileRecord['category'] })}
                  className="w-full p-2 border rounded-md"
                >
                  {categories.slice(1).map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Περιγραφή</Label>
                <textarea
                  id="description"
                  value={newFile.description}
                  onChange={(e) => setNewFile({ ...newFile, description: e.target.value })}
                  placeholder="Περιγραφή του αρχείου..."
                  rows={3}
                  className="w-full p-2 border rounded-md"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Ετικέτες (χωρισμένες με κόμμα)</Label>
                <Input
                  id="tags"
                  value={newFile.tags}
                  onChange={(e) => setNewFile({ ...newFile, tags: e.target.value })}
                  placeholder="π.χ. πρακτικά, συνεδρίαση, διοικητικό"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is-public"
                  checked={newFile.isPublic}
                  onChange={(e) => setNewFile({ ...newFile, isPublic: e.target.checked })}
                />
                <Label htmlFor="is-public">Δημόσιο αρχείο (προσβάσιμο σε όλα τα μέλη)</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setUploadDialogOpen(false)}
                  disabled={uploading}
                >
                  Ακύρωση
                </Button>
                <Button 
                  onClick={() => fileInputRef.current?.click()} 
                  disabled={uploading}
                >
                  {uploading ? 'Ανέβασμα...' : 'Ανέβασμα'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Συνολικά Αρχεία</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatFileSize(stats.totalSize)}
            </div>
            <div className="text-sm text-gray-600">Συνολικό Μέγεθος</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.totalDownloads}</div>
            <div className="text-sm text-gray-600">Συνολικές Λήψεις</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {files.filter(f => f.isPublic).length}
            </div>
            <div className="text-sm text-gray-600">Δημόσια Αρχεία</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Αναζήτηση αρχείων..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4 mr-2" />
                Λίστα
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4 mr-2" />
                Grid
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const Icon = category.icon;
          const isActive = selectedCategory === category.id;
          const count = category.id === 'all' ? files.length : files.filter(f => f.category === category.id).length;
          
          return (
            <Button
              key={category.id}
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="flex items-center gap-2"
            >
              <Icon className="h-4 w-4" />
              {category.label} ({count})
            </Button>
          );
        })}
      </div>

      {/* Files List/Grid */}
      {filteredFiles.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <FolderOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Δεν βρέθηκαν αρχεία
            </h3>
            <p className="text-gray-600">
              Δοκιμάστε να αλλάξετε τα κριτήρια αναζήτησης ή τις κατηγορίες.
            </p>
          </CardContent>
        </Card>
      ) : viewMode === 'list' ? (
        <div className="space-y-4">
          {filteredFiles.map((file) => (
            <Card key={file.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    {getFileTypeIcon(file.type, file.category)}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-lg">{file.originalName}</h3>
                      {file.description && (
                        <p className="text-gray-600 text-sm mt-1">{file.description}</p>
                      )}
                      
                      <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                        <Badge variant="secondary">
                          {getCategoryInfo(file.category).label}
                        </Badge>
                        <span>{formatFileSize(file.size)}</span>
                        <span>•</span>
                        <span>{new Date(file.uploadedAt).toLocaleDateString('el-GR')}</span>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <UserIcon className="h-3 w-3" />
                          {file.uploadedBy}
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Download className="h-3 w-3" />
                          {file.downloadCount} λήψεις
                        </div>
                        {!file.isPublic && (
                          <Badge variant="outline" className="text-xs">
                            Ιδιωτικό
                          </Badge>
                        )}
                      </div>

                      {file.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {file.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(file)}
                      title="Λήψη αρχείου"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => alert(`Προεπισκόπηση: ${file.originalName}`)}
                      title="Προεπισκόπηση"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {(user.role === 'admin' || file.uploadedBy === user.name) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(file.id)}
                        title="Διαγραφή αρχείου"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Grid View */
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredFiles.map((file) => (
            <Card key={file.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="mb-3">
                    {getFileTypeIcon(file.type, file.category)}
                  </div>
                  <h3 className="font-medium text-sm mb-2 line-clamp-2">{file.originalName}</h3>
                  
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>{formatFileSize(file.size)}</div>
                    <div>{new Date(file.uploadedAt).toLocaleDateString('el-GR')}</div>
                    <Badge variant="outline" className="text-xs">
                      {getCategoryInfo(file.category).label}
                    </Badge>
                  </div>

                  <div className="flex gap-1 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(file)}
                      className="flex-1"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => alert(`Προεπισκόπηση: ${file.originalName}`)}
                      className="flex-1"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    {(user.role === 'admin' || file.uploadedBy === user.name) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(file.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}