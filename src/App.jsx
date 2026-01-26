import React from 'react'
import gsap from 'gsap'
import Navbar from './components/Navbar'
import Hero from './Components/Hero.jsx'
import {ScrollTrigger, SplitText} from "gsap/all";
gsap.registerPlugin(ScrollTrigger, SplitText);


const App = () => {
    return (
        <main>
            <Navbar />
            <Hero />
        </main>
    )
}
export default App