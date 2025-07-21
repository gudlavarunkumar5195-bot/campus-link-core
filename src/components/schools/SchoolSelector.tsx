
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, Calendar } from 'lucide-react';

interface School {
  id: string;
  name: string;
  slug: string;
  address?: string;
  contact_email?: string;
  logo_url?: string;
}

interface SchoolSelectorProps {
  schools: School[];
  onSchoolSelect: (school: School) => void;
  loading?: boolean;
}

const SchoolSelector: React.FC<SchoolSelectorProps> = ({ schools, onSchoolSelect, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-gray-300 rounded w-full"></div>
                <div className="h-3 bg-gray-300 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (schools.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Building2 className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Schools Found</h3>
          <p className="text-gray-600">Create your first school to get started.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {schools.map((school) => (
        <Card key={school.id} className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                {school.logo_url ? (
                  <img 
                    src={school.logo_url} 
                    alt={`${school.name} logo`}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                )}
                <div>
                  <CardTitle className="text-lg">{school.name}</CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {school.slug}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {school.address && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {school.address}
                </p>
              )}
              {school.contact_email && (
                <p className="text-sm text-gray-600">
                  {school.contact_email}
                </p>
              )}
              <Button 
                onClick={() => onSchoolSelect(school)}
                className="w-full"
              >
                Select School
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SchoolSelector;
