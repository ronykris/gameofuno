import Hero from "@/components/homePage/Hero"
import Navbar from "@/components/homePage/Navbar"
import About from "@/components/homePage/About"
import Footer from "@/components/homePage/Footer"
import Quote from "@/components/homePage/Quote"
import Feature from "@/components/homePage/Feature"
import Partner from "@/components/homePage/Partner"
import Procedure from "@/components/homePage/Procedure"


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
          {/* <Quote /> */}
          <Footer />
        </div>
      </div>
    </main>
  )
}