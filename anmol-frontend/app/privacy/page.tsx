import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Read the Privacy Policy of Anmol Vastralay. Learn how we securely collect, use, and protect your personal information and payment data.',
  keywords: ['privacy policy', 'Anmol Vastralay privacy', 'data security', 'user data', 'safe payments'],
};

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Privacy Policy</h1>
          <p className="mt-4 text-lg text-gray-600">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12 text-gray-700 space-y-6 text-base leading-relaxed">
          <p>
            At Anmol Vastralay, we value your trust and respect your privacy. This Privacy Policy describes how we collect, use, and protect your personal information when you use our website.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-100 pb-4 mt-12 mb-6">1. Information We Collect</h2>
          <p>We may collect the following types of information when you register, make a purchase, or interact with our site:</p>
          <ul className="list-disc pl-6 space-y-3 my-6 text-gray-600">
            <li><strong>Personal Identification Information:</strong> Name, email address, phone number, shipping and billing addresses.</li>
            <li><strong>Payment Information:</strong> We do not store your full credit card details. All transactions are processed through secure, encrypted, industry-standard payment gateways.</li>
            <li><strong>Usage Data:</strong> Information about how you interact with our website, such as IP address, browser type, pages visited, and time spent.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-100 pb-4 mt-12 mb-6">2. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul className="list-disc pl-6 space-y-3 my-6 text-gray-600">
            <li>Process and fulfill your orders, including sending emails regarding your order status and shipping updates.</li>
            <li>Improve our website functionality and customer service experience.</li>
            <li>Send periodic promotional emails about new products, special offers, or other information (you can opt-out at any time).</li>
            <li>Prevent fraudulent transactions and secure our platform.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-100 pb-4 mt-12 mb-6">3. Information Sharing</h2>
          <p>
            We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties. This does not include trusted third parties who assist us in operating our website, conducting our business, or servicing you (such as courier partners like Delhivery/BlueDart and payment gateways), so long as those parties agree to keep this information confidential.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-100 pb-4 mt-12 mb-6">4. Cookies</h2>
          <p>
            Our website uses "cookies" to enhance your shopping experience. Cookies are small files stored on your device that help us remember your cart items, understand your preferences, and track site usage data. You can choose to turn off cookies through your browser settings, but some features of the site may not function properly.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-100 pb-4 mt-12 mb-6">5. Data Security</h2>
          <p>
            We implement a variety of security measures to maintain the safety of your personal information. Your personal data is contained behind secured networks and is only accessible by a limited number of persons who have special access rights and are required to keep the information confidential.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-100 pb-4 mt-12 mb-6">6. Your Rights</h2>
          <p>
            You have the right to access, correct, or delete your personal information stored with us. You can do this by logging into your account or by contacting us directly.
          </p>

          <div className="mt-12 p-6 bg-gray-50 rounded-lg border border-gray-200 text-center">
            <h3 className="font-bold text-gray-900 mb-2">Questions regarding this policy?</h3>
            <p className="text-gray-600 text-sm">
              Contact us at <a href="mailto:anmolvastralay@gmail.com" className="text-[#85142b] font-semibold hover:underline">anmolvastralay@gmail.com</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
