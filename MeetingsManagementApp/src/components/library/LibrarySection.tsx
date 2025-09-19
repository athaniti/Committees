import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { 
  BookOpen, Search, FileText, Download, Eye, 
  Filter, Plus, Tag, Calendar, User as UserIcon
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { User } from '../../utils/auth';

interface LibrarySectionProps {
  user: User;
  getAccessToken: () => Promise<string | undefined>;
}

// Mock data για τη βιβλιοθήκη
const mockLibraryItems = [
  {
    id: 1,
    title: "Κώδικας Διοικητικής Διαδικασίας",
    description: "Νόμος 2690/1999 - Κώδικας Διοικητικής Διαδικασίας",
    category: "Νομοθεσία",
    tags: ["διοικητικό", "διαδικασία", "νόμος"],
    type: "PDF",
    size: "2.3 MB",
    uploadedBy: "Νομικό Τμήμα",
    uploadDate: "2024-01-15",
    downloadCount: 45
  },
  {
    id: 2,
    title: "Κανονισμός Λειτουργίας Επιτροπών",
    description: "Εσωτερικός κανονισμός για τη λειτουργία των επιτροπών",
    category: "Κανονισμοί",
    tags: ["επιτροπές", "κανονισμός", "λειτουργία"],
    type: "PDF",
    size: "1.8 MB",
    uploadedBy: "Γραμματεία",
    uploadDate: "2024-02-10",
    downloadCount: 32
  },
  {
    id: 3,
    title: "Οδηγός Διαχείρισης Εγγράφων",
    description: "Πρακτικός οδηγός για τη διαχείριση επισήμων εγγράφων",
    category: "Οδηγοί",
    tags: ["έγγραφα", "διαχείριση", "οδηγός"],
    type: "DOCX",
    size: "956 KB",
    uploadedBy: "Διοίκηση",
    uploadDate: "2024-03-05",
    downloadCount: 18
  },
  {
    id: 4,
    title: "Πρότυπα Αποφάσεων",
    description: "Συλλογή προτύπων για τη σύνταξη αποφάσεων",
    category: "Πρότυπα",
    tags: ["αποφάσεις", "πρότυπα", "σύνταξη"],
    type: "ZIP",
    size: "3.2 MB",
    uploadedBy: "Νομικό Τμήμα",
    uploadDate: "2024-03-20",
    downloadCount: 67
  }
];

const categories = ["Όλα", "Νομοθεσία", "Κανονισμοί", "Οδηγοί", "Πρότυπα"];

export function LibrarySection({ user, getAccessToken }: LibrarySectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Όλα');

  // Φίλτρα για τα αποτελέσματα
  const filteredItems = mockLibraryItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'Όλα' || item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getFileIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return <FileText className="h-8 w-8 text-red-500" />;
      case 'docx':
        return <FileText className="h-8 w-8 text-blue-500" />;
      case 'zip':
        return <FileText className="h-8 w-8 text-gray-500" />;
      default:
        return <FileText className="h-8 w-8 text-gray-400" />;
    }
  };

  const handleDownload = (item: typeof mockLibraryItems[0]) => {
    // Προσομοίωση download
    console.log('Downloading:', item.title);
    alert(`Λήψη αρχείου: ${item.title}`);
  };

  const handlePreview = (item: typeof mockLibraryItems[0]) => {
    // Προσομοίωση preview
    console.log('Previewing:', item.title);
    alert(`Προεπισκόπηση αρχείου: ${item.title}`);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-blue-600" />
            Βιβλιοθήκη Εγγράφων
          </h2>
          <p className="text-gray-600 mt-1">
            Οργανωμένη συλλογή νομοθεσίας, κανονισμών και εγγράφων
          </p>
        </div>
        {user.role === 'admin' && (
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Προσθήκη Εγγράφου
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Αναζήτηση εγγράφων, τίτλων, ετικετών..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Φίλτρα
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid w-full grid-cols-5">
            {categories.map((category) => (
              <TabsTrigger key={category} value={category} className="text-xs">
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{mockLibraryItems.length}</div>
            <div className="text-sm text-gray-600">Συνολικά Έγγραφα</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {mockLibraryItems.filter(item => item.category === "Νομοθεσία").length}
            </div>
            <div className="text-sm text-gray-600">Νομοθεσία</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {mockLibraryItems.filter(item => item.category === "Κανονισμοί").length}
            </div>
            <div className="text-sm text-gray-600">Κανονισμοί</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {mockLibraryItems.reduce((sum, item) => sum + item.downloadCount, 0)}
            </div>
            <div className="text-sm text-gray-600">Συνολικές Λήψεις</div>
          </CardContent>
        </Card>
      </div>

      {/* Documents Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredItems.map((item) => (
          <Card key={item.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {getFileIcon(item.type)}
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg leading-tight">{item.title}</CardTitle>
                    <CardDescription className="mt-1 line-clamp-2">
                      {item.description}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {/* Category and Type */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary">{item.category}</Badge>
                  <Badge variant="outline">{item.type}</Badge>
                  <span className="text-xs text-gray-500">{item.size}</span>
                </div>

                {/* Tags */}
                <div className="flex items-center gap-1 flex-wrap">
                  <Tag className="h-3 w-3 text-gray-400" />
                  {item.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Metadata */}
                <div className="text-xs text-gray-500 space-y-1">
                  <div className="flex items-center gap-1">
                    <UserIcon className="h-3 w-3" />
                    <span>Ανέβηκε από: {item.uploadedBy}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Ημερομηνία: {new Date(item.uploadDate).toLocaleDateString('el-GR')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Download className="h-3 w-3" />
                    <span>{item.downloadCount} λήψεις</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePreview(item)}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Προεπισκόπηση
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleDownload(item)}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Λήψη
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <BookOpen className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Δεν βρέθηκαν έγγραφα
            </h3>
            <p className="text-gray-600 mb-4">
              Δοκιμάστε να αλλάξετε τα κριτήρια αναζήτησης ή τις κατηγορίες.
            </p>
            <Button variant="outline" onClick={() => {
              setSearchTerm('');
              setSelectedCategory('Όλα');
            }}>
              Καθαρισμός Φίλτρων
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}