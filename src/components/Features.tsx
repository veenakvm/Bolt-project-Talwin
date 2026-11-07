import {
  Brain, Target, Rocket, TrendingUp, MessageSquare, LineChart,
  Users, Zap, Shield, Settings, BarChart, Mail,
  DollarSign, Smartphone, Globe, Database
} from 'lucide-react';
import { Section } from '../lib/supabase';

interface FeaturesProps {
  section: Section | null;
}

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Business Coaching',
    description: 'Get personalized strategies and insights tailored to your business goals with advanced AI that learns and adapts to your needs.',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=250&fit=crop'
  },
  {
    icon: Target,
    title: 'Smart Lead Generation',
    description: 'Automated lead capture, qualification, and nurturing systems that fill your pipeline with high-quality prospects.',
    image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=400&h=250&fit=crop'
  },
  {
    icon: MessageSquare,
    title: 'Intelligent Sales Automation',
    description: 'Automate your entire sales process from first contact to closing deals with AI-driven sequences.',
    image: 'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?w=400&h=250&fit=crop'
  },
  {
    icon: TrendingUp,
    title: 'Revenue Optimization',
    description: 'Real-time analytics and AI recommendations to maximize your revenue streams and identify growth opportunities.',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop'
  },
  {
    icon: LineChart,
    title: 'Performance Analytics',
    description: 'Comprehensive dashboards showing all key metrics, conversion rates, and business performance in real-time.',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop'
  },
  {
    icon: Rocket,
    title: 'Scalable Infrastructure',
    description: 'Cloud-based systems that grow with your business, handling increased volume without compromising performance.',
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=250&fit=crop'
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Connect your entire team with shared dashboards, task management, and real-time communication tools.',
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=250&fit=crop'
  },
  {
    icon: Zap,
    title: 'Workflow Automation',
    description: 'Automate repetitive tasks and create custom workflows that save hours of manual work every day.',
    image: 'https://images.unsplash.com/photo-1535378620166-273708d44e4c?w=400&h=250&fit=crop'
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Bank-level encryption, compliance certifications, and robust security protocols to protect your data.',
    image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400&h=250&fit=crop'
  },
  {
    icon: Settings,
    title: 'Custom Integrations',
    description: 'Connect with your existing tools via API or use our pre-built integrations with popular platforms.',
    image: 'https://images.unsplash.com/photo-1639322537228-f710d846310a?w=400&h=250&fit=crop'
  },
  {
    icon: BarChart,
    title: 'Advanced Reporting',
    description: 'Generate detailed reports with custom metrics, export data, and share insights with stakeholders.',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop'
  },
  {
    icon: Mail,
    title: 'Email Marketing Suite',
    description: 'Create, send, and track email campaigns with AI-powered subject line optimization and scheduling.',
    image: 'https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=400&h=250&fit=crop'
  },
  {
    icon: DollarSign,
    title: 'Revenue Tracking',
    description: 'Monitor every dollar with detailed financial tracking, forecasting, and profitability analysis tools.',
    image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400&h=250&fit=crop'
  },
  {
    icon: Smartphone,
    title: 'Mobile App',
    description: 'Manage your business on-the-go with our fully-featured mobile app for iOS and Android.',
    image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=250&fit=crop'
  },
  {
    icon: Globe,
    title: 'Multi-Channel Marketing',
    description: 'Reach customers across email, SMS, social media, and web with unified campaign management.',
    image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=250&fit=crop'
  },
  {
    icon: Database,
    title: 'Data Management',
    description: 'Centralized customer data platform with intelligent segmentation and audience building capabilities.',
    image: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400&h=250&fit=crop'
  }
];

export default function Features({ section }: FeaturesProps) {
  const title = section?.title || 'Everything Your Business Needs to Thrive';
  const subtitle = section?.subtitle || 'Comprehensive solutions that work together seamlessly';

  return (
    <section id="features" className="py-24 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            {title}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group bg-white rounded-2xl overflow-hidden border-2 border-gray-100 hover:border-[#29b371] hover:shadow-xl transition-all duration-300"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={feature.image}
                  alt={feature.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                <div className="absolute bottom-4 left-4 inline-flex p-3 rounded-xl bg-white/90 backdrop-blur-sm">
                  <feature.icon className="text-[#29b371]" size={28} />
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>

                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
