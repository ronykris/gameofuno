import Hero from "@/components/homepage/Hero"
import Navbar from "@/components/homepage/Navbar"
import About from "@/components/homepage/About"
import Footer from "@/components/homepage/Footer"
import Feature from "@/components/homepage/Feature"
import Partner from "@/components/homepage/Partner"
import Procedure from "@/components/homepage/Procedure"


export default function Home() {
  return (
    <main className="bg-black overflow-hidden">
      <div className="">
        <Navbar />
        <Hero />
        <div className="relative">
          <About />
          <Feature />
          <Partner />
          <Procedure />
        </div>
        <div className="relative">
          <Footer />
        </div>
      </div>
    </main>
  )
}