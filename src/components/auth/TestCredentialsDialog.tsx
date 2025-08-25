
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TestTube } from 'lucide-react';
import TestCredentialsGenerator from './TestCredentialsGenerator';

const TestCredentialsDialog: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="mt-4">
          <TestTube className="h-4 w-4 mr-2" />
          Generate Test Credentials
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Test Credentials Generator</DialogTitle>
        </DialogHeader>
        <TestCredentialsGenerator />
      </DialogContent>
    </Dialog>
  );
};

export default TestCredentialsDialog;
