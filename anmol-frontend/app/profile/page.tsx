'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../lib/useAuth';
import { User, Package, LogOut, Mail, Calendar } from 'lucide-react';
import { trpc } from '../../lib/trpc';

export default function ProfilePage() {
  const { isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  // Get user details. In a real app we'd have a `trpc.user.me` endpoint, 
  // but for now we just show basic info if they are logged in.
  
  useEffect(() => {
    setIsClient(true);
    if (!isAuthenticated) {
      router.push('/login?redirect=/profile');
    }
  }, [isAuthenticated, router]);

  if (!isClient || !isAuthenticated) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8">My Account</h1>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          
          <div className="bg-[#85142b] px-6 py-8 sm:px-10 flex items-center">
            <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center text-[#85142b]">
              <User size={40} />
            </div>
            <div className="ml-6 text-white">
              <h2 className="text-2xl font-bold">Welcome Back!</h2>
              <p className="text-red-100 mt-1">Manage your account and orders</p>
            </div>
          </div>

          <div className="p-6 sm:p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
            
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">
                Account Details
              </h3>
              <div className="space-y-4">
                <div className="flex items-center text-gray-600">
                  <User className="h-5 w-5 mr-3 text-gray-400" />
                  <span>Customer</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Mail className="h-5 w-5 mr-3 text-gray-400" />
                  <span>Logged in via Email</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <Link 
                  href="/orders" 
                  className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-[#85142b] hover:bg-red-50 transition-colors"
                >
                  <div className="flex items-center text-gray-700 font-medium">
                    <Package className="h-5 w-5 mr-3 text-[#85142b]" />
                    My Orders
                  </div>
                  <span className="text-gray-400">&rarr;</span>
                </Link>
                
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center text-gray-700 font-medium">
                    <LogOut className="h-5 w-5 mr-3 text-gray-500" />
                    Sign Out
                  </div>
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
