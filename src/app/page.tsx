import Image from "next/image";
import StockTable from "@/components/StockTable";
import LogoutButton from "@/components/LogoutButton";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Funda Express"
                width={180}
                height={50}
                className="h-10 w-auto"
                priority
              />
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden sm:block text-xs text-gray-400 font-medium">
                Stock Manager
              </span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <StockTable />
      </main>
    </div>
  );
}
