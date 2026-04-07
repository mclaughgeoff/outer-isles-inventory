import Sidebar from './Sidebar';

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="max-w-[1400px] mx-auto px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
