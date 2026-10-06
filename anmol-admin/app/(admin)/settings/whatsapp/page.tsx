'use client';

import { PageHeader } from '@/components/page-header';
import { Card, Button, Spinner } from '@/components/ui';
import { trpc } from '@/lib/trpc';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle2, QrCode, LogOut, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect } from 'react';

export default function WhatsAppSettingsPage() {
  const { data: status, isLoading, refetch } = trpc.whatsapp.adminGetStatus.useQuery();
  
  const logout = trpc.whatsapp.adminLogout.useMutation({
    onSuccess: () => {
      toast.success('WhatsApp disconnected successfully');
      refetch();
    },
    onError: (err) => {
      toast.error(`Failed to disconnect: ${err.message}`);
    }
  });

  // Poll for status every 3 seconds if not ready, to get the latest QR or status
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status && !status.isReady) {
      interval = setInterval(() => {
        refetch();
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status, refetch]);

  return (
    <div className="pb-12 max-w-4xl">
      <PageHeader 
        title="WhatsApp Integration" 
        description="Connect your WhatsApp account to automatically send delivery assignment notifications to your delivery personnel." 
      />

      <div className="mt-8">
        <Card className="p-8 flex flex-col items-center justify-center text-center">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center">
              <Spinner size={40} className="mb-4 text-violet-600" />
              <p className="text-slate-500 font-medium">Checking WhatsApp connection...</p>
            </div>
          ) : status?.isReady ? (
            <div className="py-8 flex flex-col items-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 size={40} className="text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">WhatsApp is Connected</h2>
              <p className="text-slate-500 max-w-md mb-8">
                Your WhatsApp account is successfully linked. Delivery boys will receive automated messages when orders are assigned to them.
              </p>
              
              <Button 
                variant="outline" 
                className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                onClick={() => {
                  if (confirm('Are you sure you want to disconnect WhatsApp? You will need to scan the QR code again to reconnect.')) {
                    logout.mutate();
                  }
                }}
                disabled={logout.isPending}
              >
                {logout.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LogOut className="w-4 h-4 mr-2" />}
                Disconnect WhatsApp
              </Button>
            </div>
          ) : (
            <div className="py-8 flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <QrCode size={32} className="text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Connect WhatsApp</h2>
              <p className="text-slate-500 max-w-md mb-8">
                Open WhatsApp on your phone, go to <strong>Linked Devices</strong>, and scan the QR code below to connect your account.
              </p>
              
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 inline-block">
                {status?.qrCode ? (
                  <QRCodeSVG 
                    value={status.qrCode} 
                    size={256}
                    bgColor={"#ffffff"}
                    fgColor={"#0f172a"}
                    level={"L"}
                    includeMargin={false}
                  />
                ) : (
                  <div className="w-[256px] h-[256px] flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-slate-100">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-400 mb-2" />
                    <span className="text-sm text-slate-500 font-medium">Generating QR...</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-slate-400 mt-6">
                This QR code refreshes automatically. Keep this page open while scanning.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
