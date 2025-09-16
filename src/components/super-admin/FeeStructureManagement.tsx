import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Plus, Edit, Trash2, School, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const FeeStructureManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSchool, setSelectedSchool] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFee, setEditingFee] = useState<any>(null);

  // Fetch schools for super admin
  const { data: schools } = useQuery({
    queryKey: ['all-schools-super-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schools')
        .select('id, name, status')
        .order('name');

      if (error) throw error;
      return data;
    }
  });

  // Fetch classes for selected school
  const { data: classes } = useQuery({
    queryKey: ['school-classes', selectedSchool],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name, grade_level, academic_year')
        .eq('school_id', selectedSchool)
        .order('grade_level');

      if (error) throw error;
      return data;
    },
    enabled: !!selectedSchool
  });

  // Fetch fee heads for selected school
  const { data: feeHeads } = useQuery({
    queryKey: ['school-fee-heads', selectedSchool],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fee_heads')
        .select('id, name, amount, description')
        .eq('school_id', selectedSchool)
        .eq('is_active', true);

      if (error) throw error;
      return data;
    },
    enabled: !!selectedSchool
  });

  // Fetch fee structures
  const { data: feeStructures, isLoading } = useQuery({
    queryKey: ['fee-structures', selectedSchool],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fee_structures')
        .select(`
          id,
          class_id,
          academic_year,
          fee_heads,
          total_amount,
          discount_percentage,
          discount_amount,
          final_amount,
          is_active,
          classes (
            name,
            grade_level
          )
        `)
        .eq('school_id', selectedSchool)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!selectedSchool
  });

  // Create/Update fee structure mutation
  const feeStructureMutation = useMutation({
    mutationFn: async (feeData: any) => {
      if (editingFee) {
        const { error } = await supabase
          .from('fee_structures')
          .update(feeData)
          .eq('id', editingFee.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('fee_structures')
          .insert([{
            ...feeData,
            school_id: selectedSchool,
            tenant_id: selectedSchool
          }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ 
        title: "Success", 
        description: `Fee structure ${editingFee ? 'updated' : 'created'} successfully` 
      });
      setDialogOpen(false);
      setEditingFee(null);
      queryClient.invalidateQueries({ queryKey: ['fee-structures'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to save fee structure", 
        variant: "destructive" 
      });
    }
  });

  // Delete fee structure mutation
  const deleteMutation = useMutation({
    mutationFn: async (feeId: string) => {
      const { error } = await supabase
        .from('fee_structures')
        .delete()
        .eq('id', feeId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Fee structure deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ['fee-structures'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to delete fee structure", 
        variant: "destructive" 
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    // Calculate fee heads object and totals
    const selectedFeeHeads: Record<string, number> = {};
    let totalAmount = 0;
    
    feeHeads?.forEach(feeHead => {
      const amount = parseFloat(formData.get(`fee_head_${feeHead.id}`) as string) || 0;
      if (amount > 0) {
        selectedFeeHeads[feeHead.id] = amount;
        totalAmount += amount;
      }
    });

    const discountPercentage = parseFloat(formData.get('discount_percentage') as string) || 0;
    const discountAmount = (totalAmount * discountPercentage) / 100;
    const finalAmount = totalAmount - discountAmount;

    feeStructureMutation.mutate({
      class_id: formData.get('class_id'),
      academic_year: formData.get('academic_year'),
      fee_heads: selectedFeeHeads,
      total_amount: totalAmount,
      discount_percentage: discountPercentage,
      discount_amount: discountAmount,
      final_amount: finalAmount,
      is_active: formData.get('is_active') === 'true'
    });
  };

  const openEditDialog = (feeStructure: any) => {
    setEditingFee(feeStructure);
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingFee(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Fee Structure Management</h2>
          <p className="text-muted-foreground">Manage fee structures and discounts for schools</p>
        </div>
      </div>

      {/* School Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <School className="h-5 w-5" />
            Select School
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedSchool} onValueChange={setSelectedSchool}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a school to manage fee structures" />
            </SelectTrigger>
            <SelectContent>
              {schools?.map((school) => (
                <SelectItem key={school.id} value={school.id}>
                  {school.name}
                  <Badge 
                    variant={school.status === 'active' ? 'default' : 'secondary'} 
                    className="ml-2"
                  >
                    {school.status}
                  </Badge>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedSchool && (
        <>
          {/* Actions */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span className="text-muted-foreground">
                {feeStructures?.length || 0} fee structures configured
              </span>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreateDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Fee Structure
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingFee ? 'Edit Fee Structure' : 'Create Fee Structure'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="class_id">Class</Label>
                      <Select name="class_id" defaultValue={editingFee?.class_id} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent>
                          {classes?.map((cls) => (
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
                        name="academic_year" 
                        placeholder="2023-2024"
                        defaultValue={editingFee?.academic_year}
                        required 
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Fee Heads</Label>
                    <div className="space-y-2 mt-2 max-h-40 overflow-y-auto border rounded p-2">
                      {feeHeads?.map((feeHead) => (
                        <div key={feeHead.id} className="flex items-center justify-between">
                          <div>
                            <span className="font-medium">{feeHead.name}</span>
                            <p className="text-xs text-muted-foreground">{feeHead.description}</p>
                          </div>
                          <Input
                            name={`fee_head_${feeHead.id}`}
                            type="number"
                            step="0.01"
                            placeholder="Amount"
                            className="w-24"
                            defaultValue={editingFee?.fee_heads?.[feeHead.id] || ''}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="discount_percentage">Discount Percentage (%)</Label>
                    <Input 
                      name="discount_percentage" 
                      type="number" 
                      step="0.01" 
                      min="0" 
                      max="100"
                      defaultValue={editingFee?.discount_percentage || 0}
                    />
                  </div>

                  <div>
                    <Label htmlFor="is_active">Status</Label>
                    <Select name="is_active" defaultValue={editingFee?.is_active?.toString() || 'true'}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Active</SelectItem>
                        <SelectItem value="false">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button type="submit" className="w-full" disabled={feeStructureMutation.isPending}>
                    {feeStructureMutation.isPending 
                      ? (editingFee ? 'Updating...' : 'Creating...') 
                      : (editingFee ? 'Update Fee Structure' : 'Create Fee Structure')
                    }
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Fee Structures List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {feeStructures?.map((feeStructure) => (
              <Card key={feeStructure.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="text-lg">
                      {feeStructure.classes.name} - Grade {feeStructure.classes.grade_level}
                    </span>
                    <Badge variant={feeStructure.is_active ? 'default' : 'secondary'}>
                      {feeStructure.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Academic Year</p>
                      <p className="font-semibold">{feeStructure.academic_year}</p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Total Amount</p>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        <span className="font-semibold">{feeStructure.total_amount}</span>
                      </div>
                    </div>

                    {feeStructure.discount_percentage > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground">Discount</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {feeStructure.discount_percentage}%
                          </Badge>
                          <span className="text-sm">
                            -${feeStructure.discount_amount}
                          </span>
                        </div>
                      </div>
                    )}

                    <div>
                      <p className="text-sm text-muted-foreground">Final Amount</p>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="font-bold text-green-600">{feeStructure.final_amount}</span>
                      </div>
                    </div>

                    <div className="flex justify-between pt-2 border-t">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(feeStructure)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteMutation.mutate(feeStructure.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {feeStructures?.length === 0 && !isLoading && (
            <Card>
              <CardContent className="text-center py-12">
                <DollarSign className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Fee Structures</h3>
                <p className="text-muted-foreground">
                  No fee structures have been created for this school yet.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default FeeStructureManagement;