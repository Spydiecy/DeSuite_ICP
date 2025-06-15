import React, { useEffect } from 'react';
import { Parallax } from 'react-parallax';
import { Link } from 'react-router-dom';
import { ShieldCheckIcon, LockClosedIcon, CloudIcon, CogIcon, CubeIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
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
              <h1 className="text-5xl md:text-7xl font-bold mb-4 animate-fade-in-down">Desuite</h1>
              <p className="text-xl md:text-2xl mb-8 animate-fade-in-up">Secure, Decentralized, Unstoppable</p>
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
          <h2 className="text-4xl font-bold mb-12 text-center" data-aos="fade-up">Why Choose Desuite?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<ShieldCheckIcon className="h-12 w-12 text-yellow-500" />}
              title="Unbreakable Security"
              description="Built on the Internet Computer, ensuring the highest level of security for your data."
            />
            <FeatureCard
              icon={<LockClosedIcon className="h-12 w-12 text-yellow-500" />}
              title="Privacy First"
              description="Your data is encrypted and only accessible by you. We can't see it, no one else can."
            />
            <FeatureCard
              icon={<CloudIcon className="h-12 w-12 text-yellow-500" />}
              title="Decentralized Storage"
              description="No central point of failure. Your data is distributed across the network."
            />
            <FeatureCard
              icon={<CogIcon className="h-12 w-12 text-yellow-500" />}
              title="Seamless Integration"
              description="Easily integrate with other dapps in the Internet Computer ecosystem."
            />
            <FeatureCard
              icon={<CubeIcon className="h-12 w-12 text-yellow-500" />}
              title="Smart Contract Powered"
              description="Leverage the power of smart contracts for advanced security features."
            />
            <FeatureCard
              icon={<GlobeAltIcon className="h-12 w-12 text-yellow-500" />}
              title="Global Accessibility"
              description="Access your data from anywhere in the world, anytime."
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
              <h2 className="text-4xl font-bold mb-4" data-aos="fade-up">Experience the Future of Data Security</h2>
              <p className="text-xl mb-8" data-aos="fade-up" data-aos-delay="200">Join thousands of users who trust desuite with their sensitive information.</p>
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
              title="Create Your Account"
              description="Sign up with your email and create a strong password. Your account is your gateway to secure, decentralized data management."
            />
            <Step
              number={2}
              title="Encrypt Your Data"
              description="All your data is automatically encrypted using state-of-the-art encryption algorithms before being stored on the Internet Computer."
            />
            <Step
              number={3}
              title="Access Anywhere"
              description="Use your credentials to access your data from any device, anywhere in the world. Your data follows you, securely."
            />
            <Step
              number={4}
              title="Integrate and Expand"
              description="Connect desuite with other dapps in the ecosystem to expand its functionality and your digital capabilities."
            />
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-yellow-500 text-black">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-8" data-aos="fade-up">Ready to Get Started?</h2>
          <p className="text-xl mb-12" data-aos="fade-up" data-aos-delay="200">Join DeSuite today and take control of your digital identity.</p>
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