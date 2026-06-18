import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description: 'Review the Terms and Conditions for using the Anmol Vastralay website. Find information on user accounts, pricing policies, and intellectual property.',
  keywords: ['terms and conditions', 'terms of service', 'Anmol Vastralay terms', 'user agreement'],
};

export default function TermsConditionsPage() {
  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Terms & Conditions</h1>
          <p className="mt-4 text-lg text-gray-600">
            Please read these terms carefully before using our website.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12 text-gray-700 space-y-6 text-base leading-relaxed">
          <p>
            Welcome to Anmol Vastralay. These Terms and Conditions outline the rules and regulations for the use of our website. By accessing or using this website, you agree to be bound by these terms. If you do not agree with any part of these terms, please do not use our website.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-100 pb-4 mt-12 mb-6">1. Intellectual Property Rights</h2>
          <p>
            Unless otherwise stated, Anmol Vastralay owns the intellectual property rights for all material on this website. All intellectual property rights are reserved. You may access this from Anmol Vastralay for your own personal use subjected to restrictions set in these terms and conditions.
          </p>
          <p>You must not:</p>
          <ul className="list-disc pl-6 space-y-3 my-6 text-gray-600">
            <li>Republish material from Anmol Vastralay</li>
            <li>Sell, rent or sub-license material from Anmol Vastralay</li>
            <li>Reproduce, duplicate or copy material from Anmol Vastralay</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-100 pb-4 mt-12 mb-6">2. User Accounts</h2>
          <p>
            When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our service.
          </p>
          <p>
            You are responsible for safeguarding the password that you use to access the service and for any activities or actions under your password.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-100 pb-4 mt-12 mb-6">3. Pricing and Availability</h2>
          <p>
            All prices are subject to change without notice. We reserve the right to modify or discontinue a product at any time. We shall not be liable to you or to any third-party for any modification, price change, suspension, or discontinuance of a product.
          </p>
          <p>
            We have made every effort to display as accurately as possible the colors and images of our products that appear at the store. We cannot guarantee that your computer monitor's display of any color will be accurate.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-100 pb-4 mt-12 mb-6">4. Order Cancellations</h2>
          <p>
            We reserve the right to refuse or cancel any order you place with us. We may, in our sole discretion, limit or cancel quantities purchased per person, per household or per order. In the event that we make a change to or cancel an order, we may attempt to notify you by contacting the e‑mail and/or billing address/phone number provided at the time the order was made.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-100 pb-4 mt-12 mb-6">5. Limitation of Liability</h2>
          <p>
            In no case shall Anmol Vastralay, our directors, officers, employees, affiliates, agents, contractors, or licensors be liable for any injury, loss, claim, or any direct, indirect, incidental, punitive, special, or consequential damages of any kind, including, without limitation lost profits, lost revenue, lost savings, loss of data, replacement costs, or any similar damages, whether based in contract, tort (including negligence), strict liability or otherwise, arising from your use of any of the service or any products procured using the service.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-100 pb-4 mt-12 mb-6">6. Governing Law</h2>
          <p>
            These Terms shall be governed and construed in accordance with the laws of India. Any disputes relating to these terms and conditions will be subject to the exclusive jurisdiction of the courts of Bihar, India.
          </p>

          <div className="mt-12 p-6 bg-gray-50 rounded-lg border border-gray-200 text-center">
            <h3 className="font-bold text-gray-900 mb-2">Need clarifications?</h3>
            <p className="text-gray-600 text-sm">
              Contact us at <a href="mailto:anmolvastralay@gmail.com" className="text-[#85142b] font-semibold hover:underline">anmolvastralay@gmail.com</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
