import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase, Page } from '../lib/supabase';
import Header from '../components/Header';
import Footer from '../components/Footer';

interface PageViewProps {
  settings: Record<string, string>;
  navItems: Record<string, any[]>;
  headerNavItems: any[];
}

export default function PageView({ settings, navItems, headerNavItems }: PageViewProps) {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadPage();
  }, [slug]);

  async function loadPage() {
    try {
      setLoading(true);
      setError(false);

      const { data, error: pageError } = await supabase
        .from('pages')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (pageError) throw pageError;

      if (!data) {
        setError(true);
      } else {
        setPage(data);
      }
    } catch (err) {
      console.error('Error loading page:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-blue-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen">
        <Header navItems={headerNavItems} />
        <div className="pt-24 pb-16 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Page Not Found</h1>
            <p className="text-gray-600 mb-8">The page you're looking for doesn't exist.</p>
            <Link
              to="/"
              className="px-6 py-3 bg-[#29b371] text-white rounded-lg font-semibold hover:bg-[#22a065] transition-all"
            >
              Go Home
            </Link>
          </div>
        </div>
        <Footer settings={settings} navItems={navItems} />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header navItems={headerNavItems} />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-6 max-w-4xl">
          <Link
            to="/"
            className="inline-flex items-center text-[#29b371] hover:text-[#22a065] mb-8 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">{page.title}</h1>

          <div
            className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700 prose-a:text-[#29b371] hover:prose-a:text-[#22a065]"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        </div>
      </main>
      <Footer settings={settings} navItems={navItems} />
    </div>
  );
}
