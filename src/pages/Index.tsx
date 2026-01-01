import { Navbar } from '@/components/Navbar';
import { ParticleField } from '@/components/ParticleField';
import { HeroSection } from '@/components/HeroSection';
import { ChallengeTypes } from '@/components/ChallengeTypes';
import { HowItWorks } from '@/components/HowItWorks';
import { LiveMatches } from '@/components/LiveMatches';
import { Leaderboard } from '@/components/Leaderboard';
import { CTASection } from '@/components/CTASection';
import { Footer } from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <ParticleField />
      <Navbar />
      <main className="relative z-10 pt-20">
        <HeroSection />
        <ChallengeTypes />
        <HowItWorks />
        <LiveMatches />
        <Leaderboard />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
