import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

import { chapterPhotos } from '../../constants/index.js';

const Hero = () => {
	useGSAP(() => {
		gsap.from('.hero-copy > *', {
			opacity: 0,
			y: 56,
			duration: 1,
			ease: 'power4.out',
			stagger: 0.12,
			delay: 1.35,
		});

		gsap.from('.hero-photo', {
			opacity: 0,
			clipPath: 'inset(100% 0 0 0)',
			y: 42,
			duration: 1.1,
			ease: 'power4.out',
			stagger: 0.08,
			delay: 1.55,
		});

		gsap.to('.hero-gallery', {
			yPercent: -8,
			ease: 'none',
			scrollTrigger: {
				trigger: '#home',
				start: 'top top',
				end: 'bottom top',
				scrub: true,
			},
		});
	});

	return (
		<section id="home" className="hero-section noisy">
			<div className="hero-shell">
				<div className="hero-copy">
					<p className="eyebrow">Parsippany High School</p>
					<h1>Business leaders in motion.</h1>
					<p className="hero-lede">
						PHS DECA builds the confidence, clarity, and competitive edge students need
						to present ideas that land.
					</p>

					<div className="hero-actions">
						<a href="#events">View updates</a>
						<a href="#contact">Join the Chapter</a>
					</div>

					<div className="hero-scroll">scroll down</div>
				</div>

				<div className="hero-gallery" aria-label="PHS DECA chapter photos">
					<img className="hero-photo hero-main" src={chapterPhotos[0]} alt="PHS DECA members at a conference" />
					<img className="hero-photo" src={chapterPhotos[1]} alt="PHS DECA members in professional dress" />
					<img className="hero-photo" src={chapterPhotos[4]} alt="DECA award celebration" />
				</div>
			</div>
		</section>
	);
};

export default Hero;
