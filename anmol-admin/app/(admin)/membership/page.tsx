'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Label, Badge, Spinner } from '@/components/ui';
import { trpc } from '@/lib/trpc';
import { Crown, Truck, ShieldCheck, IndianRupee, Save, Calendar, CheckCircle2, Search, Users, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function MembershipAdminPage() {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('1');
  const [durationDays, setDurationDays] = useState('365');
  const [deliveryCharge, setDeliveryCharge] = useState('20');
  const [searchMember, setSearchMember] = useState('');

  const { data: plan, isLoading: isPlanLoading, refetch: refetchPlan } = trpc.membership.getPlan.useQuery();
  const { data: members, isLoading: isMembersLoading } = trpc.membership.adminGetMembers.useQuery();

  useEffect(() => {
    if (plan) {
      setName(plan.name || 'Anmol VIP Royal Club');
      setPrice(String(plan.price ?? 1));
      setDurationDays(String(plan.durationDays ?? 365));
      setDeliveryCharge(String(plan.deliveryCharge ?? 20));
    }
  }, [plan]);

  const updateMutation = trpc.membership.adminUpdatePlan.useMutation({
    onSuccess: () => {
      toast.success('VIP Membership plan updated successfully!');
      refetchPlan();
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update plan');
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const numPrice = parseFloat(price);
    const numDays = parseInt(durationDays, 10);
    const numDelivery = parseFloat(deliveryCharge);

    if (isNaN(numPrice) || numPrice < 0) {
      toast.error('Please enter a valid membership price');
      return;
    }
    if (isNaN(numDays) || numDays <= 0) {
      toast.error('Please enter valid duration days');
      return;
    }
    if (isNaN(numDelivery) || numDelivery < 0) {
      toast.error('Please enter a valid standard delivery charge');
      return;
    }

    updateMutation.mutate({
      name: name.trim() || 'Anmol VIP Royal Club',
      price: numPrice,
      durationDays: numDays,
      deliveryCharge: numDelivery,
    });
  };

  const filteredMembers = (members || []).filter((m: any) => {
    if (!searchMember.trim()) return true;
    const q = searchMember.toLowerCase();
    return (
      m.user?.name?.toLowerCase().includes(q) ||
      m.user?.phone?.toLowerCase().includes(q) ||
      m.user?.email?.toLowerCase().includes(q) ||
      m.razorpayPaymentId?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <PageHeader
        title="VIP Membership & Delivery Settings"
        description="Set subscription pricing, configure standard delivery fees, and view enrolled royal club members."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Plan Config Form */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-amber-100 bg-gradient-to-b from-amber-50/50 to-white shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/10 text-amber-600 rounded-lg">
                  <Crown className="w-5 h-5" />
                </div>
                <CardTitle className="text-lg text-slate-800">Plan & Pricing Settings</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {isPlanLoading ? (
                <div className="py-8 flex justify-center">
                  <Spinner size={24} />
                </div>
              ) : (
                <form onSubmit={handleSave} className="space-y-4">
                  <div>
                    <Label>Membership Name</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Anmol VIP Royal Club"
                      required
                    />
                  </div>

                  <div>
                    <Label className="flex items-center justify-between">
                      <span>Subscription Price (₹)</span>
                      <span className="text-xs text-amber-700 font-semibold bg-amber-100 px-2 py-0.5 rounded">
                        Currently: ₹{plan?.price ?? 1}
                      </span>
                    </Label>
                    <div className="relative">
                      <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        className="pl-9 font-semibold text-slate-900"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        required
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Set ₹1 for testing, or any desired price. Updates instantly for all customers.
                    </p>
                  </div>

                  <div>
                    <Label className="flex items-center justify-between">
                      <span>Standard Delivery Fee (₹)</span>
                      <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        Non-Members
                      </span>
                    </Label>
                    <div className="relative">
                      <Truck className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <Input
                        type="number"
                        step="1"
                        min="0"
                        className="pl-9 font-semibold text-slate-900"
                        value={deliveryCharge}
                        onChange={(e) => setDeliveryCharge(e.target.value)}
                        required
                      />
                    </div>
                    <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      VIP Members automatically get ₹0 Free Delivery!
                    </p>
                  </div>

                  <div>
                    <Label className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>Duration (Days)</span>
                    </Label>
                    <Input
                      type="number"
                      step="1"
                      min="1"
                      value={durationDays}
                      onChange={(e) => setDurationDays(e.target.value)}
                      required
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      {durationDays === '365' ? '1 Year (365 days)' : `${durationDays} days validity`}
                    </p>
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={updateMutation.isPending}
                      className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 shadow-amber-200"
                    >
                      {updateMutation.isPending ? (
                        <Spinner size={16} />
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Save Membership Settings</span>
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Key Benefits Preview */}
          <Card className="border-slate-200 bg-white">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <CardTitle className="text-sm font-semibold text-slate-700">Configured Member Benefits</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                <span><strong>Free Delivery on All Orders:</strong> Save ₹{deliveryCharge || '20'} on every single order.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-500 font-bold">✓</span>
                <span><strong>24-Hour Express Dispatch:</strong> Priority warehousing and premium luxury packaging.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-500 font-bold">✓</span>
                <span><strong>Festive Early Access:</strong> 24h head-start on all festive collections & flash sales.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-500 font-bold">✓</span>
                <span><strong>VIP WhatsApp Stylist:</strong> Direct concierge styling & custom saree draping advice.</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Subscribers List */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-violet-50 text-violet-600 rounded-lg">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Subscribed VIP Members</CardTitle>
                  <p className="text-xs text-slate-500">
                    Total Enrolled: {members?.length ?? 0}
                  </p>
                </div>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <Input
                  placeholder="Search name, phone, txn..."
                  value={searchMember}
                  onChange={(e) => setSearchMember(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>
            </CardHeader>

            <CardContent>
              {isMembersLoading ? (
                <div className="py-12 flex justify-center">
                  <Spinner size={32} />
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Crown className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="font-medium text-slate-600">No VIP members found</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {searchMember ? 'Try a different search query' : 'Customers who subscribe to VIP club will appear here'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-100">
                      <tr>
                        <th className="py-3 px-3">Customer</th>
                        <th className="py-3 px-3">Paid (₹)</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3">Valid Until</th>
                        <th className="py-3 px-3">Transaction ID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredMembers.map((m: any) => {
                        const isExpired = new Date(m.endDate).getTime() < Date.now();
                        return (
                          <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-3">
                              <div className="font-semibold text-slate-900">{m.user?.name || 'Customer'}</div>
                              <div className="text-[11px] text-slate-500">{m.user?.phone || m.user?.email || 'N/A'}</div>
                            </td>
                            <td className="py-3 px-3 font-semibold text-slate-900">
                              ₹{Number(m.pricePaid || 0).toFixed(2)}
                            </td>
                            <td className="py-3 px-3">
                              {isExpired ? (
                                <Badge variant="danger">Expired</Badge>
                              ) : (
                                <Badge variant="success" className="bg-amber-50 text-amber-700 border-amber-200">
                                  👑 Active VIP
                                </Badge>
                              )}
                            </td>
                            <td className="py-3 px-3 text-slate-700">
                              {new Date(m.endDate).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </td>
                            <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                              {m.razorpayPaymentId || m.razorpayOrderId || 'N/A'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
