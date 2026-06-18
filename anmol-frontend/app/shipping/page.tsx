import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shipping & Returns Policy',
  description: 'Learn about Anmol Vastralay\'s fast delivery across India, free shipping on eligible orders, and our 7-day hassle-free return and refund policy.',
  keywords: ['shipping policy', 'return policy', 'Anmol Vastralay returns', 'clothing returns', 'fast delivery in India', 'free shipping'],
};

export default function ShippingReturnsPage() {
  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Shipping & Returns</h1>
          <p className="mt-4 text-lg text-gray-600">
            Everything you need to know about deliveries and our hassle-free return policy.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12 text-gray-700 space-y-6 text-base leading-relaxed">
          <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-100 pb-4 mb-6">Shipping Policy</h2>
          
          <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">1. Processing Time</h3>
          <p>
            All orders are processed within 1 to 2 business days (excluding weekends and holidays) after receiving your order confirmation email. You will receive another notification when your order has shipped.
          </p>

          <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">2. Domestic Shipping Rates and Estimates</h3>
          <p>
            We offer <strong>Free Standard Shipping</strong> on all orders above ₹999 across India.
          </p>
          <ul className="list-disc pl-6 space-y-3 my-6 text-gray-600">
            <li><strong>Standard Shipping:</strong> 5-7 business days (Free for orders over ₹999, otherwise ₹50)</li>
            <li><strong>Express Shipping:</strong> 2-3 business days (₹150 flat rate)</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">3. In-Store Pickup</h3>
          <p>
            You can skip the shipping fees with free local pickup at our Gopalganj store. After placing your order and selecting local pickup at checkout, your order will be prepared and ready for pick up within 1 business day. We will send you an email when your order is ready along with instructions.
          </p>
          
          <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-100 pb-4 mt-12 mb-6">Returns & Refund Policy</h2>
          
          <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">1. 7-Day Hassle-Free Returns</h3>
          <p>
            We want you to be completely satisfied with your purchase. If you are not entirely happy, we offer a 7-day return policy. This means you have 7 days after receiving your item to request a return.
          </p>

          <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">2. Eligibility for Returns</h3>
          <p>To be eligible for a return, your item must be in the same condition that you received it:</p>
          <ul className="list-disc pl-6 space-y-3 my-6 text-gray-600">
            <li>Unworn, unwashed, and unused</li>
            <li>With all original tags still attached</li>
            <li>In its original packaging</li>
          </ul>
          <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-md">
            <strong>Note:</strong> For hygiene reasons, innerwear, lingerie, and certain accessories cannot be returned or exchanged unless there is a manufacturing defect.
          </p>

          <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">3. How to Initiate a Return</h3>
          <p>
            To start a return, you can log into your <strong>My Account</strong> section, navigate to your orders, and click on the "Request Return" button next to the eligible item. Alternatively, you can contact us at <strong>anmolvastralay@gmail.com</strong>.
          </p>
          <p>
            Once your return is accepted, we will arrange a return pickup from your delivery address. You do not need to ship the item yourself.
          </p>

          <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">4. Refunds</h3>
          <p>
            We will notify you once we’ve received and inspected your return. If approved, you’ll be automatically refunded on your original payment method within 5-7 business days. Please remember it can take some time for your bank or credit card company to process and post the refund too.
          </p>
          <p>
            For Cash on Delivery (COD) orders, we will request your bank account details or UPI ID to transfer the refund amount.
          </p>
        </div>
      </div>
    </div>
  );
}
