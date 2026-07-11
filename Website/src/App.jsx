import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger, SplitText } from 'gsap/all';

import About from './components/About.jsx';
import Competitions from './components/Competitions.jsx';
import Contact from './components/Contact.jsx';
import Events from './components/Events.jsx';
import Hero from './components/Hero.jsx';
import Merch from './components/Merch.jsx';
import Navbar from './components/Navbar.jsx';

gsap.registerPlugin(ScrollTrigger, SplitText);

const App = () => {
	useGSAP(() => {
		const loader = document.querySelector('.intro-loader');

		if (!loader || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			gsap.set(loader, { display: 'none' });
			return;
		}

		const count = { value: 0 };

		gsap.timeline()
			.to(count, {
				value: 100,
				duration: 1.1,
				ease: 'power2.inOut',
				onUpdate: () => {
					const counter = document.querySelector('.intro-count');
					if (counter) counter.textContent = `${Math.round(count.value)}%`;
				},
			})
			.to('.intro-loader', {
				yPercent: -100,
				duration: 0.9,
				ease: 'power4.inOut',
			})
			.set('.intro-loader', { display: 'none' });
	});

	return (
		<main>
			<div className="intro-loader" aria-hidden="true">
				<div>Connecting</div>
				<div className="intro-count">0%</div>
			</div>
			<Navbar />
			<Hero />
			<About />
			<Events />
			<Competitions />
			<Merch />
			<Contact />
		</main>
	);
};

export default App;
