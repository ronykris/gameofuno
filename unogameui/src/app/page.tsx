import Navbar from "@/components/homePage/Navbar"
import Hero from "@/components/homePage/Hero"
import About from "@/components/homePage/About"
import Footer from "@/components/homePage/Footer"
import Quote from "@/components/homePage/Quote"
import Explore from "@/components/homePage/Explore"


export default function Home() {

  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <div className="w-full overflow-hidden">
        <Navbar />
        <Hero />
        <div className="relative">
          <About />
          <Explore />
        </div>
        <div className="relative">
          <Quote />
        </div>
        <div className="relative">
          <Footer />
        </div>
      </div>
    </main>
  )
}