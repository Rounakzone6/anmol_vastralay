'use client';

import { Mail, MapPin, Phone, Send, ArrowRight } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="bg-[#FAFAFA] min-h-screen py-16 sm:py-24 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-red-50/50 blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[50%] rounded-full bg-orange-50/50 blur-3xl"></div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
            Let's Start a Conversation
          </h1>
          <p className="text-lg text-gray-500 leading-relaxed">
            Whether you have a question about our collections, need help with an order, or just want to say hello, we're here for you.
          </p>
        </div>

        <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 p-4 sm:p-6 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-0">
            
            {/* Left Panel - Contact Information */}
            <div className="lg:col-span-5 bg-[#85142b] rounded-[1.5rem] p-10 text-white flex flex-col justify-between relative overflow-hidden shadow-xl">
              {/* Decorative circles inside the dark card */}
              <div className="absolute top-auto bottom-[-10%] right-[-10%] w-64 h-64 bg-white opacity-5 rounded-full blur-2xl"></div>
              <div className="absolute top-[-5%] right-[-5%] w-32 h-32 bg-white opacity-10 rounded-full"></div>

              <div className="relative z-10">
                <h3 className="text-3xl font-bold mb-2">Contact Information</h3>
                <p className="text-white/70 mb-12 text-sm leading-relaxed pr-4">
                  Fill up the form and our Team will get back to you within 24 hours.
                </p>

                <div className="space-y-10">
                  <div className="flex items-start group">
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mr-6 group-hover:bg-white/20 transition-colors">
                      <Phone className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium text-lg">+91 9102171696</p>
                      <p className="text-sm text-white/60 mt-1">Mon - Sun (7:00 AM - 8:00 PM)</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start group">
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mr-6 group-hover:bg-white/20 transition-colors">
                      <Mail className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium text-lg">anmolvastralay@gmail.com</p>
                      <p className="text-sm text-white/60 mt-1">Online support 24/7</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start group">
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mr-6 group-hover:bg-white/20 transition-colors shrink-0">
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium text-lg leading-relaxed">
                        Anmol Vastralay<br />
                        Baliwan Sagar, Kuchaikote<br />
                        Gopalganj, Bihar (841501)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative z-10 mt-16 flex space-x-4">
                {/* Minimal social placeholders if needed, or just keep it clean */}
              </div>
            </div>

            {/* Right Panel - Contact Form */}
            <div className="lg:col-span-7 lg:pl-16 p-4 sm:p-8 flex flex-col justify-center">
              <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label htmlFor="first_name" className="block text-sm font-semibold text-gray-700 ml-1">First Name</label>
                    <input type="text" id="first_name" className="block w-full rounded-xl border-none bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#85142b]/20 shadow-inner px-5 py-4 text-gray-900 placeholder-gray-400 transition-all" placeholder="John" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="last_name" className="block text-sm font-semibold text-gray-700 ml-1">Last Name</label>
                    <input type="text" id="last_name" className="block w-full rounded-xl border-none bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#85142b]/20 shadow-inner px-5 py-4 text-gray-900 placeholder-gray-400 transition-all" placeholder="Doe" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 ml-1">Email Address</label>
                    <input type="email" id="email" className="block w-full rounded-xl border-none bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#85142b]/20 shadow-inner px-5 py-4 text-gray-900 placeholder-gray-400 transition-all" placeholder="john@example.com" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 ml-1">Phone Number</label>
                    <input type="tel" id="phone" className="block w-full rounded-xl border-none bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#85142b]/20 shadow-inner px-5 py-4 text-gray-900 placeholder-gray-400 transition-all" placeholder="+91 98765 43210" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="message" className="block text-sm font-semibold text-gray-700 ml-1">Your Message</label>
                  <textarea id="message" rows={4} className="block w-full rounded-xl border-none bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#85142b]/20 shadow-inner px-5 py-4 text-gray-900 placeholder-gray-400 transition-all resize-none" placeholder="Tell us how we can help you..."></textarea>
                </div>

                <div className="pt-4 flex justify-end">
                  <button type="submit" className="group cursor-pointer inline-flex items-center justify-center py-4 px-8 rounded-full text-base font-bold text-white bg-[#85142b] hover:bg-[#6c1023] shadow-lg shadow-[#85142b]/30 hover:shadow-xl hover:shadow-[#85142b]/40 hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#85142b]">
                    <span>Send Message</span>
                    <Send className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </form>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
