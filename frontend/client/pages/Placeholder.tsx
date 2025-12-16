import { Layout as LayoutIcon } from 'lucide-react';
import Layout from '@/components/Layout';

export default function Placeholder() {
  return (
    <Layout>
      <div className="p-4 md:p-8 flex items-center justify-center min-h-screen md:min-h-[calc(100vh-4rem)]">
        <div className="text-center max-w-md">
          <div className="mb-6 flex justify-center">
            <div className="p-4 bg-blue-950 bg-opacity-30 rounded-lg">
              <LayoutIcon className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Page Coming Soon</h1>
          <p className="text-muted-foreground mb-6">
            This page is under development. Continue interacting with the app to see more features!
          </p>
          <p className="text-sm text-muted-foreground italic">
            Hint: Ask the AI assistant to implement more pages and features for this dashboard.
          </p>
        </div>
      </div>
    </Layout>
  );
}
