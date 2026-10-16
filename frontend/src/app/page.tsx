import { Navbar } from "@/components/home/Navbar";
import { Hero } from "@/components/home/Hero";
import { HeroBackground } from "@/components/home/HeroBackground";
import { HowItWorks } from "@/components/home/HowItWorks";
import { Features } from "@/components/home/Features";
import { Footer } from "@/components/home/Footer";

export default function Home() {
  return (
    <div className="dv-page">
      <Navbar />
      <div className="dv-hero-shell">
        <HeroBackground />
        <Hero />
      </div>
      <main>
        <HowItWorks />
        <Features />
      </main>
      <Footer />
    </div>
  );
}
