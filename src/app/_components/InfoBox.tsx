import Link from "next/link";
import { Card } from "@/components/ui";

export default function InfoBox() {
  return (
    <Card className="mb-8">
      <p className="text-gray-700 text-sm mb-4">
        ChatConnect lets you chat with strangers anonymously. When you use ChatConnect, 
        you are paired randomly with another person to talk one-on-one. If you 
        prefer, you can add your interests and you'll be randomly paired with 
        someone who selected some of the same interests.
      </p>
      <p className="text-gray-700 text-sm mb-4">
        By using ChatConnect, you accept the terms at the bottom of the page.
      </p>
      <div className="flex justify-center">
        <Link 
          href="/terms" 
          className="text-blue-600 hover:text-blue-800 underline text-sm"
        >
          Terms of Service
        </Link>
      </div>
    </Card>
  );
}
