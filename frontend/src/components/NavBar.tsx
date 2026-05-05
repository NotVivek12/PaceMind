import Link from 'next/link';

export default function NavBar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center px-8 py-6 backdrop-blur-md bg-[#0a0a0f]/80 border-b border-white/5">
      <div className="flex items-center gap-10">
        {/* Left Links */}
        <div className="flex items-center gap-8">
          <Link 
            href="/" 
            className="text-sm font-medium text-white/70 transition-all duration-300 hover:text-white hover:[text-shadow:0_0_10px_rgba(167,139,250,0.8)]"
          >
            Home
          </Link>
          <Link 
            href="#features" 
            className="text-sm font-medium text-white/70 transition-all duration-300 hover:text-white hover:[text-shadow:0_0_10px_rgba(167,139,250,0.8)]"
          >
            Features
          </Link>
        </div>

        {/* Center Logo */}
        <Link 
          href="/" 
          className="text-2xl font-bold tracking-widest text-white transition-all duration-300 hover:[text-shadow:0_0_15px_rgba(167,139,250,1)]"
        >
          PACEMIND
        </Link>

        {/* Right Links */}
        <div className="flex items-center gap-8">
          <Link 
            href="#about" 
            className="text-sm font-medium text-white/70 transition-all duration-300 hover:text-white hover:[text-shadow:0_0_10px_rgba(167,139,250,0.8)]"
          >
            About
          </Link>
          <Link 
            href="#contact" 
            className="text-sm font-medium text-white/70 transition-all duration-300 hover:text-white hover:[text-shadow:0_0_10px_rgba(167,139,250,0.8)]"
          >
            Contact
          </Link>
        </div>
      </div>
    </nav>
  );
}
