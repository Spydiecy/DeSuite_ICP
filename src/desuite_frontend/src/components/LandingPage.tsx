import React, { useEffect } from 'react';
import { Parallax } from 'react-parallax';
import { Link } from 'react-router-dom';
import { 
  ShieldCheckIcon, 
  LockClosedIcon, 
  CloudIcon, 
  DocumentIcon,
  PencilIcon,
  PhotoIcon,
  CalendarIcon,
  ChartBarIcon,
  FolderIcon,
  CogIcon, 
  CubeIcon, 
  GlobeAltIcon 
} from '@heroicons/react/24/outline';
import AOS from 'aos';
import 'aos/dist/aos.css';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
    });
  }, []);

  return (
    <div className="bg-black text-white">
      <div className="duotone-effect">
        <Parallax
          blur={0}
          bgImage="https://raw.githubusercontent.com/Spydiecy/dfinityguard_Notes/main/src/dfinityguard_notes_frontend/assets/download.jpg"
          bgImageAlt="Secure digital world"
          strength={200}
          bgClassName="image-filter"
        >
          <div className="absolute inset-0 bg-black opacity-30"></div>
          <div className="relative z-10 flex items-center justify-center h-screen">
            <div className="text-center px-4">
              <h1 className="text-5xl md:text-7xl font-bold mb-4 animate-fade-in-down">DeSuite</h1>
              <p className="text-xl md:text-2xl mb-8 animate-fade-in-up">
                Your Complete Digital Workspace - Secure, Decentralized, Unstoppable
              </p>
              <Link
                to="/register"
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-8 rounded-full transition duration-300 transform hover:scale-105 animate-pulse"
              >
                Get Started
              </Link>
            </div>
          </div>
        </Parallax>
      </div>

      <section className="py-20 px-4 bg-gradient-to-b from-gray-900 to-black">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center" data-aos="fade-up">Why Choose DeSuite?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<DocumentIcon className="h-12 w-12 text-yellow-500" />}
              title="Smart Document Editor"
              description="Create and edit documents with our powerful Word processor. Export to multiple formats and save directly to your secure storage."
            />
            <FeatureCard
              icon={<PhotoIcon className="h-12 w-12 text-yellow-500" />}
              title="Photo Gallery"
              description="Organize and protect your photos with our encrypted gallery system. Access your memories securely from anywhere."
            />
            <FeatureCard
              icon={<CalendarIcon className="h-12 w-12 text-yellow-500" />}
              title="Calendar & Events"
              description="Keep track of your schedule with our integrated calendar system. Set reminders and manage events efficiently."
            />
            <FeatureCard
              icon={<ChartBarIcon className="h-12 w-12 text-yellow-500" />}
              title="Expense Tracking"
              description="Monitor your finances with our intuitive expense tracker. Get insights into your spending patterns and manage budgets."
            />
            <FeatureCard
              icon={<FolderIcon className="h-12 w-12 text-yellow-500" />}
              title="Secure File Storage"
              description="Store and manage all your files with enterprise-grade security. Support for all file types with automatic versioning."
            />
            <FeatureCard
              icon={<PencilIcon className="h-12 w-12 text-yellow-500" />}
              title="Note Taking"
              description="Create and organize notes with rich text formatting. Keep your ideas secure and accessible."
            />
          </div>
        </div>
      </section>

      <div className="duotone-effect">
        <Parallax
          blur={0}
          bgImage="https://raw.githubusercontent.com/Spydiecy/dfinityguard_Notes/main/src/dfinityguard_notes_frontend/assets/features.png"
          bgImageAlt="desuite features"
          strength={200}
          bgClassName="image-filter"
        >
          <div className="absolute inset-0 bg-black opacity-30"></div>
          <div className="relative z-10 flex items-center justify-center h-screen">
            <div className="text-center px-4">
              <h2 className="text-4xl font-bold mb-4" data-aos="fade-up">
                Your Complete Digital Workspace
              </h2>
              <p className="text-xl mb-8" data-aos="fade-up" data-aos-delay="200">
                Document editing, photo management, expense tracking, and more - all in one secure, decentralized platform.
              </p>
              <Link
                to="/learn-more"
                className="bg-transparent hover:bg-yellow-500 text-yellow-500 hover:text-black font-bold py-3 px-8 border border-yellow-500 hover:border-transparent rounded-full transition duration-300 transform hover:scale-105"
                data-aos="fade-up" data-aos-delay="400"
              >
                Learn More
              </Link>
            </div>
          </div>
        </Parallax>
      </div>

      <section className="py-20 px-4 bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center" data-aos="fade-up">How It Works</h2>
          <div className="space-y-12">
            <Step
              number={1}
              title="Create Your Workspace"
              description="Sign up and instantly get access to your complete suite of productivity tools - from document editing to expense tracking."
            />
            <Step
              number={2}
              title="Secure Your Data"
              description="All your files, documents, and data are automatically encrypted before being stored on the Internet Computer's secure network."
            />
            <Step
              number={3}
              title="Work Seamlessly"
              description="Create documents, manage files, track expenses, and organize your schedule - all from one integrated platform."
            />
            <Step
              number={4}
              title="Access Anywhere"
              description="Use DeSuite from any device, anywhere in the world. Your workspace follows you with real-time synchronization."
            />
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-yellow-500 text-black">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-8" data-aos="fade-up">
            Transform Your Digital Workspace Today
          </h2>
          <p className="text-xl mb-12" data-aos="fade-up" data-aos-delay="200">
            Join DeSuite and experience the future of secure, decentralized productivity tools.
          </p>
          <Link
            to="/register"
            className="bg-black hover:bg-gray-800 text-yellow-500 font-bold py-3 px-8 rounded-full transition duration-300 transform hover:scale-105"
            data-aos="fade-up" data-aos-delay="400"
          >
            Create Your Account
          </Link>
        </div>
      </section>

      <footer className="bg-black py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">DeSuite</h3>
              <p className="text-gray-400">Securing your digital future, today.</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link to="/about" className="hover:text-yellow-500 transition duration-300">About Us</Link></li>
                <li><Link to="/features" className="hover:text-yellow-500 transition duration-300">Features</Link></li>
                <li><Link to="/pricing" className="hover:text-yellow-500 transition duration-300">Pricing</Link></li>
                <li><Link to="/contact" className="hover:text-yellow-500 transition duration-300">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link to="/privacy" className="hover:text-yellow-500 transition duration-300">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-yellow-500 transition duration-300">Terms of Service</Link></li>
                <li><Link to="/cookies" className="hover:text-yellow-500 transition duration-300">Cookie Policy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Connect</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-yellow-500 transition duration-300">Twitter</a></li>
                <li><a href="#" className="hover:text-yellow-500 transition duration-300">LinkedIn</a></li>
                <li><a href="#" className="hover:text-yellow-500 transition duration-300">GitHub</a></li>
                <li><a href="#" className="hover:text-yellow-500 transition duration-300">Discord</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; 2024 DeSuite. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => {
  return (
    <div className="bg-gray-800 p-6 rounded-lg text-center transition duration-300 transform hover:scale-105 hover:shadow-lg" data-aos="fade-up">
      <div className="flex justify-center mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
};

const Step: React.FC<{ number: number; title: string; description: string }> = ({ number, title, description }) => {
  return (
    <div className="flex items-start space-x-4" data-aos="fade-up">
      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-yellow-500 text-black flex items-center justify-center text-2xl font-bold">
        {number}
      </div>
      <div>
        <h3 className="text-2xl font-bold mb-2">{title}</h3>
        <p className="text-gray-400">{description}</p>
      </div>
    </div>
  );
};

export default LandingPage;