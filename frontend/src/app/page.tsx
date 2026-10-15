import { Navbar } from "@/components/home/Navbar";
import { Hero } from "@/components/home/Hero";
import { HeroBackground } from "@/components/home/HeroBackground";
import { Membership } from "@/components/home/Membership";
import { Footer } from "@/components/home/Footer";

export default function Home() {
  return (
    <div className="dv-page">
      <div className="dv-hero-shell">
        <HeroBackground />
        <Navbar />
        <Hero />
      </div>
      <main>
        <Membership />
      </main>
      <Footer />
    </div>
  );
}
