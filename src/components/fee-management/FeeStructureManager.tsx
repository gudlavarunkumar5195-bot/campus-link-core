import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DollarSign, Plus, Edit, Trash2, Calculator, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface FeeHead {
  id: string;
  name: string;
  description?: string;
  amount: number;
  is_active: boolean;
}

interface Class {
  id: string;
  name: string;
  grade_level: number;
  academic_year: string;
}

interface FeeStructure {
  id: string;
  class_id: string;
  academic_year: string;
  fee_heads: any;
  total_amount: number;
  discount_percentage?: number;
  discount_amount?: number;
  final_amount: number;
  is_active: boolean;
  classes?: Class;
}

const FeeStructureManager = () => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'fee-heads' | 'fee-structures'>('fee-heads');
  const [editingFeeHead, setEditingFeeHead] = useState<FeeHead | null>(null);
  const [editingFeeStructure, setEditingFeeStructure] = useState<FeeStructure | null>(null);
  
  const [feeHeadForm, setFeeHeadForm] = useState({
    name: '',
    description: '',
    amount: 0,
    is_active: true
  });

  const [feeStructureForm, setFeeStructureForm] = useState({
    class_id: '',
    academic_year: '',
    selected_fee_heads: [] as string[],
    discount_percentage: 0,
    custom_amounts: {} as Record<string, number>
  });

  // Fetch fee heads
  const { data: feeHeads, isLoading: loadingFeeHeads } = useQuery({
    queryKey: ['fee-heads', profile?.school_id],
    enabled: !!profile?.school_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fee_heads')
        .select('*')
        .eq('school_id', profile!.school_id)
        .order('name');
      if (error) throw error;
      return data as FeeHead[];
    },
  });

  // Fetch classes
  const { data: classes } = useQuery({
    queryKey: ['classes', profile?.school_id],
    enabled: !!profile?.school_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('class_structure')
        .select('id, class_name')
        .eq('school_id', profile!.school_id)
        .order('class_name');
      if (error) throw error;
      return (data || []).map((c: any) => ({
        id: c.id,
        name: c.class_name,
        grade_level: 0,
        academic_year: ''
      })) as Class[];
    },
  });

  // Fetch fee structures
  const { data: feeStructures, isLoading: loadingFeeStructures } = useQuery({
    queryKey: ['fee-structures', profile?.school_id],
    enabled: !!profile?.school_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fee_structures')
        .select('*')
        .eq('school_id', profile!.school_id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as FeeStructure[];
    },
  });

  // Fee Head Mutations
  const createFeeHeadMutation = useMutation({
    mutationFn: async (newFeeHead: typeof feeHeadForm) => {
      const { error } = await supabase
        .from('fee_heads')
        .insert({
          ...newFeeHead,
          school_id: profile?.school_id
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Fee Head Created',
        description: 'New fee head has been added successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['fee-heads'] });
      setIsDialogOpen(false);
      resetFeeHeadForm();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create fee head: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const updateFeeHeadMutation = useMutation({
    mutationFn: async (updatedFeeHead: typeof feeHeadForm & { id: string }) => {
      const { id, ...data } = updatedFeeHead;
      const { error } = await supabase
        .from('fee_heads')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Fee Head Updated',
        description: 'Fee head has been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['fee-heads'] });
      setIsDialogOpen(false);
      resetFeeHeadForm();
    },
  });

  // Fee Structure Mutations
  const createFeeStructureMutation = useMutation({
    mutationFn: async (newFeeStructure: any) => {
      const { error } = await supabase
        .from('fee_structures')
        .insert(newFeeStructure);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Fee Structure Created',
        description: 'New fee structure has been created successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['fee-structures'] });
      setIsDialogOpen(false);
      resetFeeStructureForm();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create fee structure: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const deleteFeeHeadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('fee_heads')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Fee Head Deleted',
        description: 'Fee head has been removed successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['fee-heads'] });
    },
  });

  const resetFeeHeadForm = () => {
    setFeeHeadForm({ name: '', description: '', amount: 0, is_active: true });
    setEditingFeeHead(null);
  };

  const resetFeeStructureForm = () => {
    setFeeStructureForm({
      class_id: '',
      academic_year: '',
      selected_fee_heads: [],
      discount_percentage: 0,
      custom_amounts: {}
    });
    setEditingFeeStructure(null);
  };

  const handleFeeHeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingFeeHead) {
      updateFeeHeadMutation.mutate({ ...feeHeadForm, id: editingFeeHead.id });
    } else {
      createFeeHeadMutation.mutate(feeHeadForm);
    }
  };

  const handleFeeStructureSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calculate fee structure
    const selectedHeads = feeHeads?.filter(head => 
      feeStructureForm.selected_fee_heads.includes(head.id)
    ) || [];

    const feeHeadsData: Record<string, number> = {};
    let totalAmount = 0;

    selectedHeads.forEach(head => {
      const amount = feeStructureForm.custom_amounts[head.id] || head.amount;
      feeHeadsData[head.id] = amount;
      totalAmount += amount;
    });

    const discountAmount = (totalAmount * feeStructureForm.discount_percentage) / 100;
    const finalAmount = totalAmount - discountAmount;

    const newFeeStructure = {
      school_id: profile?.school_id,
      class_id: feeStructureForm.class_id,
      academic_year: feeStructureForm.academic_year,
      fee_heads: feeHeadsData,
      total_amount: totalAmount,
      discount_percentage: feeStructureForm.discount_percentage,
      discount_amount: discountAmount,
      final_amount: finalAmount,
      is_active: true
    };

    createFeeStructureMutation.mutate(newFeeStructure);
  };

  const handleEditFeeHead = (feeHead: FeeHead) => {
    setEditingFeeHead(feeHead);
    setFeeHeadForm({
      name: feeHead.name,
      description: feeHead.description || '',
      amount: feeHead.amount,
      is_active: feeHead.is_active
    });
    setIsDialogOpen(true);
  };

  const calculateTotal = () => {
    const selectedHeads = feeHeads?.filter(head => 
      feeStructureForm.selected_fee_heads.includes(head.id)
    ) || [];

    let total = 0;
    selectedHeads.forEach(head => {
      const amount = feeStructureForm.custom_amounts[head.id] || head.amount;
      total += amount;
    });

    const discount = (total * feeStructureForm.discount_percentage) / 100;
    return { total, discount, final: total - discount };
  };

  const totals = calculateTotal();

  return (
    <div className="min-h-screen page-container animated-bg">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Fee Management</h1>
            <p className="text-muted-foreground">Manage fee heads and create fee structures for different classes</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <Button
            variant={activeTab === 'fee-heads' ? 'default' : 'outline'}
            onClick={() => setActiveTab('fee-heads')}
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Fee Heads
          </Button>
          <Button
            variant={activeTab === 'fee-structures' ? 'default' : 'outline'}
            onClick={() => setActiveTab('fee-structures')}
          >
            <Calculator className="h-4 w-4 mr-2" />
            Fee Structures
          </Button>
        </div>

        {/* Fee Heads Tab */}
        {activeTab === 'fee-heads' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Fee Heads</h2>
              <Dialog open={isDialogOpen && activeTab === 'fee-heads'} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { resetFeeHeadForm(); setIsDialogOpen(true); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Fee Head
                  </Button>
                </DialogTrigger>
                <DialogContent className="form-container border-white/50">
                  <DialogHeader>
                    <DialogTitle>
                      {editingFeeHead ? 'Edit Fee Head' : 'Add New Fee Head'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleFeeHeadSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Fee Head Name</Label>
                      <Input
                        id="name"
                        value={feeHeadForm.name}
                        onChange={(e) => setFeeHeadForm({...feeHeadForm, name: e.target.value})}
                        placeholder="e.g., Tuition Fee, Library Fee"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={feeHeadForm.description}
                        onChange={(e) => setFeeHeadForm({...feeHeadForm, description: e.target.value})}
                        placeholder="Optional description"
                      />
                    </div>
                    <div>
                      <Label htmlFor="amount">Amount</Label>
                      <Input
                        id="amount"
                        type="number"
                        value={feeHeadForm.amount}
                        onChange={(e) => setFeeHeadForm({...feeHeadForm, amount: Number(e.target.value)})}
                        placeholder="0"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit">
                        {editingFeeHead ? 'Update' : 'Create'} Fee Head
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {feeHeads?.map((feeHead) => (
                <Card key={feeHead.id} className="form-container border-white/50 shadow-lg">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center space-x-2">
                        <DollarSign className="h-5 w-5" />
                        <span>{feeHead.name}</span>
                      </CardTitle>
                      <Badge variant={feeHead.is_active ? 'default' : 'secondary'}>
                        {feeHead.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-primary mb-2">₹{feeHead.amount}</p>
                    {feeHead.description && (
                      <p className="text-sm text-muted-foreground mb-4">{feeHead.description}</p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditFeeHead(feeHead)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteFeeHeadMutation.mutate(feeHead.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Fee Structures Tab */}
        {activeTab === 'fee-structures' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Fee Structures</h2>
              <Dialog open={isDialogOpen && activeTab === 'fee-structures'} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { resetFeeStructureForm(); setIsDialogOpen(true); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Fee Structure
                  </Button>
                </DialogTrigger>
                <DialogContent className="form-container border-white/50 max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Fee Structure</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleFeeStructureSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Class</Label>
                        <Select
                          value={feeStructureForm.class_id}
                          onValueChange={(value) => setFeeStructureForm({...feeStructureForm, class_id: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select class" />
                          </SelectTrigger>
                          <SelectContent className="bg-background border-white/50 z-50">
                            {classes?.map((cls) => (
                              <SelectItem key={cls.id} value={cls.id}>
                                {cls.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Academic Year</Label>
                        <Input
                          value={feeStructureForm.academic_year}
                          onChange={(e) => setFeeStructureForm({...feeStructureForm, academic_year: e.target.value})}
                          placeholder="2024-2025"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label>Fee Heads</Label>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {feeHeads?.map((head) => (
                          <div key={head.id} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={feeStructureForm.selected_fee_heads.includes(head.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFeeStructureForm({
                                      ...feeStructureForm,
                                      selected_fee_heads: [...feeStructureForm.selected_fee_heads, head.id]
                                    });
                                  } else {
                                    setFeeStructureForm({
                                      ...feeStructureForm,
                                      selected_fee_heads: feeStructureForm.selected_fee_heads.filter(id => id !== head.id)
                                    });
                                  }
                                }}
                              />
                              <span>{head.name}</span>
                            </div>
                            {feeStructureForm.selected_fee_heads.includes(head.id) && (
                              <Input
                                type="number"
                                className="w-24"
                                placeholder={head.amount.toString()}
                                onChange={(e) => {
                                  setFeeStructureForm({
                                    ...feeStructureForm,
                                    custom_amounts: {
                                      ...feeStructureForm.custom_amounts,
                                      [head.id]: Number(e.target.value) || head.amount
                                    }
                                  });
                                }}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Discount Percentage</Label>
                      <Input
                        type="number"
                        value={feeStructureForm.discount_percentage}
                        onChange={(e) => setFeeStructureForm({...feeStructureForm, discount_percentage: Number(e.target.value)})}
                        placeholder="0"
                        min="0"
                        max="100"
                        step="0.01"
                      />
                    </div>

                    {feeStructureForm.selected_fee_heads.length > 0 && (
                      <div className="bg-gray-50 p-4 rounded">
                        <h4 className="font-medium mb-2">Fee Summary</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Total:</span>
                            <span>₹{totals.total}</span>
                          </div>
                          {totals.discount > 0 && (
                            <div className="flex justify-between">
                              <span>Discount:</span>
                              <span>-₹{totals.discount}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-bold">
                            <span>Final Amount:</span>
                            <span>₹{totals.final}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button type="submit" disabled={feeStructureForm.selected_fee_heads.length === 0}>
                        Create Fee Structure
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {feeStructures?.map((structure) => (
                <Card key={structure.id} className="form-container border-white/50 shadow-lg">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center space-x-2">
                        <BookOpen className="h-5 w-5" />
                        <span>{classes?.find(c => c.id === structure.class_id)?.name || 'Class'}</span>
                      </CardTitle>
                      <Badge variant={structure.is_active ? 'default' : 'secondary'}>
                        {structure.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Academic Year: {structure.academic_year}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Total Amount:</span>
                        <span className="font-medium">₹{structure.total_amount}</span>
                      </div>
                      {structure.discount_amount && structure.discount_amount > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span>Discount ({structure.discount_percentage}%):</span>
                          <span>-₹{structure.discount_amount}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-lg border-t pt-2">
                        <span>Final Amount:</span>
                        <span>₹{structure.final_amount}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeeStructureManager;