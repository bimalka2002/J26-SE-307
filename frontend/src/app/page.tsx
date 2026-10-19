import { Navbar } from "@/components/home/Navbar";
import { Hero } from "@/components/home/Hero";
import { HeroBackground } from "@/components/home/HeroBackground";
import { HowItWorks } from "@/components/home/HowItWorks";
import { Conditions } from "@/components/home/Conditions";
import { Features } from "@/components/home/Features";
import { Faq } from "@/components/home/Faq";
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
        <Conditions />
        <Features />
        <Faq />
      </main>
      <Footer />
    </div>
  );
}
