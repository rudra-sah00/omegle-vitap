import Link from "next/link";
import { Card } from "@/components/ui";

export default function InfoBox() {
  return (
    <Card className="mb-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect with Strangers</h2>
        <p className="text-gray-700 text-base mb-4">
          Experience anonymous conversations with people from around the world. 
          You'll be randomly paired with another person for a one-on-one conversation.
        </p>
        <p className="text-gray-700 text-base mb-4">
          Our platform provides a safe and respectful environment for meaningful interactions. 
          Please follow our community guidelines to ensure a positive experience for everyone.
        </p>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">Community Guidelines</h3>
        <ul className="text-sm text-gray-700 space-y-2">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Be respectful and courteous to all users</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>No nudity, sexual content, or inappropriate behavior</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Do not share personal information (address, phone number, etc.)</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>No harassment, bullying, or hate speech</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>You must be 18 years or older to use this service</span>
          </li>
        </ul>
      </div>

      <p className="text-gray-600 text-sm mb-4 text-center">
        By using this service, you agree to our policies and guidelines.
      </p>
      
      <div className="flex justify-center gap-4">
        <Link 
          href="/terms" 
          className="text-gray-900 hover:text-gray-700 underline text-sm font-medium"
        >
          Terms of Service
        </Link>
        <span className="text-gray-400">•</span>
        <Link 
          href="/privacy" 
          className="text-gray-900 hover:text-gray-700 underline text-sm font-medium"
        >
          Privacy Policy
        </Link>
      </div>
    </Card>
  );
}
