import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, DollarSign } from 'lucide-react';
import { useClasses } from '@/hooks/useDropdownData';

interface FeeHead {
  id: string;
  name: string;
  amount: number;
  description?: string;
}

interface FeeStructure {
  id: string;
  class_id: string;
  academic_year: string;
  fee_heads: any;
  total_amount: number;
  final_amount: number;
  is_active: boolean;
  classes?: {
    name: string;
    grade_level: number;
  };
}

const FeeStructureManagement: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: classes = [] } = useClasses();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFee, setEditingFee] = useState<FeeStructure | null>(null);

  const [formData, setFormData] = useState({
    class_id: '',
    academic_year: new Date().getFullYear().toString(),
    fee_heads: [
      { name: 'Tuition Fee', amount: 0 },
      { name: 'Development Fee', amount: 0 },
      { name: 'Activity Fee', amount: 0 },
      { name: 'Transport Fee', amount: 0 },
      { name: 'Examination Fee', amount: 0 }
    ],
    discount_percentage: 0,
  });

  // Fetch fee structures
  const { data: feeStructures, isLoading } = useQuery({
    queryKey: ['fee-structures'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fee_structures')
        .select(`
          *,
          classes!inner(name, grade_level)
        `)
        .order('academic_year', { ascending: false });
      
      if (error) throw error;
      return data as FeeStructure[];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      // Get current user's school_id
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('User not authenticated');

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.school_id) throw new Error('School information not found');

      const totalAmount = data.fee_heads.reduce((sum: number, head: any) => sum + head.amount, 0);
      const discountAmount = (totalAmount * data.discount_percentage) / 100;
      const finalAmount = totalAmount - discountAmount;

      const { error } = await supabase
        .from('fee_structures')
        .insert({
          school_id: profile.school_id,
          class_id: data.class_id,
          academic_year: data.academic_year,
          fee_heads: data.fee_heads,
          total_amount: totalAmount,
          discount_percentage: data.discount_percentage,
          discount_amount: discountAmount,
          final_amount: finalAmount,
          is_active: true
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Fee structure created successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['fee-structures'] });
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('fee_structures')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Fee structure deleted successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['fee-structures'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setFormData({
      class_id: '',
      academic_year: new Date().getFullYear().toString(),
      fee_heads: [
        { name: 'Tuition Fee', amount: 0 },
        { name: 'Development Fee', amount: 0 },
        { name: 'Activity Fee', amount: 0 },
        { name: 'Transport Fee', amount: 0 },
        { name: 'Examination Fee', amount: 0 }
      ],
      discount_percentage: 0,
    });
    setEditingFee(null);
  };

  const handleFeeHeadChange = (index: number, field: 'name' | 'amount', value: string | number) => {
    const updatedFeeHeads = [...formData.fee_heads];
    updatedFeeHeads[index] = { ...updatedFeeHeads[index], [field]: value };
    setFormData({ ...formData, fee_heads: updatedFeeHeads });
  };

  const addFeeHead = () => {
    setFormData({
      ...formData,
      fee_heads: [...formData.fee_heads, { name: '', amount: 0 }]
    });
  };

  const removeFeeHead = (index: number) => {
    const updatedFeeHeads = formData.fee_heads.filter((_, i) => i !== index);
    setFormData({ ...formData, fee_heads: updatedFeeHeads });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const totalAmount = formData.fee_heads.reduce((sum, head) => sum + Number(head.amount || 0), 0);
  const discountAmount = (totalAmount * Number(formData.discount_percentage || 0)) / 100;
  const finalAmount = totalAmount - discountAmount;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>Fee Structure Management</span>
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Add Fee Structure
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingFee ? 'Edit Fee Structure' : 'Create Fee Structure'}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="class_id">Class</Label>
                    <Select
                      value={formData.class_id}
                      onValueChange={(value) => setFormData({ ...formData, class_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name} - Grade {cls.grade_level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="academic_year">Academic Year</Label>
                    <Input
                      id="academic_year"
                      value={formData.academic_year}
                      onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                      placeholder="2024"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Label>Fee Heads</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addFeeHead}>
                      <Plus className="mr-2 h-3 w-3" />
                      Add Fee Head
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {formData.fee_heads.map((head, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          placeholder="Fee name"
                          value={head.name}
                          onChange={(e) => handleFeeHeadChange(index, 'name', e.target.value)}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          placeholder="Amount"
                          value={head.amount}
                          onChange={(e) => handleFeeHeadChange(index, 'amount', Number(e.target.value))}
                          className="w-32"
                        />
                        {formData.fee_heads.length > 1 && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeFeeHead(index)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="discount_percentage">Discount Percentage (%)</Label>
                  <Input
                    id="discount_percentage"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.discount_percentage}
                    onChange={(e) => setFormData({ ...formData, discount_percentage: Number(e.target.value) })}
                  />
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Total Amount:</span>
                      <div className="text-lg font-bold">₹{totalAmount.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="font-medium">Discount:</span>
                      <div className="text-lg font-bold text-red-600">₹{discountAmount.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="font-medium">Final Amount:</span>
                      <div className="text-lg font-bold text-green-600">₹{finalAmount.toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Creating...' : 'Create Fee Structure'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">Loading fee structures...</div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class</TableHead>
                  <TableHead>Academic Year</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Final Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feeStructures?.map((fee) => (
                  <TableRow key={fee.id}>
                    <TableCell>
                      {fee.classes?.name} - Grade {fee.classes?.grade_level}
                    </TableCell>
                    <TableCell>{fee.academic_year}</TableCell>
                    <TableCell>₹{fee.total_amount.toLocaleString()}</TableCell>
                    <TableCell className="font-semibold">₹{fee.final_amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        fee.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {fee.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => deleteMutation.mutate(fee.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FeeStructureManagement;